# GCIES - Geo-Contextual Information Extraction and Summarization

GCIES is a high-fidelity intelligent web application designed to bridge the gap between curiosity and discovery. With just a town or village name, GCIES extracts the essence of any location on Earth, returning a rich visual and textual summary of its most famous landmarks, natural geography, historical significance, and local culture.

The project utilizes a fast, Python-based NLP pipeline combined with state-of-the-art Large Language Models to distill vast amounts of web data into concise, premium insights instantly.

---

## Tech Stack

**Frontend:**
- React (Vite)
- React Router DOM
- Framer Motion (Animations)
- Vanilla CSS (Glassmorphic aesthetics)
- Lucide React (Icons)
- React Leaflet + Leaflet (Interactive map on Explore page)

**Backend:**
- Python & FastAPI
- Upstash Redis (Serverless Caching)
- `wikipedia-api` + `requests` (Data Extraction)
- `beautifulsoup4` (HTML parsing for village DB scraping)
- SpaCy `en_core_web_sm` (Named Entity Recognition Filtering)
- Groq API / Llama 3.3 70B (Summarization Engine)

---

## Architecture Overview

GCIES is built on a **"input-fetch-score-filter-summarize-cache"** NLP architecture optimized for LLM token efficiency and speed:

1. **User Input:** The user types a location name into the React frontend and submits. The backend searches Wikipedia and the OneFiveNine village database in parallel, returning a list of candidates for the user to choose from (two-step disambiguation).
2. **Fetch:** Once a candidate is selected, the backend fetches the full article content, images, and Wikidata facts (coordinates, population, area) in parallel using `ThreadPoolExecutor`.
3. **Score:** Raw search results are passed through a custom Geographic Scoring Algorithm. It awards points for physical location descriptors (+50 for "town", +10 for coordinates) and penalises non-places (-200 for "constituency"). For comma-qualified queries like "Salem, Tamil Nadu", a fast-path directly probes the Wikipedia title, bypassing scoring entirely.
4. **Filter (SpaCy NER):** The raw article text is passed through an offline SpaCy NER model. Only sentences containing dense Geo-Cultural entities (`GPE`, `LOC`, `FAC`, `ORG`, `EVENT`, `WORK_OF_ART`) are kept, reducing the payload by over 80%.
5. **Summarize (Groq LLM):** The filtered text is handed to Groq's Llama 3.3 70B to be structured into concise insights streamed back to the frontend via Server-Sent Events. For village databases lacking cultural data, a specialised low-temperature prompt prevents hallucination.
6. **Cache (Upstash Redis):** The final response is stored in Upstash Redis with a 12-hour TTL (43,200s). On subsequent requests for the same location, the cached response is returned instantly, completely bypassing the entire pipeline.
7. **Glassmorphic Feedback:** During the pipeline run, an animated progressive loader cycles through status updates. Paired with Framer Motion transitions, the perceived wait time feels significantly shorter.

---

## Pages

- **Home (`/`)** — Main search and results page. Type a location, pick from the disambiguation list, and receive streaming AI insights with an image carousel, interactive map, live weather strip, and quick facts.
- **Explore (`/explore`)** — Full-screen interactive map. Click anywhere on Earth to get an address hierarchy (village → city → state → country) via Nominatim reverse geocoding. Click any row to navigate directly to that location's insights page.

---

## Local Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/karywnl/gcies.git
cd gcies
```

### 2. Backend Setup
Navigate into the `backend` directory, set up your Python environment, and install the required dependencies:
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

**Environment Variables**

Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

```env
# Required
GROQ_API_KEY=your_groq_api_key_here

# Optional — enables caching (app works without it)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here

# CORS — comma-separated allowed frontend origins
ALLOWED_ORIGINS=http://localhost:5173
```

**Run the Backend Server**
```bash
uvicorn main:app --port 8000 --reload
```
The FastAPI instance will now be running on `http://localhost:8000`.

### 3. Frontend Setup
Open a new terminal, navigate to the `frontend` directory, and start the React application:
```bash
cd frontend
npm install
npm run dev
```
The React development server will start on `http://localhost:5173`. The Vite dev server proxies all `/api` requests to the backend automatically.

### 4. Build for Production
To build the frontend for production deployment (the built files are served directly by FastAPI):
```bash
cd frontend
npm run build
```

---

## Deployment (Render)

The application is deployed as a single service on [Render](https://render.com). FastAPI serves both the compiled React frontend (`frontend/dist`) and all `/api/*` routes on the same origin.

**Build Command** (configured in Render dashboard):
```bash
./render_build.sh
```

This script:
1. Builds the React frontend (`npm run build`)
2. Installs Python backend dependencies
3. Pre-downloads the SpaCy `en_core_web_sm` NLP model

**Start Command:**
```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

> **Note:** The `GROQ_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `ALLOWED_ORIGINS` environment variables must be set in the Render service's environment settings.

---
