"""
Configuration for the reviews parser.
"""

from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

CARS_DB_PATH = PROJECT_ROOT / "backend" / "data" / "cars_database.json"
REVIEWS_DB_PATH = PROJECT_ROOT / "backend" / "data" / "reviews_database.json"
LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "parser.log"

# ── Request Settings ───────────────────────────────────────────────────────────

DELAY_SECONDS = 3.0
REQUEST_TIMEOUT = 30
MAX_REVIEWS_PER_MODEL = 30

# ── User-Agent Rotation ───────────────────────────────────────────────────────

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) "
    "Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]

# ── Claude API Settings ───────────────────────────────────────────────────────

ANTHROPIC_MODEL = "claude-sonnet-4-20250514"
ANTHROPIC_MAX_TOKENS = 4096

# ── Freshness Settings ─────────────────────────────────────────────────────────

FRESHNESS_DAYS = 7  # Skip models updated less than this many days ago
