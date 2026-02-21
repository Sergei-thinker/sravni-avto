"""
Parser for Drom.ru car owner reviews.

Drom.ru review page structure (as of 2024-2025):
- Review list: https://www.drom.ru/reviews/{brand}/{model}/
- Pagination: https://www.drom.ru/reviews/{brand}/{model}/page{N}/
- Individual review: https://www.drom.ru/reviews/{brand}/{model}/{review_id}.html

Review list page contains links to individual reviews inside article/div blocks.
Each individual review page contains:
  - Overall rating (star-based)
  - Category ratings (comfort, reliability, etc.)
  - Pros section (advantages)
  - Cons section (disadvantages)
  - Body text (detailed review)
  - Owner experience / car year info
"""

import logging
import re
from typing import List, Optional

from bs4 import BeautifulSoup, Tag

from parser.sources.base import BaseReviewParser, RawReview

logger = logging.getLogger(__name__)


class DromParser(BaseReviewParser):
    """Scrapes car owner reviews from Drom.ru."""

    SOURCE_NAME = "drom"
    BASE_URL = "https://www.drom.ru"

    # ── URL construction ───────────────────────────────────────────────────

    def get_reviews_page_url(self, brand: str, model: str, page: int) -> str:
        slug = f"{brand}/{model}".lower()
        if page <= 1:
            return f"{self.BASE_URL}/reviews/{slug}/"
        return f"{self.BASE_URL}/reviews/{slug}/page{page}/"

    # ── List page parsing ──────────────────────────────────────────────────

    def parse_reviews_list(self, html: str) -> List[str]:
        """Extract individual review URLs from a reviews list page."""
        soup = BeautifulSoup(html, "lxml")
        urls: List[str] = []

        # Drom.ru review list pages contain links to individual reviews.
        # Reviews follow the pattern: /reviews/{brand}/{model}/{id}.html
        # We look for <a> tags whose href matches this pattern.
        review_pattern = re.compile(
            r"^https?://www\.drom\.ru/reviews/[^/]+/[^/]+/\d+\.html"
        )

        # Strategy 1: Find all links matching the review URL pattern
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if review_pattern.match(href):
                if href not in urls:
                    urls.append(href)

        # Strategy 2: If no direct full URLs found, look for relative links
        if not urls:
            relative_pattern = re.compile(r"/reviews/[^/]+/[^/]+/\d+\.html")
            for link in soup.find_all("a", href=True):
                href = link["href"]
                if relative_pattern.match(href):
                    full_url = f"{self.BASE_URL}{href}"
                    if full_url not in urls:
                        urls.append(full_url)

        logger.debug("Found %d review URLs on list page", len(urls))
        return urls

    # ── Single review parsing ──────────────────────────────────────────────

    def parse_single_review(self, html: str, url: str) -> Optional[RawReview]:
        """Parse a single Drom.ru review page into a RawReview."""
        soup = BeautifulSoup(html, "lxml")

        rating = self._extract_rating(soup)
        pros = self._extract_pros(soup)
        cons = self._extract_cons(soup)
        body = self._extract_body(soup)
        experience = self._extract_experience(soup)
        car_year = self._extract_car_year(soup, url)
        review_date = self._extract_review_date(soup)
        category_ratings = self._extract_category_ratings(soup)

        # At minimum we need some textual content
        if not pros and not cons and not body:
            logger.warning("No content extracted from review: %s", url)
            return None

        return RawReview(
            source=self.SOURCE_NAME,
            url=url,
            rating=rating,
            pros_text=pros,
            cons_text=cons,
            body_text=body[:500] if body else "",
            owner_experience=experience,
            car_year=car_year,
            review_date=review_date,
            category_ratings=category_ratings,
        )

    # ── Private extraction helpers ─────────────────────────────────────────

    def _extract_rating(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract the overall star rating from the review page."""

        # Drom uses several rating display patterns:
        # 1) A div/span with class containing "rating" and a numeric value
        # 2) A dedicated rating element near the title
        # 3) SVG stars - count filled vs empty

        # Pattern 1: Look for a prominent rating number (e.g. "4.5" out of 5)
        for selector in [
            '[class*="reviewRating"]',
            '[class*="Rating"]',
            '[class*="rating"]',
            '[class*="score"]',
        ]:
            el = soup.select_one(selector)
            if el:
                rating = self._parse_float(el.get_text(strip=True))
                if rating and 0 < rating <= 5:
                    return rating
                # Sometimes rating is in an attribute
                for attr in ("content", "data-value", "data-rating"):
                    val = el.get(attr)
                    if val:
                        rating = self._parse_float(val)
                        if rating and 0 < rating <= 5:
                            return rating

        # Pattern 2: Look for meta tag with rating
        meta = soup.find("meta", itemprop="ratingValue")
        if meta and meta.get("content"):
            rating = self._parse_float(meta["content"])
            if rating and 0 < rating <= 5:
                return rating

        # Pattern 3: Look for star icons (filled stars)
        star_containers = soup.select('[class*="star"]')
        for container in star_containers:
            filled = len(container.select('[class*="filled"], [class*="active"]'))
            if filled > 0:
                return float(filled)

        # Pattern 4: Text-based "Оценка: X" or "X из 5"
        text = soup.get_text()
        match = re.search(r"[Оо]ценка[:\s]+(\d[.,]\d)", text)
        if match:
            return self._parse_float(match.group(1))

        return None

    def _extract_pros(self, soup: BeautifulSoup) -> str:
        """Extract the 'Достоинства' (pros/advantages) section."""

        # Drom.ru typically marks pros with headers/labels like
        # "Достоинства" followed by text content.

        # Strategy 1: Look for elements by known class patterns
        for selector in [
            '[class*="plus"]',
            '[class*="pros"]',
            '[class*="advantage"]',
            '[class*="Plus"]',
            '[class*="Pros"]',
        ]:
            el = soup.select_one(selector)
            if el:
                text = self._clean_text(el.get_text())
                if len(text) > 5:
                    return text

        # Strategy 2: Find by header text "Достоинства"
        text = self._find_section_by_header(
            soup, ["Достоинства", "Плюсы", "достоинства", "плюсы"]
        )
        if text:
            return text

        # Strategy 3: Find by data-* attributes
        for el in soup.find_all(attrs={"data-type": re.compile(r"plus|pro|adv", re.I)}):
            text = self._clean_text(el.get_text())
            if len(text) > 5:
                return text

        return ""

    def _extract_cons(self, soup: BeautifulSoup) -> str:
        """Extract the 'Недостатки' (cons/disadvantages) section."""

        # Strategy 1: Look for elements by known class patterns
        for selector in [
            '[class*="minus"]',
            '[class*="cons"]',
            '[class*="disadvantage"]',
            '[class*="Minus"]',
            '[class*="Cons"]',
        ]:
            el = soup.select_one(selector)
            if el:
                text = self._clean_text(el.get_text())
                if len(text) > 5:
                    return text

        # Strategy 2: Find by header text "Недостатки"
        text = self._find_section_by_header(
            soup, ["Недостатки", "Минусы", "недостатки", "минусы"]
        )
        if text:
            return text

        # Strategy 3: Find by data-* attributes
        for el in soup.find_all(
            attrs={"data-type": re.compile(r"minus|con|disadv", re.I)}
        ):
            text = self._clean_text(el.get_text())
            if len(text) > 5:
                return text

        return ""

    def _extract_body(self, soup: BeautifulSoup) -> str:
        """Extract the main review body text."""

        # Strategy 1: Look for the main review content container
        for selector in [
            '[class*="reviewContent"]',
            '[class*="review-text"]',
            '[class*="reviewText"]',
            '[class*="review_text"]',
            '[class*="content"]',
            "article",
        ]:
            el = soup.select_one(selector)
            if el:
                text = self._clean_text(el.get_text())
                if len(text) > 30:
                    return text

        # Strategy 2: Find the longest text block on the page
        # (review body is typically the longest paragraph)
        paragraphs = soup.find_all("p")
        longest = ""
        for p in paragraphs:
            text = self._clean_text(p.get_text())
            if len(text) > len(longest):
                longest = text
        if len(longest) > 30:
            return longest

        return ""

    def _extract_experience(self, soup: BeautifulSoup) -> str:
        """Extract owner experience info (e.g. 'Стаж 5 лет')."""

        # Look for experience-related text
        for selector in [
            '[class*="experience"]',
            '[class*="owner"]',
            '[class*="stazh"]',
        ]:
            el = soup.select_one(selector)
            if el:
                text = self._clean_text(el.get_text())
                if text:
                    return text

        # Search for text patterns like "Стаж N лет" or "Опыт вождения N лет"
        text = soup.get_text()
        match = re.search(
            r"(?:[Сс]таж|[Оо]пыт вождения)[:\s]*(\d+\s*(?:лет|год|года))", text
        )
        if match:
            return match.group(0).strip()

        return ""

    def _extract_car_year(self, soup: BeautifulSoup, url: str) -> Optional[int]:
        """Extract the car model year from the review."""

        # Strategy 1: From meta/structured data
        for el in soup.find_all(attrs={"itemprop": "dateVehicleFirstRegistered"}):
            if el.get("content"):
                year = self._parse_year(el["content"])
                if year:
                    return year

        # Strategy 2: From the page title / heading
        title_el = soup.find("h1") or soup.find("title")
        if title_el:
            year = self._parse_year(title_el.get_text())
            if year:
                return year

        # Strategy 3: From text patterns like "2020 года" or "год выпуска 2020"
        text = soup.get_text()
        match = re.search(r"(\d{4})\s*(?:года|г\.)", text)
        if match:
            year = int(match.group(1))
            if 1990 <= year <= 2030:
                return year

        match = re.search(r"год выпуска[:\s]*(\d{4})", text, re.I)
        if match:
            year = int(match.group(1))
            if 1990 <= year <= 2030:
                return year

        return None

    def _extract_review_date(self, soup: BeautifulSoup) -> str:
        """Extract when the review was published."""

        # Strategy 1: Structured data
        for el in soup.find_all(attrs={"itemprop": "datePublished"}):
            content = el.get("content") or el.get("datetime")
            if content:
                return content.strip()

        # Strategy 2: Time/date elements
        time_el = soup.find("time")
        if time_el:
            dt = time_el.get("datetime") or time_el.get_text(strip=True)
            if dt:
                return dt

        # Strategy 3: Text with date patterns
        for selector in ['[class*="date"]', '[class*="Date"]', '[class*="time"]']:
            el = soup.select_one(selector)
            if el:
                return self._clean_text(el.get_text())

        return ""

    def _extract_category_ratings(self, soup: BeautifulSoup) -> dict:
        """
        Extract per-category ratings (e.g. comfort, reliability, handling).

        Drom.ru often shows category breakdowns like:
          Комфорт: 4, Надёжность: 3, Управляемость: 5, etc.
        """
        categories = {}

        # Drom.ru category names in Russian
        category_names = {
            "комфорт": "comfort",
            "надёжность": "reliability",
            "надежность": "reliability",
            "управляемость": "handling",
            "ходовые качества": "handling",
            "внешний вид": "appearance",
            "салон": "interior",
            "интерьер": "interior",
            "безопасность": "safety",
            "динамика": "dynamics",
            "расход": "fuel_economy",
            "расход топлива": "fuel_economy",
            "проходимость": "offroad",
        }

        # Strategy 1: Look for rating bars / category rating elements
        for selector in [
            '[class*="criteria"]',
            '[class*="category"]',
            '[class*="param"]',
        ]:
            for el in soup.select(selector):
                text = el.get_text().lower().strip()
                for ru_name, en_name in category_names.items():
                    if ru_name in text:
                        # Try to extract the numeric rating
                        rating = self._parse_float(
                            re.sub(r"[^\d.,]", " ", text).strip()
                        )
                        if rating and 0 < rating <= 5:
                            categories[en_name] = rating
                            break

        # Strategy 2: Look for structured rating data in the page text
        page_text = soup.get_text()
        for ru_name, en_name in category_names.items():
            if en_name not in categories:
                pattern = rf"{ru_name}\s*[:\-—]\s*(\d[.,]?\d?)"
                match = re.search(pattern, page_text, re.I)
                if match:
                    rating = self._parse_float(match.group(1))
                    if rating and 0 < rating <= 5:
                        categories[en_name] = rating

        return categories

    # ── Utility helpers ────────────────────────────────────────────────────

    def _find_section_by_header(
        self, soup: BeautifulSoup, headers: List[str]
    ) -> str:
        """
        Find a section by its header text and return the content that follows.
        Works for patterns like:
            <b>Достоинства:</b> text text text
            <div class="...">Достоинства</div><div>text</div>
        """
        for header_text in headers:
            # Find elements whose text matches the header
            for tag_name in ["b", "strong", "span", "div", "h3", "h4", "dt", "p"]:
                for el in soup.find_all(tag_name):
                    if el.string and header_text in el.string:
                        # Get the next sibling or parent's next content
                        content = self._get_following_text(el)
                        if content and len(content) > 5:
                            return content

            # Also try text-contains search
            for el in soup.find_all(
                string=re.compile(re.escape(header_text), re.I)
            ):
                parent = el.parent if el.parent else None
                if parent:
                    content = self._get_following_text(parent)
                    if content and len(content) > 5:
                        return content

        return ""

    def _get_following_text(self, element: Tag) -> str:
        """Get text content after a header element."""
        # Try the next sibling
        sibling = element.find_next_sibling()
        if sibling:
            text = self._clean_text(sibling.get_text())
            if text:
                return text

        # Try the parent's text minus the header
        parent = element.parent
        if parent:
            full = self._clean_text(parent.get_text())
            header = self._clean_text(element.get_text())
            remaining = full.replace(header, "", 1).strip()
            if remaining:
                return remaining

        return ""

    @staticmethod
    def _clean_text(text: str) -> str:
        """Clean extracted text: collapse whitespace, strip."""
        if not text:
            return ""
        text = re.sub(r"\s+", " ", text).strip()
        # Remove common noise
        text = re.sub(r"^[:\-—\s]+", "", text)
        return text

    @staticmethod
    def _parse_float(text: str) -> Optional[float]:
        """Safely parse a float from text."""
        if not text:
            return None
        text = text.replace(",", ".").strip()
        match = re.search(r"(\d+\.?\d*)", text)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None
        return None

    @staticmethod
    def _parse_year(text: str) -> Optional[int]:
        """Extract a 4-digit year from text."""
        if not text:
            return None
        match = re.search(r"(19\d{2}|20[0-3]\d)", text)
        if match:
            return int(match.group(1))
        return None
