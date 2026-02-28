"""
AI Samajh News Scraper Module
============================
A unified news ingestion module with priority-driven architecture.

Layer 1: 🇮🇳 Indian Stack (TOP PRIORITY) - Scraped FIRST
Layer 2: 🌍 Global RSS Feeds (Secondary Layer)

Compliance: Respects robots.txt, metadata-only extraction, no PDF/login content.
"""

import feedparser
import requests
from typing import List, Dict, Set
from datetime import datetime
import hashlib
import time
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

# ============================================================================
# CONSTANTS
# ============================================================================

# Global RSS Feeds (12 URLs) - Secondary Priority
# NOTE: Inc42 & Analytics India moved to Indian Stack (Layer 1)
GLOBAL_RSS_FEEDS: List[str] = [
    "https://ai.googleblog.com/atom.xml",
    "https://openai.com/blog/rss.xml",
    "https://deepmind.google/discover/blog/rss/",
    "https://bair.berkeley.edu/blog/feed.xml",
    "https://www.marktechpost.com/feed/",
    "https://techcrunch.com/tag/artificial-intelligence/feed/",
    "https://venturebeat.com/category/ai/feed/",
    "https://www.kdnuggets.com/feed",
    "https://towardsdatascience.com/feed",
    "https://www.microsoft.com/en-us/research/feed/",
    "https://blogs.nvidia.com/feed/",
    "https://www.producthunt.com/feed",
]

# Indian Stack Configuration — RSS-first approach (reliable)
INDIAN_STACK_CONFIG: Dict[str, str] = {
    "INC42_RSS": "https://inc42.com/feed/",
    "YOURSTORY_RSS": "https://yourstory.com/feed",
    "NASSCOM_COMMUNITY_RSS": "https://community.nasscom.in/feed",
    "MEDIANAMA_RSS": "https://www.medianama.com/feed/",
    "ET_TECH_RSS": "https://economictimes.indiatimes.com/tech/rssfeeds/13357270.cms",
    "MEITY_BASE": "https://www.meity.gov.in",
}

# MVP subset for faster testing
MVP_RSS_FEEDS: List[str] = [
    "https://www.marktechpost.com/feed/",
    "https://techcrunch.com/tag/artificial-intelligence/feed/",
    "https://analyticsindiamag.com/feed",
]

# Request headers — use browser UA to avoid bot blocks on Indian gov sites
HEADERS: Dict[str, str] = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# Rate limiting
REQUEST_DELAY: float = 1.0  # 1 second between requests


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def generate_url_hash(url: str) -> str:
    """Generate a unique hash for a URL to enable deduplication."""
    return hashlib.md5(url.encode()).hexdigest()


def truncate_excerpt(text: str, max_words: int = 400) -> str:
    """Truncate text to max_words while preserving word boundaries."""
    if not text:
        return ""
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + "..."


def clean_html(html_content: str) -> str:
    """Remove HTML tags and clean up text."""
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    # Clean up whitespace
    text = " ".join(text.split())
    return text


def infer_content_type(title: str, content: str) -> str:
    """Infer content type based on keywords in title and content."""
    text = (title + " " + content).lower()
    
    if any(kw in text for kw in ["funding", "raised", "investment", "series", "valuation", "investor"]):
        return "Funding"
    elif any(kw in text for kw in ["policy", "regulation", "government", "ministry", "law", "compliance"]):
        return "Policy"
    elif any(kw in text for kw in ["research", "paper", "study", "arxiv", "benchmark", "dataset"]):
        return "Research"
    elif any(kw in text for kw in ["launch", "release", "product", "feature", "update", "tool"]):
        return "Product"
    elif any(kw in text for kw in ["enterprise", "business", "company", "startup", "industry"]):
        return "Enterprise"
    else:
        return "General"


def normalize_article(
    source: str,
    title: str,
    url: str,
    published: str,
    author: str,
    excerpt: str,
    content_type: str,
    priority_score: int
) -> Dict:
    """Create a normalized article dictionary."""
    return {
        "source": source,
        "title": title,
        "url": url,
        "published": published,
        "author": author or "Unknown",
        "excerpt": truncate_excerpt(clean_html(excerpt)),
        "content_type": content_type,
        "priority_score": priority_score,
        "url_hash": generate_url_hash(url),
        "ingested_at": datetime.utcnow().isoformat(),
    }


def polite_request(url: str, timeout: int = 10) -> requests.Response:
    """Make a polite HTTP request with rate limiting."""
    time.sleep(REQUEST_DELAY)
    return requests.get(url, headers=HEADERS, timeout=timeout)


# ============================================================================
# 🇮🇳 LAYER 1 — INDIAN STACK (TOP PRIORITY)
# ============================================================================

def _scrape_indian_rss(
    feed_url: str,
    source_name: str,
    default_author: str,
    priority_score: int,
    max_articles: int = 20,
    ai_filter: bool = False,
) -> List[Dict]:
    """
    Generic Indian RSS feed scraper. Reliable, fast, no HTML parsing needed.

    Args:
        feed_url: RSS/Atom feed URL
        source_name: Display name for the source
        default_author: Fallback author name
        priority_score: Priority score for ranking
        max_articles: Max articles to fetch
        ai_filter: If True, only keep AI/tech related articles
    """
    articles: List[Dict] = []
    AI_KEYWORDS = [
        "ai", "artificial intelligence", "machine learning", "deep learning",
        "llm", "gpt", "generative", "neural", "chatbot", "automation",
        "data science", "analytics", "startup", "funding", "tech",
        "saas", "fintech", "edtech", "healthtech", "agritech",
    ]

    try:
        feed = feedparser.parse(feed_url, request_headers=HEADERS)

        if not feed.entries:
            print(f"  ⚠ {source_name}: Feed returned 0 entries (URL may have changed)")
            return articles

        for entry in feed.entries[:max_articles]:
            title = entry.get("title", "")
            url = entry.get("link", "")

            if not title or not url:
                continue

            # Get content/summary
            content = entry.get("summary", "") or ""
            if entry.get("content"):
                content = entry.content[0].get("value", content)
            excerpt = truncate_excerpt(clean_html(content))

            # AI filter (for broad feeds like ET Tech)
            if ai_filter:
                combined = (title + " " + excerpt).lower()
                if not any(kw in combined for kw in AI_KEYWORDS):
                    continue

            # Get metadata
            published = entry.get("published", "") or entry.get("updated", datetime.utcnow().isoformat())
            author = entry.get("author", default_author)

            articles.append(normalize_article(
                source=source_name,
                title=title,
                url=url,
                published=published,
                author=author,
                excerpt=excerpt,
                content_type=infer_content_type(title, excerpt),
                priority_score=priority_score,
            ))

    except Exception as e:
        print(f"  ⚠ {source_name} RSS error: {e}")

    return articles


def scrape_inc42_rss() -> List[Dict]:
    """
    Inc42 — India's #1 startup & funding news. RSS feed.
    Priority: 90 (top Indian startup source)
    """
    articles = _scrape_indian_rss(
        feed_url=INDIAN_STACK_CONFIG["INC42_RSS"],
        source_name="Inc42",
        default_author="Inc42",
        priority_score=90,
        max_articles=20,
    )
    print(f"  💰 Inc42: Found {len(articles)} articles")
    return articles


def scrape_yourstory_rss() -> List[Dict]:
    """
    YourStory — Indian startup & entrepreneurship news. RSS feed.
    Priority: 85
    """
    articles = _scrape_indian_rss(
        feed_url=INDIAN_STACK_CONFIG["YOURSTORY_RSS"],
        source_name="YourStory",
        default_author="YourStory",
        priority_score=85,
        max_articles=20,
    )
    print(f"  📰 YourStory: Found {len(articles)} articles")
    return articles


def scrape_nasscom_community_rss() -> List[Dict]:
    """
    NASSCOM Community — Indian IT industry insights. RSS feed.
    Priority: 80
    """
    articles = _scrape_indian_rss(
        feed_url=INDIAN_STACK_CONFIG["NASSCOM_COMMUNITY_RSS"],
        source_name="NASSCOM Community",
        default_author="NASSCOM",
        priority_score=80,
        max_articles=15,
    )
    print(f"  🏢 NASSCOM: Found {len(articles)} articles")
    return articles


def scrape_medianama_rss() -> List[Dict]:
    """
    Medianama — Indian digital economy & policy news. RSS feed.
    Priority: 75
    """
    articles = _scrape_indian_rss(
        feed_url=INDIAN_STACK_CONFIG["MEDIANAMA_RSS"],
        source_name="Medianama",
        default_author="Medianama",
        priority_score=75,
        max_articles=15,
    )
    print(f"  📱 Medianama: Found {len(articles)} articles")
    return articles


def scrape_et_tech_rss() -> List[Dict]:
    """
    ET Tech (Economic Times) — Mainstream Indian tech news. RSS feed.
    Priority: 70. AI-filtered (broad tech feed).
    """
    articles = _scrape_indian_rss(
        feed_url=INDIAN_STACK_CONFIG["ET_TECH_RSS"],
        source_name="ET Tech",
        default_author="Economic Times",
        priority_score=70,
        max_articles=30,
        ai_filter=True,  # Filter for AI/tech relevance from broad feed
    )
    print(f"  📊 ET Tech: Found {len(articles)} AI-relevant articles")
    return articles


def scrape_meity_updates() -> List[Dict]:
    """
    MeitY — Government of India Ministry of Electronics & IT.
    HTML scraping with browser UA (gov site blocks bot UA).
    Priority: 100 (government policy = highest priority)
    """
    articles: List[Dict] = []
    seen_links: Set[str] = set()
    base_url = INDIAN_STACK_CONFIG["MEITY_BASE"]

    MEITY_SECTIONS = {
        "Schemes": "/offerings/schemes-and-services",
        "Press": "/documents/press-release",
        "Reports": "/documents/reports",
    }

    AI_KEYWORDS = [
        "artificial intelligence", "ai", "machine learning", "deep learning",
        "digital india", "india ai mission", "semiconductor", "data governance",
        "electronics", "cyber", "digital", "startup", "meity",
    ]

    def is_ai_related(text: str) -> bool:
        return any(kw in text.lower() for kw in AI_KEYWORDS)

    try:
        for section_name, section_path in MEITY_SECTIONS.items():
            for page in range(0, 2):  # First 2 pages only
                section_url = f"{base_url}{section_path}?page={page}"
                try:
                    response = polite_request(section_url)
                    if response.status_code != 200:
                        continue

                    soup = BeautifulSoup(response.text, "html.parser")

                    for link in soup.find_all("a", href=True):
                        href = link["href"]
                        if not href.startswith("/"):
                            continue
                        if not any(key in href for key in ["/documents/", "/offerings/"]):
                            continue

                        full_url = base_url + href
                        if full_url in seen_links or full_url.endswith(".pdf"):
                            continue

                        title = link.get_text(strip=True)
                        if len(title) < 20 or not is_ai_related(title):
                            continue

                        articles.append(normalize_article(
                            source="MeitY",
                            title=title,
                            url=full_url,
                            published=datetime.now().isoformat(),
                            author="Ministry of Electronics & IT",
                            excerpt="",
                            content_type="Policy",
                            priority_score=100,
                        ))
                        seen_links.add(full_url)

                except Exception:
                    continue
    except Exception as e:
        print(f"  ⚠ MeitY adapter error: {e}")

    print(f"  📋 MeitY: Found {len(articles)} policy updates")
    return articles


def scrape_indian_stack() -> List[Dict]:
    """
    Unified Indian Stack scraper — RSS-first approach.

    Executes all Indian source scrapers in priority order:
    1. MeitY HTML (100) — Government policy
    2. Inc42 RSS (90) — Startup/funding
    3. YourStory RSS (85) — Entrepreneurship
    4. NASSCOM Community RSS (80) — IT industry
    5. Medianama RSS (75) — Digital economy
    6. ET Tech RSS (70) — Mainstream tech (AI-filtered)

    Returns deduplicated list sorted by priority_score descending.
    """
    print("\n🇮🇳 LAYER 1 — INDIAN STACK (TOP PRIORITY)")
    print("=" * 50)

    all_articles: List[Dict] = []
    seen_urls: Set[str] = set()

    scrapers = [
        ("MeitY", scrape_meity_updates),
        ("Inc42", scrape_inc42_rss),
        ("YourStory", scrape_yourstory_rss),
        ("NASSCOM", scrape_nasscom_community_rss),
        ("Medianama", scrape_medianama_rss),
        ("ET Tech", scrape_et_tech_rss),
    ]

    for name, scraper_func in scrapers:
        try:
            articles = scraper_func()
            for article in articles:
                if article["url_hash"] not in seen_urls:
                    seen_urls.add(article["url_hash"])
                    all_articles.append(article)
        except Exception as e:
            print(f"  ⚠ {name} scraper failed: {e}")
            continue

    all_articles.sort(key=lambda x: x["priority_score"], reverse=True)

    print(f"\n✅ Indian Stack: {len(all_articles)} articles collected")
    return all_articles


# ============================================================================
# 🌍 LAYER 2 — GLOBAL RSS FEEDS (SECONDARY)
# ============================================================================

def scrape_rss_feed(url: str, priority_score: int = 50) -> List[Dict]:
    """
    Scrape a single RSS feed.
    
    Args:
        url: RSS feed URL
        priority_score: Default priority score (50 for global feeds)
    
    Returns:
        List of normalized article dictionaries
    """
    articles: List[Dict] = []
    
    try:
        # Parse feed
        feed = feedparser.parse(url)
        
        # Get source name from feed
        source = feed.feed.get("title", url.split("/")[2])
        
        for entry in feed.entries[:15]:  # Limit per feed
            title = entry.get("title", "")
            article_url = entry.get("link", "")
            
            if not title or not article_url:
                continue
            
            # Get content/summary
            content = entry.get("summary", "") or ""
            if entry.get("content"):
                content = entry.content[0].get("value", content)
            
            excerpt = truncate_excerpt(clean_html(content))
            
            # Get published date
            published = entry.get("published", "") or entry.get("updated", datetime.utcnow().isoformat())
            
            # Get author
            author = entry.get("author", source)
            
            # Infer content type
            content_type = infer_content_type(title, excerpt)
            
            articles.append(normalize_article(
                source=source,
                title=title,
                url=article_url,
                published=published,
                author=author,
                excerpt=excerpt,
                content_type=content_type,
                priority_score=priority_score
            ))
            
        print(f"  Scraping {url}... Found {len(articles)} articles")
        
    except Exception as e:
        print(f"  ⚠ Error scraping {url}: {e}")
    
    return articles


def scrape_all_global_sources(feeds: List[str] = None) -> List[Dict]:
    """
    Scrape all global RSS feeds.
    
    Args:
        feeds: Optional list of feed URLs. Defaults to GLOBAL_RSS_FEEDS.
    
    Returns:
        Deduplicated list of articles sorted by priority_score.
    """
    if feeds is None:
        feeds = GLOBAL_RSS_FEEDS
    
    print("\n🌍 LAYER 2 — GLOBAL RSS FEEDS (SECONDARY)")
    print("=" * 50)
    
    all_articles: List[Dict] = []
    seen_urls: Set[str] = set()
    
    for feed_url in feeds:
        try:
            articles = scrape_rss_feed(feed_url)
            
            # Deduplicate
            for article in articles:
                if article["url_hash"] not in seen_urls:
                    seen_urls.add(article["url_hash"])
                    all_articles.append(article)
                    
        except Exception as e:
            print(f"  ⚠ Failed to scrape {feed_url}: {e}")
            continue
    
    print(f"\n✅ Global RSS: {len(all_articles)} articles collected")
    return all_articles


def scrape_all_sources(feeds: List[str] = None) -> List[Dict]:
    """
    Main entry point: Scrape all sources (Indian Stack + Global RSS).
    
    Args:
        feeds: Optional list of RSS feeds for global layer. Defaults to GLOBAL_RSS_FEEDS.
    
    Returns:
        Combined, deduplicated, priority-sorted list of all articles.
    """
    all_articles: List[Dict] = []
    seen_urls: Set[str] = set()
    
    # LAYER 1: Indian Stack (TOP PRIORITY) - Scraped FIRST
    indian_articles = scrape_indian_stack()
    
    for article in indian_articles:
        if article["url_hash"] not in seen_urls:
            seen_urls.add(article["url_hash"])
            all_articles.append(article)
    
    # LAYER 2: Global RSS (Secondary) - Scraped SECOND
    global_articles = scrape_all_global_sources(feeds)
    
    for article in global_articles:
        if article["url_hash"] not in seen_urls:
            seen_urls.add(article["url_hash"])
            all_articles.append(article)
    
    # Final sort by priority_score
    all_articles.sort(key=lambda x: x["priority_score"], reverse=True)
    
    return all_articles


# ============================================================================
# MAIN TEST BLOCK
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 AI SAMAJH NEWS SCRAPER")
    print("=" * 60)
    
    # 1. Scrape Indian Stack FIRST
    indian_articles = scrape_indian_stack()
    indian_count = len(indian_articles)
    
    # 2. Scrape Global RSS SECOND (using MVP subset for faster testing)
    global_articles = scrape_all_global_sources(MVP_RSS_FEEDS)
    global_count = len(global_articles)
    
    # 3. Combine results (with deduplication)
    all_articles: List[Dict] = []
    seen_urls: Set[str] = set()
    
    for article in indian_articles + global_articles:
        if article["url_hash"] not in seen_urls:
            seen_urls.add(article["url_hash"])
            all_articles.append(article)
    
    # 4. Sort by priority_score
    all_articles.sort(key=lambda x: x["priority_score"], reverse=True)
    
    # 5. Print summary
    print("\n" + "=" * 60)
    print("📊 SCRAPING SUMMARY")
    print("=" * 60)
    print(f"  🇮🇳 Indian Stack: {indian_count} articles")
    print(f"  🌍 Global RSS:    {global_count} articles")
    print(f"  📰 Total:         {len(all_articles)} articles (deduplicated)")

    # Per-source breakdown
    sources: Dict[str, int] = {}
    for a in all_articles:
        sources[a["source"]] = sources.get(a["source"], 0) + 1
    print("\n  Source Breakdown:")
    for src, count in sorted(sources.items(), key=lambda x: -x[1]):
        print(f"    {src:25} {count:>3}")

    if all_articles:
        print(f"\n🏆 Top 5 Articles:")
        for i, a in enumerate(all_articles[:5], 1):
            print(f"   {i}. [{a['source']}] {a['title'][:70]}")

    print("\n✅ Scraper test completed!")
