"""
Stub parser for Auto.ru car owner reviews.

Auto.ru is a Single Page Application (SPA) that renders reviews via JavaScript.
A proper implementation would require Playwright or Selenium for headless browsing.
This stub is a placeholder that can be extended later.
"""

import logging
from typing import List, Optional

from parser.sources.base import BaseReviewParser, RawReview

logger = logging.getLogger(__name__)


class AutoruParser(BaseReviewParser):
    """
    Stub parser for Auto.ru.

    Auto.ru renders reviews client-side, so requests + BeautifulSoup cannot
    extract them. This class returns empty results and logs a notice.
    A future version should use Playwright to render the JavaScript.
    """

    SOURCE_NAME = "autoru"
    BASE_URL = "https://auto.ru"

    def get_reviews_page_url(self, brand: str, model: str, page: int) -> str:
        slug = f"{brand}/{model}".lower()
        if page <= 1:
            return f"{self.BASE_URL}/reviews/{slug}/"
        return f"{self.BASE_URL}/reviews/{slug}/page/{page}/"

    def parse_reviews_list(self, html: str) -> List[str]:
        logger.info(
            "AutoruParser.parse_reviews_list: stub - "
            "Auto.ru is a SPA and requires Playwright for scraping."
        )
        return []

    def parse_single_review(self, html: str, url: str) -> Optional[RawReview]:
        logger.info(
            "AutoruParser.parse_single_review: stub - "
            "Auto.ru is a SPA and requires Playwright for scraping."
        )
        return None

    def fetch_reviews(
        self, brand: str, model: str, max_reviews: int = 30
    ) -> List[RawReview]:
        """Override to short-circuit without making any HTTP requests."""
        logger.info(
            "AutoruParser: skipping %s %s - Auto.ru requires Playwright "
            "(SPA). This parser is a stub for future implementation.",
            brand,
            model,
        )
        return []
