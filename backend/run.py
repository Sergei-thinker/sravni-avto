"""Launcher script that loads .env before starting uvicorn."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from this directory
load_dotenv(Path(__file__).parent / ".env")

print(f"API key set: {bool(os.getenv('OPENROUTER_API_KEY'))}")
print(f"Model: {os.getenv('OPENROUTER_MODEL')}")

import uvicorn

uvicorn.run("main:app", host="127.0.0.1", port=8000)
