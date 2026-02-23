# GCIES - Geo-Contextual Information Extraction & Summarization

GCIES is a high-fidelity intelligent web application designed to bridge the gap between curiosity and discovery. With just a town or village name, GCIES extracts the essence of any location on Earth, returning a rich visual and textual summary of its most famous landmarks, natural geography, historical significance, and local culture. 

The project utilizes a fast, Python-based NLP pipeline combined with state-of-the-art Large Language Models to distill vast amounts of web data into 6-7 concise, premium insights instantly.


## Tech Stack

**Frontend:**
- React (Vite)
- React Router DOM
- Framer Motion (Animations)
- Vanilla CSS (Glassmorphic aesthetics)
- Lucide React (Icons)

**Backend:**
- Python & FastAPI
- `wikipedia-api` (Data Extraction)
- SpaCy `en_core_web_sm` (Named Entity Recognition Filtering)
- Groq API / Llama 3.3 70B (Summarization Engine)

## Architecture Overview

GCIES is built on a "fetch-filter-summarize" NLP architecture optimized for LLM token efficiency and speed:
1. **Fetch:** Reaches out to the internet to pull the most relevant long-form contextual data and main imagery for the requested query location.
2. **Filter:** To keep LLM costs at zero and inference speeds high, the raw text is passed through an offline SpaCy NER (Named Entity Recognition) model. The backend filters down the text to only sentences containing dense Geo-Cultural entities (`GPE`, `LOC`, `FAC`, `ORG`, `EVENT`, `WORK_OF_ART`).
3. **Summarize:** The top 40 most information-dense sentences are handed to Groq's Llama 3 API for structuring into 6-7 rich, easily digestible insights. 

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
The React development server will start, typically on `http://localhost:5173`.

### 4. Build for Production
To build the frontend for production deployment:
```bash
npm run build
```

