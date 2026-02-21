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

def fetch_wikipedia_data(location_name: str) -> dict:
    """Fetches raw text and attempts to get main image from Wikipedia."""
    page = wiki_wiki.page(location_name)
    if not page.exists():
        raise ValueError(f"Could not find Wikipedia page for: {location_name}")
    
    import requests
    image_url = None
    try:
        url = f"https://en.wikipedia.org/w/api.php?action=query&titles={location_name}&prop=pageimages&format=json&pithumbsize=1000"
        res = requests.get(url).json()
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

def run_pipeline(location_name: str):
    wiki_data = fetch_wikipedia_data(location_name)
    
    # Process the full page text for deep extraction
    filtered_text = filter_geocultural_entities(wiki_data["text"])
    
    # If the page is too short, fallback to summary
    if len(filtered_text) < 100:
        filtered_text = filter_geocultural_entities(wiki_data["summary"])
        
    insights = summarize_with_groq(filtered_text, wiki_data["title"])
    
    return {
        "location_name": wiki_data["title"],
        "image_url": wiki_data["image_url"],
        "insights": insights
    }
