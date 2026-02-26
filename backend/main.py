import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
from pipeline import run_pipeline, search_wikipedia_candidates

app = FastAPI(title="GCIES API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/search")
def search_locations(q: str):
    if not q:
        return []
    try:
        return search_wikipedia_candidates(q)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

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

# Paths for frontend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend", "dist")

# Mount frontend/dist directory at the root
# Note: we don't use app.mount("/", StaticFiles(...)) because it bypasses top-level exception handlers
# and breaks SPA routing for nested URLs like /about.

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    Catch-all route to serve the SPA frontend and static files.
    """
    # Prevent directory traversal
    if ".." in full_path:
        raise HTTPException(status_code=400, detail="Invalid path")
    
    # Let static files (like /assets/*, /vite.svg, etc.) pass through if they exist
    file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to index.html for React/Vite routing
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    return JSONResponse({"detail": "Frontend not built yet."}, status_code=404)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
