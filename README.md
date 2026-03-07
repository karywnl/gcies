# GCIES - Geo-Contextual Information Extraction & Summarization

GCIES is a high-fidelity intelligent web application designed to bridge the gap between curiosity and discovery. With just a town or village name, GCIES extracts the essence of any location on Earth, returning a rich visual and textual summary of its most famous landmarks, natural geography, historical significance, and local culture.

The project utilizes a fast, Python-based NLP pipeline combined with state-of-the-art Large Language Models to distill vast amounts of web data into 6-7 concise, premium insights instantly.

---

## Tech Stack

**Frontend:**
- React (Vite)
- React Router DOM
- Framer Motion (Animations)
- Vanilla CSS (Glassmorphic aesthetics)
- Lucide React (Icons)
- Axios (HTTP client)

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

1. **User Input:** The user types a location name into the React frontend. As they type, a debounced autocomplete fires real-time suggestions from the backend. Once a location is selected, the frontend dispatches the extraction request to the FastAPI server.
2. **Fetch:** The backend launches parallel requests to Wikipedia and the OneFiveNine village database using `ThreadPoolExecutor`. Both sources are queried simultaneously so that latency is determined by the slowest source, not the sum of both.
3. **Score:** The raw search results from both sources are passed through a custom Geographic Scoring Algorithm. It awards points for physical location descriptors (+50 for "town", +10 for coordinates) and penalizes non-places (-30 for "constituency"). The highest-scoring result is selected, and its full article content and main imagery are extracted.
4. **Filter (SpaCy NER):** The raw article text is passed through an offline SpaCy NER model. Only sentences containing dense Geo-Cultural entities (`GPE`, `LOC`, `FAC`, `ORG`, `EVENT`, `WORK_OF_ART`) are kept, reducing the payload by over 80%.
5. **Summarize (Groq LLM):** The top 30 most information-dense sentences are handed to Groq's Llama 3.3 70B to be structured into 6-7 concise insights. For village databases lacking cultural data, a specialized low-temperature prompt prevents hallucination.
6. **Cache (Upstash Redis):** The final response is stored in an Upstash Redis cache via REST API with a 12-hour TTL (43,200s). On subsequent requests for the same location, the cached response is returned in ~50ms, completely bypassing the entire pipeline. This is what transforms a heavy AI workload into a lightning-fast static query.
7. **Glassmorphic Feedback:** During the 3-5 second pipeline run, a dynamic pill badge cycles through status updates ("Locating destination...", "Analyzing data..."). Paired with Framer Motion transitions, the perceived wait time feels significantly shorter.

> For an interactive visual walkthrough of the full pipeline, visit the **Architecture** page inside the app.

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
Create a `.env` file in the `backend/` directory and add your API keys:
```env
GROQ_API_KEY=gsk_your_api_key_here
UPSTASH_REDIS_REST_URL=your_upstash_redis_url_here
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here
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
The React development server will start, typically on `http://localhost:5173`. The Vite dev server proxies all `/api` requests to the backend automatically.

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

> **Note:** The `GROQ_API_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` environment variables must be set in the Render service's environment settings.

---
