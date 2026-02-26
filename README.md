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
- `wikipedia-api` + `requests` (Data Extraction)
- `beautifulsoup4` (HTML parsing for village DB scraping)
- SpaCy `en_core_web_sm` (Named Entity Recognition Filtering)
- Groq API / Llama 3.3 70B (Summarization Engine)

---

## Features

### Dual-Source Autocomplete Search
As you type a location name, GCIES fetches real-time suggestions from **two parallel data sources**:

1. **Wikipedia** — Finds globally recognized cities, towns, districts, and regions. Each suggestion is scored against Wikipedia's internal metadata to ensure only genuine geographical entities appear.
2. **OneFiveNine Village Database** — Queries an India-specific village database for hyper-local results. Suggestions from this source are tagged with a **"Village DB"** badge in the dropdown.

Both sources are queried simultaneously using `ThreadPoolExecutor` for maximum speed. Results are merged and displayed in a smooth animated dropdown.

### Smart Hierarchical Query Support
Comma-separated queries are supported for disambiguation. For example:
- `Salem, Tamil Nadu` → correctly resolves the city in Tamil Nadu, India, not Salem in another country.
- `Bhavani` → the scoring algorithm bypasses the Hindu Goddess page and the electoral constituency, locking on to the town of **Bhavani, Tamil Nadu**.

### Geographic Scoring Algorithm
Wikipedia's search naturally returns exact matches first but these aren't always places. Every candidate is scored before being shown:

| Signal | Score |
|---|---|
| Descriptor: "town", "city", "village", "municipality" | +50 |
| Descriptor: "district", "state", "country", "region" | +20 |
| Has geographic coordinates | +10 |
| Descriptor: "constituency" or "electoral" | -30 |
| Context term from comma-separated query matches | +200 |

### Animated Glassmorphic UI
- Smooth entrance/exit animations via **Framer Motion** on all views (Hero, Search, Results).
- **Progressive Loader:** A dynamic, traffic-light colored pill badge that cycles through engaging status messages ("Locating destination...", "Analyzing regional data...") during long searches to mask API wait times.
- **Source Transparency Banner:** A built-in warning disclaimer when viewing scraped Third-Party Village Records to ensure data integrity expectations are managed.
- Responsive design across mobile and desktop breakpoints.
- Sticky **Navbar** with real-time backend health monitoring (API Online/Offline).
- Results Dashboard with a main image card and a 3-column insights grid.

### About Page
A dedicated `/about` page describing the project's mission, data pipeline philosophy, and technology stack — visually consistent with the main application.

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
