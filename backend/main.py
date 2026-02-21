from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pipeline import run_pipeline

app = FastAPI(title="GCIES API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/summarize")
def summarize_location(location_name: str):
    if not location_name:
        raise HTTPException(status_code=400, detail="location_name is required")
    try:
        result = run_pipeline(location_name)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "test": "active"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
