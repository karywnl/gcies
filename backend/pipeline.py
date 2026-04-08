import os
import re
import json
import logging
import concurrent.futures
from typing import Dict

import requests
import wikipediaapi
import spacy
from groq import Groq
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)

# Constants
USER_AGENT = "GCIES-App (contact@gcies.app)"
MAX_NER_CHARS = 5_000  # Truncate text before SpaCy NER to limit processing time
PRIMARY_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"

# Initialize Wikipedia API
wiki_wiki = wikipediaapi.Wikipedia(USER_AGENT, 'en')

# Load SpaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", "mock_key").strip())

def search_wikipedia_candidates(query: str) -> list:
    """
    Uses a single Wikipedia API call (generator=search + prop=pageprops) to find
    geographical candidates with their descriptions for autocomplete.
    Previously required 2 sequential calls (opensearch → pageprops).
    """
    url = "https://en.wikipedia.org/w/api.php"
    headers = {"User-Agent": USER_AGENT}
    geo_keywords = [
        "city", "town", "village", "municipality", "settlement", "capital",
        "district", "state", "country", "neighborhood", "territory", "island",
        "county", "province", "region", "place", "location", "hamlet",
        "suburb", "borough", "township", "parish",
    ]
    try:
        res = requests.get(url, params={
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrlimit": 15,
            "gsrnamespace": 0,
            "prop": "pageprops",
            "format": "json",
        }, headers=headers, timeout=5).json()

        pages = res.get("query", {}).get("pages", {})
        # Sort by search relevance index so the best match appears first
        ordered = sorted(pages.values(), key=lambda p: p.get("index", 999))

        skip_types = [
            "constituency", "electoral", "assembly segment", "lok sabha",
            "rajya sabha", "legislative", "parliament", "ward", "taluk",
            "mandal", "tehsil", "census", "pincode", "zip code",
        ]

        results = []
        for page_data in ordered:
            desc = page_data.get("pageprops", {}).get("wikibase-shortdesc", "")
            title = page_data.get("title", "")
            desc_lower = desc.lower()
            title_lower = title.lower()

            # Skip political/administrative subdivisions that aren't places
            if any(kw in desc_lower or kw in title_lower for kw in skip_types):
                continue

            if any(kw in desc_lower for kw in geo_keywords):
                results.append({
                    "title": title,
                    "description": desc,
                    "source": "wikipedia",
                })
                if len(results) >= 5:
                    break

        return results
    except Exception as e:
        logger.warning("Error fetching Wikipedia candidates: %s", e)

    return []

def search_onefivenine_candidates(query: str) -> list:
    """Uses OneFiveNine autoComplete endpoint to find matching villages."""
    url = "https://www.onefivenine.com/autoComplete.dont?method=completeVillages"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        res = requests.post(url, data={"queryString": query}, headers=headers, timeout=5)
        if res.status_code == 200 and res.text.strip():
            soup = BeautifulSoup(res.text, 'html.parser')
            results = []
            for li in soup.find_all('li'):
                onclick = li.get('onclick', '')
                match = re.search(r"fill\('([^']+)'\)", onclick)
                if match:
                    path = match.group(1)
                    title = li.get_text(strip=True)
                    # Example title: Thandampalayam,Satyamangalam
                    results.append({
                        "title": title,
                        "description": "Village in India",
                        "source": "onefivenine",
                        "path": path
                    })
                    if len(results) >= 5:
                        break
            return results
    except Exception as e:
        logger.warning("Error fetching OneFiveNine candidates: %s", e)

    return []

def geocode_location(location_name: str) -> dict:
    """Uses Nominatim (OpenStreetMap) to get lat/lon coordinates for a location name."""
    url = "https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": USER_AGENT}
    try:
        res = requests.get(
            url,
            params={"q": location_name, "format": "json", "limit": 1},
            headers=headers,
            timeout=5,
        ).json()
        if res:
            return {"lat": float(res[0]["lat"]), "lon": float(res[0]["lon"])}
    except Exception as e:
        logger.warning("Geocoding failed for %s: %s", location_name, e)
    return {}

def fetch_onefivenine_data(path: str) -> dict:
    """Scrapes raw text from a specific OneFiveNine village page."""

    url = f"https://www.onefivenine.com/india/villages/{path}"
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        res = requests.get(url, headers=headers, timeout=8)
    except Exception as e:
        logger.warning("Error fetching OneFiveNine data: %s", e)
        raise ValueError(f"Could not load OneFiveNine page for path: {path}")

    if res.status_code != 200:
        raise ValueError(f"Could not load OneFiveNine page for path: {path}")

    soup = BeautifulSoup(res.text, 'html.parser')

    # Extract Title gracefully
    title_element = soup.find('h1') or soup.find('title')
    title = title_element.get_text(strip=True) if title_element else path.split('/')[-1]

    # OneFiveNine pages are quite messy, `stripped_strings` drops script tags implicitly for most parts,
    # but removing style/script elements is safer.
    for script_or_style in soup(['script', 'style', 'nav', 'footer']):
        script_or_style.decompose()

    text = ". ".join(soup.stripped_strings)

    # Distance Ambiguity Fix
    # The bottom of the page lists distant things like "Colleges near X" or "HOW TO REACH X".
    cutoff_match = re.search(r"(HOW TO REACH|Colleges near|Colleges in|Schools near|Schools in|Petrol Bunks in)", text, re.IGNORECASE)
    if cutoff_match:
        text = text[:cutoff_match.start()]

    # Geocode the village for map display
    coords = geocode_location(title)
    quick_facts = {"coordinates": coords} if coords else {}

    return {
        "text": text,
        "summary": text[:500],
        "title": title,
        "image_url": None,
        "image_urls": [],
        "quick_facts": quick_facts,
    }

def get_best_wikipedia_title(query: str) -> tuple:
    """
    Returns (best_title, wikidata_qid) for the best matching geographical article.

    Uses a single Wikipedia API call (generator=search with prop=coordinates|pageprops|extracts)
    instead of two sequential calls (opensearch → props). The QID is extracted here so the
    caller can skip the redundant QID lookup inside fetch_wikidata_facts.
    """
    url = "https://en.wikipedia.org/w/api.php"

    parts = [p.strip() for p in query.split(",")]
    primary_query = parts[0]
    context_terms = [p.lower() for p in parts[1:] if p.strip()]

    headers = {"User-Agent": USER_AGENT}
    try:
        res = requests.get(url, params={
            "action": "query",
            "generator": "search",
            "gsrsearch": primary_query,
            "gsrlimit": 10,
            "gsrnamespace": 0,
            "prop": "coordinates|pageprops|extracts",
            "exintro": 1,
            "explaintext": 1,
            "exchars": 500,
            "format": "json",
        }, headers=headers, timeout=8).json()

        pages = res.get("query", {}).get("pages", {})

        best_candidate = None
        best_qid = None
        best_score = -1

        for page_data in pages.values():
            candidate = page_data.get("title", "")
            has_coords = "coordinates" in page_data
            desc = page_data.get("pageprops", {}).get("wikibase-shortdesc", "").lower()
            extract = page_data.get("extract", "").lower()
            qid = page_data.get("pageprops", {}).get("wikibase_item")

            score = 0

            # Reward titles that closely match the query — prevents nearby places
            # like "Ariyanayagipuram (Sankarankovil)" from beating "Sankarankovil"
            candidate_lower = candidate.lower()
            query_lower = primary_query.lower()
            if candidate_lower == query_lower:
                score += 150
            elif candidate_lower.startswith(query_lower):
                score += 80

            primary_keywords = ["town", "city", "village", "municipality", "settlement", "capital"]
            if any(kw in desc for kw in primary_keywords):
                score += 50

            secondary_keywords = ["district", "state", "country", "neighborhood", "territory", "island"]
            if any(kw in desc for kw in secondary_keywords):
                score += 20

            skip_type_terms = [
                "constituency", "electoral", "assembly segment", "lok sabha",
                "rajya sabha", "legislative", "parliament", "ward",
            ]
            if any(t in desc or t in candidate.lower() for t in skip_type_terms):
                score -= 200

            if has_coords:
                score += 10

            if context_terms:
                clean_candidate = candidate.lower().replace(" ", "").replace("-", "")
                clean_desc = desc.replace(" ", "").replace("-", "")
                clean_extract = extract.replace(" ", "").replace("-", "")
                for term in context_terms:
                    clean_term = term.replace(" ", "").replace("-", "")
                    if clean_term in clean_candidate or clean_term in clean_desc or clean_term in clean_extract:
                        score += 200

            if score > 0 and score > best_score:
                best_score = score
                best_candidate = candidate
                best_qid = qid

        if best_candidate:
            return best_candidate, best_qid

    except Exception as e:
        logger.warning("Error finding best title: %s", e)

    return None, None

def fetch_wikidata_facts(wikipedia_title: str, qid: str = None) -> dict:
    """
    Fetches structured facts (population, area, country, coordinates, founded) from Wikidata.
    If qid is supplied (pre-fetched during title resolution) the Wikipedia QID lookup is skipped,
    saving one HTTP round-trip.
    """
    headers = {"User-Agent": USER_AGENT}

    if not qid:
        # QID not known yet — fetch it from Wikipedia pageprops
        try:
            res = requests.get(
                "https://en.wikipedia.org/w/api.php",
                params={"action": "query", "prop": "pageprops", "titles": wikipedia_title, "format": "json"},
                headers=headers,
                timeout=8,
            ).json()
            pages = res.get("query", {}).get("pages", {})
            for page_data in pages.values():
                qid = page_data.get("pageprops", {}).get("wikibase_item")
                break
            if not qid:
                return {}
        except Exception as e:
            logger.warning("Wikidata QID lookup failed for %s: %s", wikipedia_title, e)
            return {}

    # Step 2: fetch entity data from Wikidata
    try:
        res = requests.get(
            f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json",
            headers=headers,
            timeout=10,
        ).json()
        entities = res.get("entities", {})
        entity = entities.get(qid, {})
        claims = entity.get("claims", {})
    except Exception as e:
        logger.warning("Wikidata entity fetch failed for %s (%s): %s", wikipedia_title, qid, e)
        return {}

    def _preferred_or_first(claim_list):
        """Return the claim with rank 'preferred', or the first one."""
        if not claim_list:
            return None
        for c in claim_list:
            if c.get("rank") == "preferred":
                return c
        return claim_list[0]

    facts = {}

    # Population (P1082)
    try:
        claim = _preferred_or_first(claims.get("P1082", []))
        if claim:
            amount = claim["mainsnak"]["datavalue"]["value"]["amount"]
            facts["population"] = int(float(amount.lstrip("+")))
    except Exception:
        pass

    # Area in km² (P2046)
    try:
        claim = _preferred_or_first(claims.get("P2046", []))
        if claim:
            amount = claim["mainsnak"]["datavalue"]["value"]["amount"]
            facts["area_km2"] = round(float(amount.lstrip("+")), 2)
    except Exception:
        pass

    # Country (P17) — resolve label from the same entity data blob if available
    try:
        claim = _preferred_or_first(claims.get("P17", []))
        if claim:
            country_qid = claim["mainsnak"]["datavalue"]["value"]["id"]
            # Try to get the label from the already-fetched entity data
            country_entity = entities.get(country_qid)
            if country_entity:
                facts["country"] = country_entity["labels"].get("en", {}).get("value")
            else:
                # Fallback: fetch just the label
                label_res = requests.get(
                    "https://www.wikidata.org/w/api.php",
                    params={"action": "wbgetentities", "ids": country_qid, "props": "labels", "languages": "en", "format": "json"},
                    headers=headers,
                    timeout=5,
                ).json()
                facts["country"] = label_res["entities"][country_qid]["labels"].get("en", {}).get("value")
    except Exception:
        pass

    # Coordinates (P625)
    try:
        claim = _preferred_or_first(claims.get("P625", []))
        if claim:
            coords = claim["mainsnak"]["datavalue"]["value"]
            facts["coordinates"] = {
                "lat": coords["latitude"],
                "lon": coords["longitude"],
            }
    except Exception:
        pass

    # Founded / Inception (P571)
    try:
        claim = _preferred_or_first(claims.get("P571", []))
        if claim:
            time_str = claim["mainsnak"]["datavalue"]["value"]["time"]
            # Format: +1853-00-00T00:00:00Z → "1853"
            year_match = re.search(r"\+?(\d{1,4})-", time_str)
            if year_match:
                facts["founded"] = year_match.group(1)
    except Exception:
        pass

    return facts

def fetch_wikipedia_data(location_name: str, exact_title: str = None) -> dict:
    """Fetches raw text, images, and Wikidata facts from Wikipedia/Wikidata in parallel.

    If exact_title is supplied (e.g. from a disambiguation selection) title resolution
    is skipped entirely, preventing the backend from picking a different article.
    """
    if exact_title:
        best_title = exact_title
        qid = None  # will be resolved inside fetch_wikidata_facts
    else:
        best_title, qid = get_best_wikipedia_title(location_name)

    if not best_title:
        raise ValueError(f"Could not identify a geographical location for: '{location_name}'. Please try being more specific.")

    headers = {"User-Agent": USER_AGENT}

    def _fetch_page_text():
        return wiki_wiki.page(best_title)

    def _fetch_images():
        """
        Fetch up to 4 relevant location images for the page.

        Strategy:
          1. Wikipedia's curated 'pageimage' is always used as the primary (first) image —
             it is the representative image chosen by Wikipedia editors for this article.
          2. Supplemental images are filtered with three relevance signals:
             a. Portrait orientation (height > width) is rejected — person photos are
                almost always taller than wide, while place/landscape photos are wider.
             b. Images whose filenames contain words from the location name are scored
                higher and appear first.
             c. A minimum size of 400×250 is required for visual quality in the carousel.
        """
        url = "https://en.wikipedia.org/w/api.php"
        skip_keywords = [
            "logo", "icon", "flag", "coat", "seal", "crest", "stamp", "signature",
            "map", "locator", "relief", "blank", "arrow", "symbol", "diagram",
            "pictogram", "button", "chart", "graph", "scheme", "outline", "silhouette",
            "emblem", "badge", "placeholder", "default", "no_image", "noimage",
        ]

        def _is_bad_image(fname: str, width: int = 0, height: int = 0) -> bool:
            """Returns True if the image should be rejected."""
            fname_lower = fname.lower()
            # Reject SVGs — almost always icons/diagrams, not photos
            if fname_lower.endswith(".svg"):
                return True
            if any(kw in fname_lower for kw in skip_keywords):
                return True
            # Reject portrait orientation
            if width > 0 and height > 0 and height > width:
                return True
            # Reject tiny images
            if width > 0 and height > 0 and (width < 400 or height < 250):
                return True
            return False

        # Words from the title used to score filename relevance (e.g. "bhavani", "erode")
        location_words = [
            w for w in re.sub(r"[^a-z0-9 ]", "", best_title.lower()).split()
            if len(w) > 3
        ]

        # ── Step A: fetch primary pageimage + candidate filename list in one call ──
        primary_url = None
        primary_fname = None
        candidate_fnames = []

        try:
            res_a = requests.get(url, params={
                "action": "query",
                "titles": best_title,
                "prop": "pageimages|images",
                "pithumbsize": 1200,
                "imlimit": 30,
                "format": "json",
            }, headers=headers, timeout=8).json()

            for page_data in res_a.get("query", {}).get("pages", {}).values():
                # Wikipedia's curated representative image — filter it too
                if "thumbnail" in page_data:
                    pi_fname = "File:" + page_data.get("pageimage", "")
                    thumb = page_data["thumbnail"]
                    if not _is_bad_image(pi_fname, thumb.get("width", 0), thumb.get("height", 0)):
                        primary_url = thumb["source"]
                        primary_fname = pi_fname
                    else:
                        # Still track the fname so we skip it in candidates below
                        primary_fname = pi_fname

                # Collect other candidates, preserving page order
                for img in page_data.get("images", []):
                    fname = img.get("title", "")
                    if fname == primary_fname:
                        continue
                    if _is_bad_image(fname):
                        continue
                    candidate_fnames.append(fname)

        except Exception as e:
            logger.warning("Error fetching image list: %s", e)

        if not candidate_fnames:
            return (primary_url, [primary_url]) if primary_url else (None, [])

        # ── Step B: fetch size + URL for candidates ────────────────────────────────
        try:
            res_b = requests.get(url, params={
                "action": "query",
                "titles": "|".join(candidate_fnames[:20]),
                "prop": "imageinfo",
                "iiprop": "url|size",
                "iiurlwidth": 1000,
                "format": "json",
            }, headers=headers, timeout=8).json()

            # Build a lookup by title so we can iterate in original page order
            info_by_title = {}
            for page_data in res_b.get("query", {}).get("pages", {}).values():
                info_list = page_data.get("imageinfo", [])
                if info_list:
                    info_by_title[page_data["title"]] = info_list[0]

            scored = []
            for fname in candidate_fnames:
                info = info_by_title.get(fname)
                if not info:
                    continue
                w = info.get("width", 0)
                h = info.get("height", 0)
                thumb = info.get("thumburl") or info.get("url")

                if not thumb or _is_bad_image(fname, w, h):
                    continue

                # Score by location name match in filename
                score = 0
                fname_lower = fname.lower()
                for word in location_words:
                    if word in fname_lower:
                        score += 40
                if w > h * 1.6:
                    score += 10  # extra-wide panorama bonus

                scored.append((score, thumb))

            # Sort highest relevance first, take top 3 supplemental images
            scored.sort(key=lambda x: -x[0])
            supplemental = [u for _, u in scored[:3]]

            # Primary image first, then supplemental; deduplicate
            seen: set = set()
            final = []
            for u in ([primary_url] if primary_url else []) + supplemental:
                if u and u not in seen:
                    seen.add(u)
                    final.append(u)
            final = final[:4]

            if final:
                return final[0], final

        except Exception as e:
            logger.warning("Error fetching image info: %s", e)

        return (primary_url, [primary_url]) if primary_url else (None, [])

    # Fetch page text, images, and Wikidata facts in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        page_future = executor.submit(_fetch_page_text)
        image_future = executor.submit(_fetch_images)
        facts_future = executor.submit(fetch_wikidata_facts, best_title, qid)

        page = page_future.result()
        image_url, image_urls = image_future.result()
        quick_facts = facts_future.result()

    if not page.exists():
        raise ValueError(f"Could not find Wikipedia page for: '{location_name}' (Tried: '{best_title}')")

    return {
        "text": page.text,
        "summary": page.summary,
        "title": page.title,
        "image_url": image_url,
        "image_urls": image_urls,
        "quick_facts": quick_facts,
    }

def filter_geocultural_entities(text: str) -> str:
    """Filters sentences containing specific geographical or cultural entities."""
    # Truncate long texts before NER to avoid multi-second SpaCy processing
    truncated = text[:MAX_NER_CHARS] if len(text) > MAX_NER_CHARS else text
    doc = nlp(truncated)
    relevant_sentences = []

    target_labels = {"GPE", "LOC", "FAC", "ORG", "NORP", "EVENT", "WORK_OF_ART"}

    for sent in doc.sents:
        has_target = any(ent.label_ in target_labels for ent in sent.ents)
        if has_target:
            relevant_sentences.append(sent.text.strip())

    # Limit to top 30 filtered sentences — sufficient for the LLM, faster than 40
    return " ".join(relevant_sentences[:30])

def summarize_with_groq(text: str, location_name: str) -> Dict[str, str]:
    """Uses Groq's Llama 3 70B to generate exactly 6-7 key insights."""

    prompt = f"""
You are an expert geographer and historian. I will provide you with filtered text about {location_name}.
Extract the 6 to 7 most "famous things" (landmarks, culture, history) about {location_name} from the text.
Format your output ONLY as a JSON object with 6 to 7 string key-value pairs.
The keys should be descriptive but short (e.g., "Historical Significance", "Famous Landmark", "Local Culture", etc.) and the values should be 1-2 sentences of rich insight.
Make sure the tone is premium and informative.
Do NOT wrap the JSON in markdown blocks, just return the raw JSON.

Text:
{text}
"""
    models = [PRIMARY_MODEL, FALLBACK_MODEL]

    for model in models:
        try:
            response = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model=model,
                temperature=0.3,
                max_completion_tokens=700,
                response_format={"type": "json_object"},
                timeout=30,
            )
            content = response.choices[0].message.content
            insights = json.loads(content)
            if model == FALLBACK_MODEL:
                logger.info("Used fallback model %s successfully", FALLBACK_MODEL)
            return insights
        except Exception as e:
            error_msg = str(e).lower()
            is_rate_limit = "rate_limit" in error_msg or "429" in error_msg
            if is_rate_limit and model == PRIMARY_MODEL:
                logger.warning("Primary model %s rate-limited, falling back to %s", PRIMARY_MODEL, FALLBACK_MODEL)
                continue
            logger.exception("Groq API Error with model %s", model)
            return {
                "error": "Failed to generate insights. Please check if your Groq API key is valid.",
            }

def summarize_with_groq_stream(text: str, location_name: str):
    """
    Generator that streams insights one-by-one as NDJSON lines.
    Each yielded value is a raw JSON string like: '{"Historical Significance": "..."}'
    """
    prompt = f"""You are an expert geographer and historian. I will provide you with filtered text about {location_name}.
Extract the 6 to 7 most "famous things" (landmarks, culture, history) about {location_name} from the text.

Output each insight on its own line as a JSON object with exactly ONE key-value pair.
Format: {{"Descriptive Label": "1-2 sentences of rich, premium insight."}}
Output 6 to 7 lines total. No other text, no markdown, no wrapper array — just one JSON object per line.

Text:
{text}
"""
    models = [PRIMARY_MODEL, FALLBACK_MODEL]

    for model in models:
        try:
            stream = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=model,
                temperature=0.3,
                max_completion_tokens=700,
                stream=True,
                timeout=30,
            )
            buffer = ""
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                buffer += delta
                # Yield each complete line that parses as valid JSON
                while "\n" in buffer:
                    line, buffer = buffer.split("\n", 1)
                    line = line.strip()
                    if line:
                        try:
                            json.loads(line)  # validate
                            yield line
                        except json.JSONDecodeError:
                            pass  # partial or non-JSON line, skip
            # Flush remaining buffer
            remainder = buffer.strip()
            if remainder:
                try:
                    json.loads(remainder)
                    yield remainder
                except json.JSONDecodeError:
                    pass
            return  # success — don't try fallback
        except Exception as e:
            error_msg = str(e).lower()
            is_rate_limit = "rate_limit" in error_msg or "429" in error_msg
            if is_rate_limit and model == PRIMARY_MODEL:
                logger.warning("Primary model %s rate-limited, falling back to %s", PRIMARY_MODEL, FALLBACK_MODEL)
                continue
            logger.exception("Groq streaming error with model %s", model)
            return

def run_pipeline(location_name: str, source: str = "wikipedia", path: str = None):
    if source == "onefivenine" and path:
        data = fetch_onefivenine_data(path)
    else:
        data = fetch_wikipedia_data(location_name)

    # Process the full page text for deep extraction
    filtered_text = filter_geocultural_entities(data["text"])

    # If the page is too short, fallback to summary
    if len(filtered_text) < 100:
        filtered_text = filter_geocultural_entities(data["summary"])

    insights = summarize_with_groq(filtered_text, data["title"])

    if source == "onefivenine" and path:
        source_url = f"https://www.onefivenine.com/india/villages/{path}"
    else:
        source_url = f"https://en.wikipedia.org/wiki/{data['title'].replace(' ', '_')}"

    return {
        "location_name": data["title"],
        "image_url": data["image_url"],
        "image_urls": data.get("image_urls", []),
        "insights": insights,
        "source": source,
        "source_url": source_url,
        "quick_facts": data.get("quick_facts", {}),
    }


def get_related_places(location_name: str, exact_title: str = None) -> list:
    """
    Returns up to 5 related geographic places by fetching Wikipedia article links
    and batch-checking which ones have coordinates (i.e. are real places).
    """
    title = exact_title or location_name

    # Step 1: fetch all wikilinks from the article (namespace 0 = main articles only)
    try:
        links_resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "prop": "links",
                "titles": title,
                "pllimit": "100",
                "plnamespace": "0",
                "format": "json",
            },
            headers={"User-Agent": USER_AGENT},
            timeout=6,
        )
        pages = links_resp.json().get("query", {}).get("pages", {})
    except Exception:
        return []

    all_links = []
    for page in pages.values():
        for link in page.get("links", []):
            link_title = link.get("title", "")
            # Skip disambiguation pages, lists, and the source article itself
            if (link_title.lower() == title.lower()
                    or "(disambiguation)" in link_title.lower()
                    or link_title.lower().startswith("list of")):
                continue
            all_links.append(link_title)

    if not all_links:
        return []

    # Step 2: batch-check the first 60 links for coordinates + thumbnail in one API call
    batch = all_links[:60]
    try:
        coords_resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "prop": "coordinates|pageimages|description",
                "titles": "|".join(batch),
                "piprop": "thumbnail",
                "pithumbsize": "320",
                "format": "json",
            },
            headers={"User-Agent": USER_AGENT},
            timeout=8,
        )
        coord_pages = coords_resp.json().get("query", {}).get("pages", {})
    except Exception:
        return []

    results = []
    for page in coord_pages.values():
        if "coordinates" not in page:
            continue
        place_title = page.get("title", "")
        if place_title.lower() == title.lower():
            continue
        results.append({
            "title": place_title,
            "source": "wikipedia",
            "description": page.get("description", ""),
            "thumbnail": page.get("thumbnail", {}).get("source"),
        })
        if len(results) >= 5:
            break

    return results
