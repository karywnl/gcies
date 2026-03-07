import os
import json
import time
import logging
import concurrent.futures
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
from cachetools import TTLCache

from database import redis_client
from pipeline import run_pipeline, search_wikipedia_candidates, search_onefivenine_candidates

logger = logging.getLogger(__name__)

app = FastAPI(title="GCIES API")

# Module-level bounded thread pool for search parallelisation
_search_executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

# TTL cache for autocomplete results (5-minute expiry, max 256 entries)
_search_cache = TTLCache(maxsize=256, ttl=300)

_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/search")
def search_locations(q: str):
    if not q:
        return []

    normalized_q = q.strip().lower()

    # Check TTL cache first
    if normalized_q in _search_cache:
        return _search_cache[normalized_q]

    try:
        wiki_future = _search_executor.submit(search_wikipedia_candidates, q)
        ofn_future = _search_executor.submit(search_onefivenine_candidates, q)

        wiki_results = wiki_future.result()
        onefivenine_results = ofn_future.result()

        combined = wiki_results + onefivenine_results
        _search_cache[normalized_q] = combined
        return combined
    except Exception as e:
        logger.exception("Search failed for query: %s", q)
        raise HTTPException(status_code=500, detail="Search failed. Please try again.")

from fastapi.concurrency import run_in_threadpool

@app.get("/api/summarize")
async def summarize_location(location_name: str, source: str = "wikipedia", path: str = None):
    if not location_name:
        raise HTTPException(status_code=400, detail="location_name is required")

    normalized_key = location_name.strip().lower()
    cache_key = f"summary:{source}:{normalized_key}"

    # 1. Check Upstash for the location_name
    if redis_client:
        try:
            cached_result = await redis_client.get(cache_key)
            if cached_result:
                logger.info("Cache hit for %s", location_name)
                if isinstance(cached_result, str):
                    cached_result = json.loads(cached_result)
                return JSONResponse(
                    content=cached_result,
                    headers={"X-Pipeline-Duration-Ms": "0", "X-Cache": "HIT"}
                )
        except Exception as e:
            logger.warning("Redis cache read error: %s", e)

    # 2. Run the extraction pipeline and measure duration
    start = time.perf_counter()
    try:
        # Run synchronous AI pipeline in a background thread to prevent blocking
        result = await run_in_threadpool(run_pipeline, location_name, source, path)
        duration_ms = round((time.perf_counter() - start) * 1000)

        # 3. Save the result to Upstash with a 12-hour TTL
        if redis_client:
            try:
                await redis_client.set(cache_key, json.dumps(result), ex=43200)
                logger.info("Cached result for %s", location_name)
            except Exception as e:
                logger.warning("Redis cache write error: %s", e)

        return JSONResponse(
            content=result,
            headers={"X-Pipeline-Duration-Ms": str(duration_ms), "X-Cache": "MISS"}
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.exception("Pipeline failed for %s", location_name)
        raise HTTPException(status_code=500, detail="Failed to generate insights. Please try again later.")

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
