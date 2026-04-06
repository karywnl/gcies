import os
import json
import time
import asyncio
import logging
import concurrent.futures
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
import uvicorn
from cachetools import TTLCache

from database import redis_client
from pipeline import (
    run_pipeline,
    search_wikipedia_candidates,
    search_onefivenine_candidates,
    fetch_wikipedia_data,
    fetch_onefivenine_data,
    filter_geocultural_entities,
    summarize_with_groq_stream,
)

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
def search_locations(q: str, source: str = "all"):
    """
    source=wikipedia  → only Wikipedia candidates (fast, ~200-400ms)
    source=villages   → only onefivenine village candidates
    source=all        → both combined, waits for the slower one (legacy behaviour)
    """
    if not q:
        return []

    cache_key = f"{source}:{q.strip().lower()}"

    if cache_key in _search_cache:
        return _search_cache[cache_key]

    try:
        if source == "wikipedia":
            results = search_wikipedia_candidates(q)
        elif source == "villages":
            results = search_onefivenine_candidates(q)
        else:
            # Legacy combined mode — runs both in parallel, blocks until both done
            wiki_future = _search_executor.submit(search_wikipedia_candidates, q)
            ofn_future  = _search_executor.submit(search_onefivenine_candidates, q)
            results = wiki_future.result() + ofn_future.result()

        _search_cache[cache_key] = results
        return results
    except Exception as e:
        logger.exception("Search failed for query: %s (source=%s)", q, source)
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
                print(f"✅ Cache HIT for {location_name}")
                logger.info("Cache hit for %s", location_name)
                if isinstance(cached_result, str):
                    cached_result = json.loads(cached_result)
                return JSONResponse(
                    content=cached_result,
                    headers={"X-Pipeline-Duration-Ms": "0", "X-Cache": "HIT"}
                )
            else:
                print(f"❌ Cache MISS (empty) for {location_name}")
        except Exception as e:
            print(f"⚠️ Redis cache read error: {e}")
            logger.warning("Redis cache read error: %s", e)
    else:
        print("⚠️ Skipping cache read: redis_client is None")

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
                print(f"✅ Cached result written for {location_name}")
                logger.info("Cached result for %s", location_name)
            except Exception as e:
                print(f"⚠️ Redis cache write error: {e}")
                logger.warning("Redis cache write error: %s", e)
        else:
            print("⚠️ Skipping cache write: redis_client is None")

        return JSONResponse(
            content=result,
            headers={"X-Pipeline-Duration-Ms": str(duration_ms), "X-Cache": "MISS"}
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.exception("Pipeline failed for %s", location_name)
        raise HTTPException(status_code=500, detail="Failed to generate insights. Please try again later.")


@app.get("/api/stream")
async def stream_location(location_name: str, source: str = "wikipedia", path: str = None):
    """
    Server-Sent Events endpoint. Streams location insights progressively.

    Event sequence:
      data: {"type":"meta","location_name":...,"image_url":...,"image_urls":[...],"source":...,"quick_facts":{...}}
      data: {"type":"insight","key":"...","value":"..."}   (one per insight)
      data: [DONE]
    """
    if not location_name:
        raise HTTPException(status_code=400, detail="location_name is required")

    cache_key = f"summary:{source}:{location_name.strip().lower()}"

    # --- Cache HIT: replay stored events immediately ---
    if redis_client:
        try:
            cached = await redis_client.get(cache_key)
            if cached:
                print(f"✅ Stream cache HIT for {location_name}")
                if isinstance(cached, str):
                    cached = json.loads(cached)

                async def cached_generator():
                    meta = {
                        "type": "meta",
                        "location_name": cached.get("location_name"),
                        "image_url": cached.get("image_url"),
                        "image_urls": cached.get("image_urls", []),
                        "source": cached.get("source", source),
                        "source_url": cached.get("source_url", ""),
                        "quick_facts": cached.get("quick_facts", {}),
                    }
                    yield f"data: {json.dumps(meta)}\n\n"
                    for key, value in cached.get("insights", {}).items():
                        yield f"data: {json.dumps({'type': 'insight', 'key': key, 'value': value})}\n\n"
                    yield "data: [DONE]\n\n"

                return StreamingResponse(
                    cached_generator(),
                    media_type="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive", "X-Cache": "HIT"},
                )
        except Exception as e:
            print(f"⚠️ Stream cache read error: {e}")
            logger.warning("Stream cache read error: %s", e)

    # --- Cache MISS: run pipeline and stream live ---
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()
    # Shared container so event_generator can write to Redis after streaming
    collected: dict = {}

    def _run_pipeline_stream():
        try:
            # Step 1: fetch data (Wikipedia/Wikidata/images in parallel internally)
            if source == "onefivenine" and path:
                data = fetch_onefivenine_data(path)
            else:
                data = fetch_wikipedia_data(location_name)

            # Step 2: emit meta event IMMEDIATELY — image and map are ready now.
            # SpaCy NER (step 3) runs after this so the user sees content sooner.
            if source == "onefivenine" and path:
                src_url = f"https://www.onefivenine.com/india/villages/{path}"
            else:
                src_url = f"https://en.wikipedia.org/wiki/{data['title'].replace(' ', '_')}"

            meta = {
                "type": "meta",
                "location_name": data["title"],
                "image_url": data["image_url"],
                "image_urls": data.get("image_urls", []),
                "source": source,
                "source_url": src_url,
                "quick_facts": data.get("quick_facts", {}),
            }
            loop.call_soon_threadsafe(queue.put_nowait, json.dumps(meta))

            # Step 3: filter text with SpaCy NER (runs while client is rendering the meta)
            filtered_text = filter_geocultural_entities(data["text"])
            if len(filtered_text) < 100:
                filtered_text = filter_geocultural_entities(data["summary"])

            # Step 4: stream insights from Groq, collecting them for cache
            all_insights = {}
            for line in summarize_with_groq_stream(filtered_text, data["title"]):
                try:
                    parsed = json.loads(line)
                    for key, value in parsed.items():
                        all_insights[key] = value
                        event = json.dumps({"type": "insight", "key": key, "value": value})
                        loop.call_soon_threadsafe(queue.put_nowait, event)
                except json.JSONDecodeError:
                    pass

            # Store assembled result for Redis write after stream ends
            collected["result"] = {
                "location_name": data["title"],
                "image_url": data["image_url"],
                "image_urls": data.get("image_urls", []),
                "insights": all_insights,
                "source": source,
                "source_url": src_url,
                "quick_facts": data.get("quick_facts", {}),
            }

        except ValueError as ve:
            error_event = json.dumps({"type": "error", "message": str(ve)})
            loop.call_soon_threadsafe(queue.put_nowait, error_event)
        except Exception as e:
            logger.exception("Stream pipeline failed for %s", location_name)
            error_event = json.dumps({"type": "error", "message": "Failed to generate insights. Please try again."})
            loop.call_soon_threadsafe(queue.put_nowait, error_event)
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, None)  # sentinel

    async def event_generator():
        loop.run_in_executor(None, _run_pipeline_stream)
        while True:
            item = await queue.get()
            if item is None:
                # Write to Redis BEFORE yielding [DONE].
                # If we yield first, the client closes the connection immediately and
                # FastAPI cancels this generator — the await below would never run.
                if redis_client and "result" in collected:
                    try:
                        await redis_client.set(cache_key, json.dumps(collected["result"]), ex=43200)
                        print(f"✅ Stream result cached for {location_name}")
                    except Exception as e:
                        print(f"⚠️ Stream cache write error: {e}")
                        logger.warning("Stream cache write error: %s", e)
                yield "data: [DONE]\n\n"
                break
            yield f"data: {item}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


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
