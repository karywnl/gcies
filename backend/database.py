import os
from dotenv import load_dotenv
from upstash_redis import Redis

# Load environment variables from .env file
load_dotenv()

# Initialize Upstash Redis REST client
REDIS_URL = os.environ.get("UPSTASH_REDIS_REST_URL")
REDIS_TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN")

redis_client = None
if REDIS_URL and REDIS_TOKEN:
    redis_client = Redis(url=REDIS_URL, token=REDIS_TOKEN)
