"""
Main orchestrator for the reviews parser.

Loads cars_database.json, fetches reviews from Drom.ru for each car model,
aggregates them via LLM (or fuzzy fallback), and saves to reviews_database.json.

Usage:
    python -m parser.reviews_parser                   # Parse all models
    python -m parser.reviews_parser --model lada_granta  # Parse specific model
    python -m parser.reviews_parser --force            # Ignore freshness check
    python -m parser.reviews_parser --no-llm           # Skip LLM, use fuzzy only
"""

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

from parser.aggregator import aggregate_via_fuzzy, aggregate_via_llm
from parser.config import (
    CARS_DB_PATH,
    FRESHNESS_DAYS,
    LOG_DIR,
    LOG_FILE,
    MAX_REVIEWS_PER_MODEL,
    REVIEWS_DB_PATH,
)
from parser.sources.drom import DromParser

# Load .env from project root
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


# ── Logging setup ──────────────────────────────────────────────────────────────


def setup_logging(verbose: bool = False) -> None:
    """Configure logging to both file and console."""
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    log_level = logging.DEBUG if verbose else logging.INFO

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # File handler
    file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(file_fmt)
    root_logger.addHandler(file_handler)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%H:%M:%S",
    )
    console_handler.setFormatter(console_fmt)
    root_logger.addHandler(console_handler)


logger = logging.getLogger(__name__)


# ── Data loading / saving ──────────────────────────────────────────────────────


def load_cars_database() -> List[Dict[str, Any]]:
    """Load the cars database from JSON."""
    if not CARS_DB_PATH.exists():
        logger.error("Cars database not found: %s", CARS_DB_PATH)
        sys.exit(1)

    with open(CARS_DB_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    logger.info("Loaded %d cars from %s", len(data), CARS_DB_PATH)
    return data


def load_reviews_database() -> Dict[str, Any]:
    """Load existing reviews database, or return empty dict."""
    if not REVIEWS_DB_PATH.exists():
        logger.info("No existing reviews database, starting fresh")
        return {}

    with open(REVIEWS_DB_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, dict):
        logger.info("Loaded reviews for %d models", len(data))
        return data

    logger.warning("Reviews database has unexpected format, starting fresh")
    return {}


def save_reviews_database(reviews_db: Dict[str, Any]) -> None:
    """Save the reviews database to JSON (atomic write via temp file)."""
    REVIEWS_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    tmp_path = REVIEWS_DB_PATH.with_suffix(".tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(reviews_db, f, ensure_ascii=False, indent=2)

    # Atomic rename
    tmp_path.replace(REVIEWS_DB_PATH)
    logger.debug("Saved reviews database (%d entries)", len(reviews_db))


# ── Freshness check ───────────────────────────────────────────────────────────


def is_fresh(reviews_entry: Optional[Dict], days: int = FRESHNESS_DAYS) -> bool:
    """Check if a reviews entry was updated recently enough to skip."""
    if not reviews_entry:
        return False

    last_updated = reviews_entry.get("last_updated")
    if not last_updated:
        return False

    try:
        updated_dt = datetime.fromisoformat(last_updated)
        # Make timezone-aware if needed
        if updated_dt.tzinfo is None:
            updated_dt = updated_dt.replace(tzinfo=timezone.utc)
        age = datetime.now(timezone.utc) - updated_dt
        return age.days < days
    except (ValueError, TypeError):
        return False


# ── Main orchestration ─────────────────────────────────────────────────────────


def parse_model(
    car: Dict[str, Any],
    reviews_db: Dict[str, Any],
    drom_parser: DromParser,
    use_llm: bool = True,
    force: bool = False,
) -> bool:
    """
    Parse reviews for a single car model.

    Returns True if the model was updated, False if skipped.
    """
    car_id = car["id"]
    brand = car.get("brand", "")
    model = car.get("model", "")
    drom_slug = car.get("drom_slug", "")

    if not drom_slug:
        logger.warning("No drom_slug for %s, skipping", car_id)
        return False

    # Check freshness
    if not force and is_fresh(reviews_db.get(car_id)):
        logger.info(
            "Skipping %s %s - reviews are fresh (< %d days old)",
            brand,
            model,
            FRESHNESS_DAYS,
        )
        return False

    logger.info("=" * 60)
    logger.info("Processing: %s %s (id: %s)", brand, model, car_id)
    logger.info("=" * 60)

    # Extract brand/model from drom_slug (e.g. "lada/granta")
    slug_parts = drom_slug.split("/")
    if len(slug_parts) != 2:
        logger.error("Invalid drom_slug format: %s", drom_slug)
        return False

    slug_brand, slug_model = slug_parts

    # Fetch reviews from Drom.ru
    raw_reviews = drom_parser.fetch_reviews(
        slug_brand, slug_model, max_reviews=MAX_REVIEWS_PER_MODEL
    )

    if not raw_reviews:
        logger.warning("No reviews fetched for %s %s", brand, model)
        return False

    logger.info("Fetched %d raw reviews for %s %s", len(raw_reviews), brand, model)

    # Aggregate
    result = None
    if use_llm:
        result = aggregate_via_llm(raw_reviews, car_id, brand, model)
        if result:
            logger.info("LLM aggregation successful for %s", car_id)

    if result is None:
        logger.info("Using fuzzy aggregation for %s", car_id)
        result = aggregate_via_fuzzy(raw_reviews, car_id)

    # Store result
    reviews_db[car_id] = result
    return True


def main() -> None:
    """Main entry point for the reviews parser."""

    # ── CLI arguments ──────────────────────────────────────────────────────

    arg_parser = argparse.ArgumentParser(
        description="Parse car owner reviews from Drom.ru"
    )
    arg_parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Parse only a specific model by car_id (e.g. lada_granta)",
    )
    arg_parser.add_argument(
        "--force",
        action="store_true",
        help="Ignore freshness check, re-parse all models",
    )
    arg_parser.add_argument(
        "--no-llm",
        action="store_true",
        help="Skip LLM aggregation, use fuzzy fallback only",
    )
    arg_parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable debug logging",
    )
    arg_parser.add_argument(
        "--max-reviews",
        type=int,
        default=None,
        help=f"Override max reviews per model (default: {MAX_REVIEWS_PER_MODEL})",
    )

    args = arg_parser.parse_args()

    # ── Setup ──────────────────────────────────────────────────────────────

    setup_logging(verbose=args.verbose)

    logger.info("=" * 70)
    logger.info("Reviews Parser started at %s", datetime.now().isoformat())
    logger.info("=" * 70)

    if args.max_reviews:
        # Override the global config at module level (for this run)
        import parser.config as cfg
        cfg.MAX_REVIEWS_PER_MODEL = args.max_reviews

    # Load databases
    cars = load_cars_database()
    reviews_db = load_reviews_database()

    # Filter to specific model if requested
    if args.model:
        cars = [c for c in cars if c["id"] == args.model]
        if not cars:
            logger.error("Model '%s' not found in cars database", args.model)
            sys.exit(1)
        logger.info("Targeting specific model: %s", args.model)

    # ── Process each car ───────────────────────────────────────────────────

    drom = DromParser()
    updated_count = 0
    total_new_reviews = 0
    errors = 0

    for i, car in enumerate(cars, 1):
        logger.info("--- Model %d/%d ---", i, len(cars))
        try:
            old_count = (
                reviews_db.get(car["id"], {}).get("total_reviews", 0)
                if car["id"] in reviews_db
                else 0
            )

            was_updated = parse_model(
                car,
                reviews_db,
                drom,
                use_llm=not args.no_llm,
                force=args.force,
            )

            if was_updated:
                updated_count += 1
                new_count = reviews_db.get(car["id"], {}).get("total_reviews", 0)
                total_new_reviews += max(0, new_count - old_count)

                # Save intermediate results after each successful model
                save_reviews_database(reviews_db)
                logger.info(
                    "Intermediate save: %d models in reviews database",
                    len(reviews_db),
                )

        except KeyboardInterrupt:
            logger.warning("Interrupted by user, saving progress...")
            save_reviews_database(reviews_db)
            sys.exit(0)
        except Exception as exc:
            errors += 1
            logger.error(
                "Error processing %s: %s", car.get("id", "?"), exc, exc_info=True
            )

    # ── Final save and summary ─────────────────────────────────────────────

    save_reviews_database(reviews_db)

    logger.info("=" * 70)
    logger.info("SUMMARY")
    logger.info("=" * 70)
    logger.info("Total models in database: %d", len(cars))
    logger.info("Models updated this run: %d", updated_count)
    logger.info("New reviews added: %d", total_new_reviews)
    logger.info("Errors: %d", errors)
    logger.info(
        "Reviews database: %d entries", len(reviews_db)
    )
    logger.info("=" * 70)

    # Human-friendly summary (for cron email notifications)
    print(
        f"\nОбновлено {updated_count} моделей, "
        f"добавлено {total_new_reviews} новых отзывов"
    )
    if errors:
        print(f"Ошибок: {errors}")


if __name__ == "__main__":
    main()
