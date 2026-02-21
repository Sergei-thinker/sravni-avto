"""
Abstract base class for review parsers.
"""

import logging
import random
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional

import requests

from parser.config import (
    DELAY_SECONDS,
    MAX_REVIEWS_PER_MODEL,
    REQUEST_TIMEOUT,
    USER_AGENTS,
)

logger = logging.getLogger(__name__)


@dataclass
class RawReview:
    """A single raw review scraped from a source site."""

    source: str  # "drom" / "autoru"
    url: str
    rating: Optional[float] = None
    pros_text: str = ""
    cons_text: str = ""
    body_text: str = ""
    owner_experience: str = ""
    car_year: Optional[int] = None
    review_date: str = ""
    category_ratings: Optional[dict] = field(default_factory=dict)


class BaseReviewParser(ABC):
    """Abstract base for site-specific review parsers."""

    def __init__(self) -> None:
        self._session = requests.Session()

    # ── Abstract interface ─────────────────────────────────────────────────

    @abstractmethod
    def get_reviews_page_url(self, brand: str, model: str, page: int) -> str:
        """Return the URL for the reviews list page (paginated)."""
        ...

    @abstractmethod
    def parse_reviews_list(self, html: str) -> List[str]:
        """Parse the list page HTML and return individual review URLs."""
        ...

    @abstractmethod
    def parse_single_review(self, html: str, url: str) -> Optional[RawReview]:
        """Parse a single review page HTML into a RawReview."""
        ...

    # ── Shared fetch logic ─────────────────────────────────────────────────

    def _get_headers(self) -> dict:
        """Return request headers with a random User-Agent."""
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
        }

    def _fetch_page(self, url: str) -> Optional[str]:
        """Fetch a page with rate limiting, retries, and error handling."""
        for attempt in range(3):
            try:
                time.sleep(DELAY_SECONDS + random.uniform(0.5, 2.0))
                response = self._session.get(
                    url,
                    headers=self._get_headers(),
                    timeout=REQUEST_TIMEOUT,
                )
                if response.status_code == 200:
                    return response.text
                if response.status_code == 429:
                    wait = DELAY_SECONDS * (attempt + 2)
                    logger.warning(
                        "Rate limited (429) on %s, waiting %.1fs", url, wait
                    )
                    time.sleep(wait)
                    continue
                if response.status_code == 404:
                    logger.warning("Page not found (404): %s", url)
                    return None
                logger.warning(
                    "HTTP %d for %s (attempt %d/3)",
                    response.status_code,
                    url,
                    attempt + 1,
                )
            except requests.RequestException as exc:
                logger.error(
                    "Request error for %s (attempt %d/3): %s",
                    url,
                    attempt + 1,
                    exc,
                )
                time.sleep(DELAY_SECONDS * (attempt + 1))
        logger.error("Failed to fetch %s after 3 attempts", url)
        return None

    def fetch_reviews(
        self, brand: str, model: str, max_reviews: int = MAX_REVIEWS_PER_MODEL
    ) -> List[RawReview]:
        """
        Fetch up to *max_reviews* reviews for a given car model.

        1. Iterates through paginated list pages.
        2. Collects individual review URLs.
        3. Fetches and parses each review page.
        """
        review_urls: List[str] = []
        page = 1

        logger.info("Fetching reviews for %s %s (max %d)", brand, model, max_reviews)

        # Step 1: Collect review URLs from list pages
        while len(review_urls) < max_reviews:
            list_url = self.get_reviews_page_url(brand, model, page)
            logger.debug("Fetching list page %d: %s", page, list_url)

            html = self._fetch_page(list_url)
            if html is None:
                logger.info(
                    "No more list pages for %s %s (stopped at page %d)",
                    brand,
                    model,
                    page,
                )
                break

            urls = self.parse_reviews_list(html)
            if not urls:
                logger.info(
                    "No review links found on page %d for %s %s",
                    page,
                    brand,
                    model,
                )
                break

            review_urls.extend(urls)
            logger.debug(
                "Found %d review links on page %d (total: %d)",
                len(urls),
                page,
                len(review_urls),
            )
            page += 1

        # Trim to the requested maximum
        review_urls = review_urls[:max_reviews]
        logger.info(
            "Collected %d review URLs for %s %s", len(review_urls), brand, model
        )

        # Step 2: Fetch and parse individual reviews
        reviews: List[RawReview] = []
        for idx, url in enumerate(review_urls, 1):
            logger.debug("Parsing review %d/%d: %s", idx, len(review_urls), url)
            html = self._fetch_page(url)
            if html is None:
                continue
            try:
                review = self.parse_single_review(html, url)
                if review is not None:
                    reviews.append(review)
            except Exception as exc:
                logger.error("Error parsing review %s: %s", url, exc, exc_info=True)

        logger.info(
            "Successfully parsed %d/%d reviews for %s %s",
            len(reviews),
            len(review_urls),
            brand,
            model,
        )
        return reviews
