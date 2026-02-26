import os
import wikipediaapi
import spacy
from groq import Groq
from typing import Dict
from dotenv import load_dotenv

load_dotenv(override=True)

# Initialize Wikipedia API
wiki_wiki = wikipediaapi.Wikipedia('GCIES-App (your@email.com)', 'en')

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
    """Uses Wikipedia search API to find the closest geographical matching candidates and their descriptions for autocomplete."""
    import requests
    url = "https://en.wikipedia.org/w/api.php"
    
    # Take the raw query for autocomplete, don't split by comma here as user might not have finished typing
    params_search = {
        "action": "opensearch",
        "search": query,
        "limit": 15,
        "namespace": 0,
        "format": "json"
    }
    headers = {"User-Agent": "GCIES-App (your@email.com)"}
    try:
        res_search = requests.get(url, params=params_search, headers=headers).json()
        if len(res_search) > 1 and res_search[1]:
            candidates = res_search[1]
            
            # Now fetch descriptions for these candidates
            params_props = {
                "action": "query",
                "prop": "pageprops",
                "titles": "|".join(candidates),
                "format": "json"
            }
            res_props = requests.get(url, params=params_props, headers=headers).json()
            pages = res_props.get("query", {}).get("pages", {})
            
            results = []
            geo_keywords = ["city", "town", "village", "municipality", "settlement", "capital", "district", "state", "country", "neighborhood", "territory", "island", "county", "province", "region", "place", "location", "hamlet", "suburb", "borough", "township", "parish"]
            
            for candidate in candidates:
                desc = ""
                for page_id, page_data in pages.items():
                    if page_data.get("title") == candidate:
                        desc = page_data.get("pageprops", {}).get("wikibase-shortdesc", "")
                        break
                        
                desc_lower = desc.lower()
                if any(kw in desc_lower for kw in geo_keywords):
                    results.append({"title": candidate, "description": desc, "source": "wikipedia"})
                    if len(results) >= 5:
                        break
                
            return results
    except Exception as e:
        print(f"Error fetching candidates: {e}")
        
    return []

def search_onefivenine_candidates(query: str) -> list:
    """Uses OneFiveNine autoComplete endpoint to find matching villages."""
    import requests
    from bs4 import BeautifulSoup
    import re
    
    url = "https://www.onefivenine.com/autoComplete.dont?method=completeVillages"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        res = requests.post(url, data={"queryString": query}, headers=headers)
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
        print(f"Error fetching OneFiveNine candidates: {e}")
        
    return []

def fetch_onefivenine_data(path: str) -> dict:
    """Scrapes raw text from a specific OneFiveNine village page."""
    import requests
    from bs4 import BeautifulSoup
    
    url = f"https://www.onefivenine.com/india/villages/{path}"
    headers = {"User-Agent": "Mozilla/5.0"}
    
    res = requests.get(url, headers=headers)
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
    import re
    cutoff_match = re.search(r"(HOW TO REACH|Colleges near|Colleges in|Schools near|Schools in|Petrol Bunks in)", text, re.IGNORECASE)
    if cutoff_match:
        text = text[:cutoff_match.start()]
    
    return {
        "text": text,
        "summary": text[:500],
        "title": title,
        "image_url": None
    }

def get_best_wikipedia_title(query: str) -> str:
    """Uses Wikipedia search API to find the closest geographical matching title, with comma-separated hierarchical context support."""
    import requests
    url = "https://en.wikipedia.org/w/api.php"
    
    parts = [p.strip() for p in query.split(",")]
    primary_query = parts[0]
    context_terms = [p.lower() for p in parts[1:] if p.strip()]
    
    params_search = {
        "action": "opensearch",
        "search": primary_query,
        "limit": 10,
        "namespace": 0,
        "format": "json"
    }
    headers = {"User-Agent": "GCIES-App (your@email.com)"}
    try:
        res_search = requests.get(url, params=params_search, headers=headers).json()
        if len(res_search) > 1 and res_search[1]:
            candidates = res_search[1]
            
            params_props = {
                "action": "query",
                "prop": "coordinates|pageprops|extracts",
                "titles": "|".join(candidates[:10]),
                "exintro": 1,
                "explaintext": 1,
                "format": "json"
            }
            res_props = requests.get(url, params=params_props, headers=headers).json()
            pages = res_props.get("query", {}).get("pages", {})
            
            best_candidate = None
            best_score = -1
            
            for candidate in candidates:
                for page_id, page_data in pages.items():
                    if page_data.get("title") == candidate:
                        has_coords = "coordinates" in page_data
                        desc = page_data.get("pageprops", {}).get("wikibase-shortdesc", "").lower()
                        extract = page_data.get("extract", "").lower()
                        
                        score = 0
                        
                        primary_keywords = ["town", "city", "village", "municipality", "settlement", "capital"]
                        if any(kw in desc for kw in primary_keywords):
                            score += 50
                            
                        secondary_keywords = ["district", "state", "country", "neighborhood", "territory", "island"]
                        if any(kw in desc for kw in secondary_keywords):
                            score += 20
                            
                        if "constituency" in desc or "constituency" in candidate.lower() or "electoral" in desc:
                            score -= 30
                            
                        if has_coords:
                            score += 10
                            
                        # Context matching for hierarchical queries
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
                            
            if best_candidate:
                return best_candidate
                
    except Exception as e:
        print(f"Error finding best title: {e}")
        
    return None

def fetch_wikipedia_data(location_name: str) -> dict:
    """Fetches raw text and attempts to get main image from Wikipedia."""
    best_title = get_best_wikipedia_title(location_name)
    
    if not best_title:
        raise ValueError(f"Could not identify a geographical location for: '{location_name}'. Please try being more specific.")
        
    page = wiki_wiki.page(best_title)
    if not page.exists():
        raise ValueError(f"Could not find Wikipedia page for: '{location_name}' (Tried: '{best_title}')")
    
    import requests
    image_url = None
    try:
        url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "titles": best_title,
            "prop": "pageimages",
            "format": "json",
            "pithumbsize": 1000
        }
        res = requests.get(url, params=params, headers={"User-Agent": "GCIES-App (your@email.com)"}).json()
        pages = res.get("query", {}).get("pages", {})
        for page_id in pages:
            if "thumbnail" in pages[page_id]:
                image_url = pages[page_id]["thumbnail"]["source"]
                break
    except Exception as e:
        print(f"Error fetching image: {e}")

    return {
        "text": page.text,
        "summary": page.summary,
        "title": page.title,
        "image_url": image_url
    }

def filter_geocultural_entities(text: str) -> str:
    """Filters sentences containing specific geographical or cultural entities."""
    doc = nlp(text)
    relevant_sentences = []
    
    target_labels = {"GPE", "LOC", "FAC", "ORG", "NORP", "EVENT", "WORK_OF_ART"}
    
    for sent in doc.sents:
        has_target = any(ent.label_ in target_labels for ent in sent.ents)
        if has_target:
            relevant_sentences.append(sent.text.strip())
            
    # Limit to top 30 filtered sentences to avoid exceeding LLM token limits while providing dense facts
    return " ".join(relevant_sentences[:40])

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
    try:
        response = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_completion_tokens=700,
            response_format={"type": "json_object"}
        )
        import json
        content = response.choices[0].message.content
        insights = json.loads(content)
        return insights
    except Exception as e:
        print(f"Groq API Error: {e}")
        return {
            "error": "Failed to generate insights. Please check if your Groq API key is valid.",
            "details": str(e)
        }

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
    
    return {
        "location_name": data["title"],
        "image_url": data["image_url"],
        "insights": insights
    }
