import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # dotenv is optional
    pass

CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-5-5")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
YOUTUBE_CLIENT_SECRETS = os.getenv("YOUTUBE_CLIENT_SECRETS", "client_secret.json")
YOUTUBE_TOKEN_FILE = os.getenv("YOUTUBE_TOKEN_FILE", "token.json")
YT_REGION = os.getenv("YT_REGION", "US")
YT_LANGUAGE = os.getenv("YT_LANGUAGE", "en")
RUNS_DIR = Path(os.getenv("RUNS_DIR", "runs"))
