"""
LLM integration for the car advisor via OpenRouter API.

Handles:
- Pre-filtering cars from the database based on quiz answers
- Building prompts with user context + car data + reviews
- Calling LLM API and parsing structured responses
- Follow-up chat conversations
"""

import json
import logging
import os
from typing import Any

from openai import AsyncOpenAI

from models import (
    CarRecommendation,
    ChatContext,
    OwnerQuote,
    ProConItem,
    QuizAnswers,
    RecommendResponse,
)

logger = logging.getLogger(__name__)

# ── Chinese brands list (used for filtering) ────────────────────────────────

CHINESE_BRANDS = {
    "Haval", "Chery", "Geely", "Changan", "Exeed",
    "Omoda", "Jaecoo", "Jetour", "Tank", "Belgee",
}

# Well-established Chinese brands (for "proven" filter)
PROVEN_CHINESE_BRANDS = {"Haval", "Chery", "Geely", "Changan"}

# ── System Prompt ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Ты -- эксперт-автоконсультант для российского рынка. Твоя задача -- помочь пользователю выбрать автомобиль на основе его ответов на анкету и реальных отзывов владельцев.

ПРАВИЛА:
1. Рекомендуй только автомобили из предоставленного списка (filtered_cars). Не придумывай автомобили.
2. Каждая рекомендация должна быть основана на реальных характеристиках автомобиля и отзывах владельцев (если доступны).
3. Отвечай ТОЛЬКО на русском языке.
4. Будь честным -- указывай как плюсы, так и минусы каждого автомобиля.
5. Учитывай приоритеты пользователя (priorities) при ранжировании -- первый приоритет самый важный.
6. Рекомендуй от 3 до 5 автомобилей, отсортированных по степени соответствия (match_percent).
7. match_percent должен отражать реальное соответствие запросу: 90-100% = идеальное попадание, 70-89% = хорошо подходит, 50-69% = компромиссный вариант.
8. В поле why_fits объясни простым языком, почему эта машина подходит именно этому пользователю.
9. В поле watch_out укажи, на что обратить внимание при покупке (типичные проблемы, нюансы).
10. В general_advice дай общий совет по выбору, исходя из ситуации пользователя.
11. Если есть отзывы владельцев -- используй их для формирования pros, cons и owner_quote.
12. Если отзывов нет -- сформируй pros и cons на основе характеристик автомобиля и общеизвестной информации, но установи owners_count = 0.
13. owner_quote -- реальная цитата из отзыва (если есть), или null (если отзывов нет).

ФОРМАТ ОТВЕТА (строго JSON):
{
  "recommendations": [
    {
      "car_id": "string (id из базы)",
      "match_percent": number (0-100),
      "why_fits": "string",
      "pros": [{"text": "string", "owners_count": number}],
      "cons": [{"text": "string", "owners_count": number}],
      "owner_quote": {"text": "string", "experience": "string", "source_url": "string"} | null,
      "watch_out": "string",
      "total_reviews": number
    }
  ],
  "total_reviews_analyzed": number,
  "general_advice": "string"
}

Отвечай ТОЛЬКО валидным JSON. Никакого текста до или после JSON."""


# ── Helper Functions ────────────────────────────────────────────────────────


def _get_client() -> AsyncOpenAI:
    """Create an async OpenAI client configured for OpenRouter."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY environment variable is not set. "
            "Please set it in your .env file or environment."
        )
    return AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )


def _get_model() -> str:
    """Get the model name from environment or use default."""
    return os.getenv("OPENROUTER_MODEL", "anthropic/claude-sonnet-4-5-20250929")


def _min_seats_for_passengers(passengers: str) -> int:
    """Return minimum seats required based on passenger count preference."""
    mapping = {"1-2": 2, "3-4": 5, "5+": 7}
    return mapping.get(passengers, 5)


def filter_cars(answers: QuizAnswers, cars_database: list[dict]) -> list[dict]:
    """
    Pre-filter cars from the database based on quiz answers.

    Filters applied:
    - Budget range (price overlap)
    - New/used preference
    - Minimum seats based on passengers
    - Chinese brand preference
    """
    filtered = []
    min_seats = _min_seats_for_passengers(answers.passengers)

    for car in cars_database:
        # Budget filter: car price range must overlap with user budget
        car_price_from = car.get("price_from", 0)
        car_price_to = car.get("price_to", 0)
        if car_price_to < answers.budget_from or car_price_from > answers.budget_to:
            continue

        # New/used filter
        is_new = car.get("is_new", True)
        if is_new and not answers.is_new_acceptable:
            continue
        if not is_new and not answers.is_used_acceptable:
            continue

        # Seats filter
        seats = car.get("seats", 5)
        if seats < min_seats:
            continue

        # Chinese brand preference filter
        brand = car.get("brand", "")
        is_chinese = brand in CHINESE_BRANDS
        if answers.chinese_ok == "no" and is_chinese:
            continue
        if answers.chinese_ok == "proven" and is_chinese and brand not in PROVEN_CHINESE_BRANDS:
            continue

        filtered.append(car)

    logger.info(
        "Pre-filtered %d cars down to %d based on quiz answers",
        len(cars_database),
        len(filtered),
    )
    return filtered


def _build_recommend_prompt(
    answers: QuizAnswers,
    filtered_cars: list[dict],
    reviews_data: dict[str, Any],
) -> str:
    """Build the user prompt for the recommendation request."""

    # Translate purposes for readability
    purpose_map = {
        "city": "город",
        "highway": "трасса",
        "family": "семья",
        "first_car": "первая машина",
        "offroad": "бездорожье",
        "work": "работа/коммерция",
    }
    purposes_ru = [purpose_map.get(p, p) for p in answers.purposes]

    # Translate priorities
    priority_map = {
        "fuel_economy": "экономичность",
        "reliability": "надежность",
        "comfort": "комфорт",
        "safety": "безопасность",
        "looks": "внешний вид",
        "dynamics": "динамика",
    }
    priorities_ru = [priority_map.get(p, p) for p in answers.priorities]

    # Translate experience
    experience_map = {
        "none": "нет опыта (первый автомобиль)",
        "junior": "до 3 лет",
        "mid": "3-10 лет",
        "senior": "более 10 лет",
    }
    experience_ru = experience_map.get(answers.experience, answers.experience)

    # Translate city size
    city_map = {
        "big": "крупный город (Москва, СПб, миллионник)",
        "medium": "средний город (300-900 тыс.)",
        "small": "малый город / село",
    }
    city_ru = city_map.get(answers.city_size, answers.city_size)

    # Translate chinese preference
    chinese_map = {
        "yes": "да, рассматриваю любые",
        "proven": "только проверенные (Haval, Chery, Geely, Changan)",
        "no": "нет, не рассматриваю",
    }
    chinese_ru = chinese_map.get(answers.chinese_ok, answers.chinese_ok)

    # Build car summaries
    cars_text = ""
    for car in filtered_cars:
        car_id = car["id"]
        review_count = 0
        review_summary = "Отзывов пока нет."

        if car_id in reviews_data and reviews_data[car_id]:
            car_reviews = reviews_data[car_id]
            if isinstance(car_reviews, dict):
                review_count = car_reviews.get("total_count", 0)
                if "summary" in car_reviews:
                    review_summary = car_reviews["summary"]
                elif "reviews" in car_reviews:
                    review_count = len(car_reviews["reviews"])
                    # Compile first few reviews
                    snippets = []
                    for r in car_reviews["reviews"][:5]:
                        text = r.get("text", r.get("summary", ""))
                        if text:
                            snippets.append(f"  - {text[:200]}")
                    if snippets:
                        review_summary = "\n".join(snippets)
            elif isinstance(car_reviews, list):
                review_count = len(car_reviews)
                snippets = []
                for r in car_reviews[:5]:
                    text = r.get("text", r.get("summary", ""))
                    if text:
                        snippets.append(f"  - {text[:200]}")
                if snippets:
                    review_summary = "\n".join(snippets)

        cars_text += f"""
--- {car['brand']} {car['model']} (id: {car_id}) ---
Год: {car.get('year', 'N/A')}
Цена: {car.get('price_from', 0):,} - {car.get('price_to', 0):,} руб.
Новый: {'да' if car.get('is_new') else 'нет (б/у)'}
Кузов: {car.get('body_type', 'N/A')}
Двигатель: {car.get('engine_volume', 'N/A')}л, {car.get('power_hp', 'N/A')} л.с.
Расход (город/трасса): {car.get('fuel_consumption_city', 'N/A')}/{car.get('fuel_consumption_highway', 'N/A')} л/100км
КПП: {car.get('transmission', 'N/A')}
Привод: {car.get('drive', 'N/A')}
Клиренс: {car.get('clearance_mm', 'N/A')} мм
Багажник: {car.get('trunk_volume_l', 'N/A')} л
Мест: {car.get('seats', 'N/A')}
Подушки безопасности: {car.get('safety_airbags', 'N/A')}
Страна: {car.get('country', 'N/A')} (сборка: {car.get('assembly', 'N/A')})
Гарантия: {car.get('warranty_years', 0)} лет
Подходит для: {', '.join(car.get('best_for', []))}
Оценки: надежность {car.get('reliability_score', 'N/A')}/10, комфорт {car.get('comfort_score', 'N/A')}/10, безопасность {car.get('safety_score', 'N/A')}/10, цена/качество {car.get('value_score', 'N/A')}/10
Кол-во отзывов: {review_count}
Отзывы: {review_summary}
"""

    prompt = f"""АНКЕТА ПОЛЬЗОВАТЕЛЯ:
- Бюджет: {answers.budget_from:,} - {answers.budget_to:,} руб.
- Новый/б.у.: {'новый' if answers.is_new_acceptable else ''}{' и ' if answers.is_new_acceptable and answers.is_used_acceptable else ''}{'б/у' if answers.is_used_acceptable else ''}
- Цели использования: {', '.join(purposes_ru)}
- Пассажиры: {answers.passengers} человек(а)
- Приоритеты (по убыванию важности): {', '.join(priorities_ru)}
- Водительский опыт: {experience_ru}
- Размер города: {city_ru}
- Китайские авто: {chinese_ru}

ПОДХОДЯЩИЕ АВТОМОБИЛИ ИЗ БАЗЫ ({len(filtered_cars)} шт.):
{cars_text}

Проанализируй анкету пользователя и подбери 3-5 лучших автомобилей из списка выше. Верни ответ в формате JSON."""

    return prompt


def _parse_recommendation_response(raw_text: str) -> dict:
    """Parse LLM's JSON response, handling potential formatting issues."""
    text = raw_text.strip()

    # Remove markdown code block wrapper if present
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse LLM response as JSON: %s", e)
        logger.debug("Raw response: %s", raw_text[:500])
        raise ValueError(f"LLM returned invalid JSON: {e}") from e


def _dict_to_recommendation(data: dict) -> CarRecommendation:
    """Convert a raw dict from LLM's response into a CarRecommendation."""
    pros = []
    for p in data.get("pros", []):
        if isinstance(p, dict):
            pros.append(ProConItem(text=p.get("text", ""), owners_count=p.get("owners_count", 0)))
        elif isinstance(p, str):
            pros.append(ProConItem(text=p, owners_count=0))

    cons = []
    for c in data.get("cons", []):
        if isinstance(c, dict):
            cons.append(ProConItem(text=c.get("text", ""), owners_count=c.get("owners_count", 0)))
        elif isinstance(c, str):
            cons.append(ProConItem(text=c, owners_count=0))

    owner_quote = None
    oq = data.get("owner_quote")
    if oq and isinstance(oq, dict) and oq.get("text"):
        owner_quote = OwnerQuote(
            text=oq.get("text", ""),
            experience=oq.get("experience", ""),
            source_url=oq.get("source_url", ""),
        )

    return CarRecommendation(
        car_id=data.get("car_id", "unknown"),
        match_percent=max(0, min(100, data.get("match_percent", 0))),
        why_fits=data.get("why_fits", ""),
        pros=pros,
        cons=cons,
        owner_quote=owner_quote,
        watch_out=data.get("watch_out", ""),
        total_reviews=data.get("total_reviews", 0),
    )


# ── Public API ──────────────────────────────────────────────────────────────


async def get_recommendations(
    answers: QuizAnswers,
    filtered_cars: list[dict],
    reviews_data: dict[str, Any],
) -> RecommendResponse:
    """
    Get car recommendations from LLM based on quiz answers.

    Args:
        answers: User's quiz answers.
        filtered_cars: Pre-filtered list of car dicts from the database.
        reviews_data: Reviews dict keyed by car_id.

    Returns:
        RecommendResponse with recommendations and general advice.

    Raises:
        ValueError: If LLM returns unparseable JSON.
    """
    if not filtered_cars:
        return RecommendResponse(
            recommendations=[],
            total_reviews_analyzed=0,
            general_advice=(
                "К сожалению, по вашим критериям не нашлось подходящих автомобилей. "
                "Попробуйте расширить бюджет или изменить другие параметры."
            ),
        )

    client = _get_client()
    model = _get_model()
    user_prompt = _build_recommend_prompt(answers, filtered_cars, reviews_data)

    logger.info("Sending recommendation request to %s (%d cars)", model, len(filtered_cars))

    response = await client.chat.completions.create(
        model=model,
        max_tokens=4096,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    raw_text = response.choices[0].message.content
    parsed = _parse_recommendation_response(raw_text)

    recommendations = [
        _dict_to_recommendation(r)
        for r in parsed.get("recommendations", [])
    ]

    return RecommendResponse(
        recommendations=recommendations,
        total_reviews_analyzed=parsed.get("total_reviews_analyzed", 0),
        general_advice=parsed.get("general_advice", ""),
    )


async def chat_followup(message: str, context: ChatContext | None) -> dict:
    """
    Handle a follow-up chat message about car recommendations.

    Args:
        message: User's follow-up question or message.
        context: Optional context with previous answers and recommendations.

    Returns:
        Dict with 'reply' and optional 'updated_recommendations'.
    """
    client = _get_client()
    model = _get_model()

    # Build context messages
    system = (
        "Ты -- эксперт-автоконсультант для российского рынка. "
        "Пользователь уже получил рекомендации и задает уточняющий вопрос. "
        "Отвечай на русском языке, дружелюбно и по делу. "
        "Если пользователь просит обновить рекомендации, верни JSON с полем "
        "'updated_recommendations' в том же формате, что и основные рекомендации. "
        "Если это просто вопрос -- ответь текстом в поле 'reply'.\n\n"
        "Формат ответа (строго JSON):\n"
        '{"reply": "текст ответа", "updated_recommendations": null | [...]}'
    )

    messages = [{"role": "system", "content": system}]

    # Add context as first user message if available
    if context:
        context_parts = []
        if context.answers:
            context_parts.append(
                f"Мои параметры поиска: бюджет {context.answers.budget_from:,}-"
                f"{context.answers.budget_to:,} руб., "
                f"цели: {', '.join(context.answers.purposes)}, "
                f"приоритеты: {', '.join(context.answers.priorities)}"
            )
        if context.previous_recommendations:
            cars_str = ", ".join(
                r.get("car_id", "?") for r in context.previous_recommendations
            )
            context_parts.append(f"Мне рекомендовали: {cars_str}")

        if context_parts:
            messages.append({
                "role": "user",
                "content": "Контекст: " + ". ".join(context_parts),
            })
            messages.append({
                "role": "assistant",
                "content": "Понял, я помню ваши параметры и предыдущие рекомендации. Чем могу помочь?",
            })

    messages.append({"role": "user", "content": message})

    logger.info("Sending chat follow-up to %s", model)

    response = await client.chat.completions.create(
        model=model,
        max_tokens=2048,
        messages=messages,
    )

    raw_text = response.choices[0].message.content

    # Try to parse as JSON first
    try:
        parsed = _parse_recommendation_response(raw_text)
        reply = parsed.get("reply", raw_text)
        updated = parsed.get("updated_recommendations")
        if updated and isinstance(updated, list):
            updated = [_dict_to_recommendation(r) for r in updated]
        else:
            updated = None
        return {"reply": reply, "updated_recommendations": updated}
    except (ValueError, json.JSONDecodeError):
        # LLM responded with plain text -- that's fine for simple answers
        return {"reply": raw_text, "updated_recommendations": None}
