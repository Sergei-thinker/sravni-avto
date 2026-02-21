"""
FastAPI backend for the car advisor app (СравниАвто).

Endpoints:
- POST /api/recommend  -- Get car recommendations based on quiz answers
- POST /api/chat       -- Follow-up chat about recommendations
- GET  /api/stats      -- Database statistics
- GET  /api/health     -- Health check
"""

import json
import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from llm import chat_followup, filter_cars, get_recommendations
from models import (
    ChatRequest,
    ChatResponse,
    QuizAnswers,
    RecommendResponse,
    StatsResponse,
)

# ── Configuration ───────────────────────────────────────────────────────────

# Load .env from project root (one level up from backend/)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

# Also try .env in backend/ directory
load_dotenv(Path(__file__).resolve().parent / ".env")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ── Data paths ──────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).resolve().parent / "data"
CARS_DB_PATH = DATA_DIR / "cars_database.json"
REVIEWS_DB_PATH = DATA_DIR / "reviews_database.json"

# ── In-memory data stores (loaded on startup) ──────────────────────────────

cars_database: list[dict[str, Any]] = []
reviews_database: dict[str, Any] = {}
data_last_updated: str = ""


def _load_json(path: Path) -> Any:
    """Load a JSON file, returning empty default on failure."""
    if not path.exists():
        logger.warning("Data file not found: %s", path)
        return [] if "cars" in path.name else {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.error("Failed to load %s: %s", path, e)
        return [] if "cars" in path.name else {}


# ── Lifespan ────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load databases on startup, cleanup on shutdown."""
    global cars_database, reviews_database, data_last_updated

    logger.info("Loading car database from %s", CARS_DB_PATH)
    cars_database = _load_json(CARS_DB_PATH)
    logger.info("Loaded %d cars", len(cars_database))

    logger.info("Loading reviews database from %s", REVIEWS_DB_PATH)
    reviews_database = _load_json(REVIEWS_DB_PATH)
    review_count = sum(
        len(v) if isinstance(v, list) else v.get("total_count", 1) if isinstance(v, dict) and v else 0
        for v in reviews_database.values()
    )
    logger.info("Loaded reviews for %d cars (%d total reviews)", len(reviews_database), review_count)

    # Track when data was last loaded
    data_last_updated = datetime.now().isoformat()

    # Check for API key
    if not os.getenv("OPENROUTER_API_KEY"):
        logger.warning(
            "OPENROUTER_API_KEY is not set! The /api/recommend and /api/chat "
            "endpoints will return errors. Set it in your .env file."
        )

    yield

    logger.info("Shutting down, cleaning up resources")


# ── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="СравниАвто API",
    description="Car recommendation backend powered by Claude AI and real owner reviews",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://car.create-products.com",
        "http://car.create-products.com",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ───────────────────────────────────────────────────────────────


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "cars_loaded": len(cars_database),
        "reviews_loaded": len(reviews_database),
        "api_key_set": bool(os.getenv("OPENROUTER_API_KEY")),
    }


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    """Return database statistics."""
    review_count = sum(
        len(v) if isinstance(v, list) else v.get("total_count", 1) if isinstance(v, dict) and v else 0
        for v in reviews_database.values()
    )
    return StatsResponse(
        total_cars=len(cars_database),
        total_reviews=review_count,
        last_updated=data_last_updated,
    )


@app.post("/api/recommend", response_model=RecommendResponse)
async def recommend(answers: QuizAnswers):
    """
    Get car recommendations based on quiz answers.

    1. Pre-filters cars from the database by budget, new/used, passengers, chinese pref
    2. Gathers reviews for filtered cars
    3. Sends everything to Claude for analysis
    4. Returns structured recommendations
    """
    logger.info(
        "Recommendation request: budget %d-%d, purposes=%s, priorities=%s",
        answers.budget_from,
        answers.budget_to,
        answers.purposes,
        answers.priorities,
    )

    try:
        # Step 1: Pre-filter cars
        filtered = filter_cars(answers, cars_database)
        logger.info("Pre-filter result: %d/%d cars match criteria", len(filtered), len(cars_database))

        if not filtered:
            return RecommendResponse(
                recommendations=[],
                total_reviews_analyzed=0,
                general_advice=(
                    "К сожалению, по вашим критериям не нашлось подходящих автомобилей в нашей базе. "
                    "Попробуйте расширить бюджет, изменить отношение к китайским брендам "
                    "или рассмотреть как новые, так и подержанные варианты."
                ),
            )

        # Step 2: Gather reviews for filtered cars
        filtered_reviews: dict[str, Any] = {}
        for car in filtered:
            car_id = car["id"]
            if car_id in reviews_database:
                filtered_reviews[car_id] = reviews_database[car_id]

        # Step 3: Call Claude API
        result = await get_recommendations(answers, filtered, filtered_reviews)

        logger.info(
            "Returning %d recommendations (total reviews analyzed: %d)",
            len(result.recommendations),
            result.total_reviews_analyzed,
        )
        return result

    except ValueError as e:
        logger.error("Value error in recommendation: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Ошибка обработки ответа от AI: {e}",
        ) from e
    except Exception as e:
        logger.exception("Unexpected error in recommendation endpoint")
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {type(e).__name__}: {e}",
        ) from e


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Follow-up chat endpoint for questions about recommendations.

    Accepts a message and optional context (previous answers + recommendations).
    """
    logger.info("Chat request: %s", request.message[:100])

    try:
        result = await chat_followup(request.message, request.context)
        return ChatResponse(
            reply=result["reply"],
            updated_recommendations=result.get("updated_recommendations"),
        )
    except ValueError as e:
        logger.error("Value error in chat: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"Ошибка обработки ответа от AI: {e}",
        ) from e
    except Exception as e:
        logger.exception("Unexpected error in chat endpoint")
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {type(e).__name__}: {e}",
        ) from e


# ── Run directly ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    logger.info("Starting server on %s:%d", host, port)
    uvicorn.run("main:app", host=host, port=port, reload=True)
