"""
Pydantic models for the car advisor API.
"""

from typing import Optional
from pydantic import BaseModel, Field


# ── Request Models ──────────────────────────────────────────────────────────


class QuizAnswers(BaseModel):
    """User's quiz answers that drive the recommendation engine."""

    budget_from: int = Field(..., ge=0, description="Minimum budget in rubles")
    budget_to: int = Field(..., ge=0, description="Maximum budget in rubles")
    is_new_acceptable: bool = Field(..., description="Whether new cars are acceptable")
    is_used_acceptable: bool = Field(..., description="Whether used cars are acceptable")
    purposes: list[str] = Field(
        ...,
        description="Usage purposes: city, highway, family, first_car, offroad, work",
    )
    passengers: str = Field(
        ...,
        description="Typical number of passengers: '1-2', '3-4', '5+'",
    )
    priorities: list[str] = Field(
        ...,
        description=(
            "Priorities ordered by importance: "
            "fuel_economy, reliability, comfort, safety, looks, dynamics"
        ),
    )
    experience: str = Field(
        ...,
        description="Driving experience level: none, junior, mid, senior",
    )
    city_size: str = Field(
        ...,
        description="City size: big, medium, small",
    )
    chinese_ok: str = Field(
        ...,
        description="Attitude toward Chinese brands: yes, proven, no",
    )


class ChatContext(BaseModel):
    """Context for follow-up chat messages."""

    answers: Optional[QuizAnswers] = None
    previous_recommendations: Optional[list[dict]] = None


class ChatRequest(BaseModel):
    """Request body for the chat follow-up endpoint."""

    message: str = Field(..., min_length=1, description="User's follow-up message")
    context: Optional[ChatContext] = None


# ── Response Models ─────────────────────────────────────────────────────────


class ProConItem(BaseModel):
    """A single pro or con with text and how many owners mentioned it."""

    text: str
    owners_count: int = 0


class OwnerQuote(BaseModel):
    """A representative quote from a real car owner."""

    text: str
    experience: str = ""
    source_url: str = ""


class CarRecommendation(BaseModel):
    """A single car recommendation with reasoning based on reviews."""

    car_id: str
    match_percent: int = Field(..., ge=0, le=100)
    why_fits: str
    pros: list[ProConItem] = []
    cons: list[ProConItem] = []
    owner_quote: Optional[OwnerQuote] = None
    watch_out: str = ""
    total_reviews: int = 0


class RecommendResponse(BaseModel):
    """Full recommendation response returned by the /api/recommend endpoint."""

    recommendations: list[CarRecommendation]
    total_reviews_analyzed: int = 0
    general_advice: str = ""


class ChatResponse(BaseModel):
    """Response from the follow-up chat endpoint."""

    reply: str
    updated_recommendations: Optional[list[CarRecommendation]] = None


class StatsResponse(BaseModel):
    """Response from the /api/stats endpoint."""

    total_cars: int
    total_reviews: int
    last_updated: str
