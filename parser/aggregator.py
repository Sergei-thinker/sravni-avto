"""
Review aggregation module.

Takes a list of RawReview objects and produces a structured summary:
  - Top pros/cons grouped by frequency
  - Common problems
  - Representative owner quotes
  - Average ratings

Two strategies:
  1. aggregate_via_llm() - uses Claude API for intelligent grouping
  2. aggregate_via_fuzzy() - simple fallback using string similarity
"""

import json
import logging
import os
import re
from datetime import datetime, timezone
from difflib import SequenceMatcher
from typing import Any, Dict, List, Optional

from parser.sources.base import RawReview

logger = logging.getLogger(__name__)


def _compute_average_rating(reviews: List[RawReview]) -> Optional[float]:
    """Compute average rating across reviews that have one."""
    ratings = [r.rating for r in reviews if r.rating is not None]
    if not ratings:
        return None
    return round(sum(ratings) / len(ratings), 1)


def _compute_category_averages(reviews: List[RawReview]) -> Dict[str, float]:
    """Average category ratings across all reviews."""
    sums: Dict[str, List[float]] = {}
    for r in reviews:
        if r.category_ratings:
            for cat, val in r.category_ratings.items():
                sums.setdefault(cat, []).append(val)
    return {cat: round(sum(vals) / len(vals), 1) for cat, vals in sums.items()}


def _collect_texts(reviews: List[RawReview], field: str) -> List[str]:
    """Collect non-empty text values from a specific field."""
    texts = []
    for r in reviews:
        val = getattr(r, field, "")
        if val and val.strip():
            texts.append(val.strip())
    return texts


# ── LLM-based aggregation ─────────────────────────────────────────────────────


def aggregate_via_llm(
    raw_reviews: List[RawReview],
    car_id: str,
    brand: str,
    model: str,
) -> Optional[Dict[str, Any]]:
    """
    Use Claude API to intelligently aggregate and summarize reviews.

    Returns a dict matching the reviews_database.json entry format, or None
    on failure.
    """
    try:
        import anthropic
    except ImportError:
        logger.error("anthropic package not installed, falling back to fuzzy")
        return None

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY not set, falling back to fuzzy aggregation")
        return None

    # Build the prompt payload
    reviews_summary = []
    for i, r in enumerate(raw_reviews[:30], 1):
        entry = f"Отзыв {i}:"
        if r.rating:
            entry += f" Оценка: {r.rating}/5."
        if r.pros_text:
            entry += f" Плюсы: {r.pros_text[:300]}."
        if r.cons_text:
            entry += f" Минусы: {r.cons_text[:300]}."
        if r.body_text:
            entry += f" Текст: {r.body_text[:200]}."
        if r.owner_experience:
            entry += f" Опыт: {r.owner_experience}."
        reviews_summary.append(entry)

    reviews_block = "\n".join(reviews_summary)

    prompt = f"""Проанализируй отзывы владельцев автомобиля {brand} {model}.

Вот {len(raw_reviews)} отзывов:

{reviews_block}

Сгруппируй похожие мнения и верни результат СТРОГО в формате JSON (без markdown):

{{
  "pros": [
    {{"text": "описание плюса", "owners_count": число_упоминаний}},
    ...
  ],
  "cons": [
    {{"text": "описание минуса", "owners_count": число_упоминаний}},
    ...
  ],
  "common_problems": [
    "проблема 1",
    "проблема 2"
  ],
  "owner_quotes": [
    {{
      "text": "цитата владельца",
      "experience": "опыт владения",
      "source_url": ""
    }}
  ],
  "summary": "краткое резюме в 2-3 предложения"
}}

Правила:
1. В pros и cons - максимум 5 пунктов каждый, отсортированных по owners_count (убывание)
2. owners_count - сколько из {len(raw_reviews)} отзывов упоминают этот аспект
3. common_problems - максимум 5 частых проблем
4. owner_quotes - 2-3 наиболее информативные цитаты
5. summary - объективное резюме на русском языке
6. Текст должен быть на русском языке
"""

    try:
        from parser.config import ANTHROPIC_MAX_TOKENS, ANTHROPIC_MODEL

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=ANTHROPIC_MAX_TOKENS,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = response.content[0].text.strip()

        # Try to extract JSON from the response (handle markdown code blocks)
        json_match = re.search(r"\{[\s\S]*\}", response_text)
        if not json_match:
            logger.error("No JSON found in LLM response")
            return None

        llm_result = json.loads(json_match.group())

    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM JSON response: %s", exc)
        return None
    except Exception as exc:
        logger.error("LLM aggregation failed: %s", exc, exc_info=True)
        return None

    # Build the final structured result
    avg_rating = _compute_average_rating(raw_reviews)
    cat_averages = _compute_category_averages(raw_reviews)

    # Enrich owner_quotes with source URLs from actual reviews
    owner_quotes = llm_result.get("owner_quotes", [])
    for i, quote in enumerate(owner_quotes):
        if not quote.get("source_url") and i < len(raw_reviews):
            quote["source_url"] = raw_reviews[i].url

    result = {
        "car_id": car_id,
        "total_reviews": len(raw_reviews),
        "average_rating": avg_rating,
        "category_ratings": cat_averages,
        "pros": llm_result.get("pros", []),
        "cons": llm_result.get("cons", []),
        "common_problems": llm_result.get("common_problems", []),
        "owner_quotes": owner_quotes,
        "summary": llm_result.get("summary", ""),
        "sources": list({r.url for r in raw_reviews}),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

    logger.info(
        "LLM aggregation for %s: %d pros, %d cons, %d problems",
        car_id,
        len(result["pros"]),
        len(result["cons"]),
        len(result["common_problems"]),
    )
    return result


# ── Fuzzy/simple aggregation (fallback) ───────────────────────────────────────


def _group_similar_texts(texts: List[str], threshold: float = 0.5) -> List[dict]:
    """
    Group similar text snippets and count occurrences.

    Uses SequenceMatcher for similarity comparison.
    Returns a list of {text, owners_count} dicts sorted by count descending.
    """
    if not texts:
        return []

    groups: List[dict] = []

    for text in texts:
        text_lower = text.lower().strip()
        matched = False

        for group in groups:
            ratio = SequenceMatcher(
                None, text_lower, group["_canonical"].lower()
            ).ratio()
            if ratio >= threshold:
                group["owners_count"] += 1
                # Keep the longer version as the representative text
                if len(text) > len(group["text"]):
                    group["text"] = text
                matched = True
                break

        if not matched:
            groups.append({
                "text": text,
                "owners_count": 1,
                "_canonical": text,
            })

    # Sort by frequency descending
    groups.sort(key=lambda g: g["owners_count"], reverse=True)

    # Remove internal field and limit to top 5
    for g in groups:
        g.pop("_canonical", None)

    return groups[:5]


def _split_into_points(texts: List[str]) -> List[str]:
    """
    Split texts that contain multiple points (comma-separated, newline-separated,
    or numbered lists) into individual items.
    """
    points = []
    for text in texts:
        # Split on common separators
        parts = re.split(r"[;\n]|\d+[\.\)]\s", text)
        for part in parts:
            part = part.strip().strip(",-. ")
            if len(part) > 5:
                points.append(part)
    return points


def aggregate_via_fuzzy(
    raw_reviews: List[RawReview],
    car_id: str,
) -> Dict[str, Any]:
    """
    Simple aggregation using string similarity - no external API required.

    Groups similar pros/cons together and counts mentions.
    """
    pros_texts = _collect_texts(raw_reviews, "pros_text")
    cons_texts = _collect_texts(raw_reviews, "cons_text")

    # Split multi-point texts into individual items
    pros_points = _split_into_points(pros_texts)
    cons_points = _split_into_points(cons_texts)

    pros = _group_similar_texts(pros_points)
    cons = _group_similar_texts(cons_points)

    # Extract common problems from cons
    common_problems = [c["text"] for c in cons[:5]]

    # Pick representative quotes from body text
    owner_quotes = []
    for r in raw_reviews[:3]:
        if r.body_text and len(r.body_text) > 20:
            owner_quotes.append({
                "text": r.body_text[:200],
                "experience": r.owner_experience,
                "source_url": r.url,
            })

    avg_rating = _compute_average_rating(raw_reviews)
    cat_averages = _compute_category_averages(raw_reviews)

    # Build summary
    summary_parts = []
    if avg_rating:
        summary_parts.append(f"Средняя оценка владельцев: {avg_rating}/5.")
    if pros:
        summary_parts.append(
            f"Главные плюсы: {', '.join(p['text'][:50] for p in pros[:3])}."
        )
    if cons:
        summary_parts.append(
            f"Основные минусы: {', '.join(c['text'][:50] for c in cons[:3])}."
        )
    summary = " ".join(summary_parts) if summary_parts else ""

    result = {
        "car_id": car_id,
        "total_reviews": len(raw_reviews),
        "average_rating": avg_rating,
        "category_ratings": cat_averages,
        "pros": pros,
        "cons": cons,
        "common_problems": common_problems,
        "owner_quotes": owner_quotes,
        "summary": summary,
        "sources": list({r.url for r in raw_reviews}),
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

    logger.info(
        "Fuzzy aggregation for %s: %d pros, %d cons",
        car_id,
        len(pros),
        len(cons),
    )
    return result
