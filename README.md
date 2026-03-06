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

## Nuances & Implementation Details

What makes GCIES unique isn't just the data it presents, but *how* it processes and retrieves that data. Here are the core technical nuances that make this project interesting:

### 1. The Geographic Scoring Algorithm
When querying Wikipedia for a location, the native search API often returns exact string matches that aren't actually geographical places (e.g., searching for "Bhavani" might return the Hindu Goddess or an electoral constituency instead of the town).

**The Nuance:** We implemented a custom scoring algorithm that intercepts the search results. It awards points for geographical descriptors (e.g., +50 for "town" or "city", +10 if it possesses coordinates) and heavily penalizes non-places (-30 for "constituency").
**Why it matters:** Without this, users searching for small towns would frequently receive completely irrelevant historical or political articles, breaking the core promise of the application. The algorithm ensures the autocomplete dropdown strictly features physical locations.

### 2. Upstash Redis Caching Layer
Large Language Models (like Llama 3) and web scraping pipelines are inherently slow and expensive at scale.

**The Nuance:** Before any pipeline runs, the backend intercepts the request and checks an Upstash Redis cache (connected via REST to avoid serverless connection limits). If the town has been searched before, the pre-generated JSON response is returned in roughly ~50 milliseconds.
**Why it matters:** Without the caching layer, repeated searches for popular cities (like "Tokyo" or "London") would redundantly consume LLM tokens and force users to wait 3-5 seconds every single time. Redis turns a heavy AI extraction pipeline into a lightning-fast static API.

### 3. SpaCy NLP Pre-Filtering
Language models have token limits and charge based on the amount of text they process. Feeding an entire Wikipedia article about a major city into an LLM is both incredibly slow and highly expensive.

**The Nuance:** We placed an offline Natural Language Processing (NLP) model—SpaCy's `en_core_web_sm`—between the data extraction and the LLM. SpaCy reads the massive article and surgically extracts *only* the sentences that contain dense Geo-Cultural entities (like `FAC` for Facilities, `GPE` for Geopolitical Entities, or `LOC` for Locations).
**Why it matters:** This filtering reduces the text payload sent to the Groq API by over 80%. If we hadn't implemented this, inference costs would skyrocket, processing times would massively increase, and the LLM might hallucinate or summarize irrelevant trivia instead of the requested landmarks and culture.

### 4. Dual-Source Parallel Search
Wikipedia is excellent for global cities but severely lacks data for remote or rural locations (like tiny villages in India).

**The Nuance:** The search API utilizes Python's `ThreadPoolExecutor` to launch two simultaneous, parallel queries: one to Wikipedia and one to a hyper-local database (OneFiveNine). The results are fetched concurrently and merged before being sent to the frontend.
**Why it matters:** Synchronous (serial) queries would double the wait time for the user while typing. By parallelizing the search, GCIES maintains a snappy, real-time autocomplete feel while casting a massive safety net that catches both global metropolitan cities and microscopic rural villages.

---

### 5. Animated Glassmorphic Feedback Loop
While the backend handles heavy processing, the frontend is designed to strictly manage user perception of wait times.
- **Progressive Loader:** Instead of a static spinner, long searches trigger a dynamic, traffic-light colored pill badge that cycles through status messages ("Locating destination...", "Analyzing regional data..."). This psychological trick masks API wait times.
- **Source Transparency:** A built-in warning disclaimer dynamically mounts when viewing scraped Third-Party Village Records, automatically managing expectations regarding data integrity.
- **Micro-Interactions:** Smooth entrance/exit animations via **Framer Motion** on all views ensuring the application feels like a native, premium client rather than a static web-page.

---

## Architecture Overview

GCIES is built on a **"fetch-filter-summarize"** NLP architecture optimized for LLM token efficiency and speed:

1. **Fetch:** Reaches out to Wikipedia or the OneFiveNine village database to pull the most relevant long-form contextual data and main imagery for the queried location. These requests are parallelized using `ThreadPoolExecutor` to minimize latency. External calls are strictly timeout-bound, and repeat search queries are heavily optimized via an **LRU Cache** on the backend and **AbortControllers** on the frontend to prevent race conditions.
2. **Filter:** The raw text is passed through an offline SpaCy NER (Named Entity Recognition) model. The backend filters the text down to only sentences containing dense Geo-Cultural entities (`GPE`, `LOC`, `FAC`, `ORG`, `EVENT`, `WORK_OF_ART`), keeping LLM costs at zero and inference fast.
3. **Summarize:** The top 30 most information-dense sentences are handed to Groq's Llama 3.3 70B API to be structured into concise, premium insights. For village databases lacking cultural data, a specialized low-temperature, highly restrictive prompt is used to prevent the LLM from hallucinating landmarks.

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
Create a `.env` file in the `backend/` directory and add your Groq API Key:
```env
GROQ_API_KEY=gsk_your_api_key_here
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

> **Note:** The `GROQ_API_KEY` environment variable must be set in the Render service's environment settings.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/search?q={query}` | Returns real-time autocomplete suggestions from Wikipedia and OneFiveNine |
| `GET` | `/api/summarize?location_name={name}&source={src}&path={path}` | Runs the full NLP pipeline and returns 6-7 insights + image |
| `GET` | `/api/health` | Health check |
| `GET` | `/{any}` | Serves the React SPA or its static assets |
