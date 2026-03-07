import os
import logging
from dotenv import load_dotenv
from upstash_redis.asyncio import Redis

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Upstash Redis REST client (async)
REDIS_URL = os.environ.get("UPSTASH_REDIS_REST_URL")
REDIS_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN")

redis_client = None
if REDIS_URL and REDIS_TOKEN:
    redis_client = Redis(url=REDIS_URL, token=REDIS_TOKEN)
    print("✅ Upstash Redis client initialized successfully with ENV vars.")
else:
    msg = "❌ UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — caching is DISABLED"
    print(msg)
    logger.warning(msg)
