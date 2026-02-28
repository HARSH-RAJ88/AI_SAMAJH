"""
AI Samajh Context Generator Module
===================================
Generates ELI5 explanations, category classifications, and relevance scores
using Google Gemini API with Indian context and analogies.

This is the MOST IMPORTANT agent - it transforms raw news into accessible content.
"""

from google import genai
import os
import json
import time
from typing import Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini client at module level
client = genai.Client(api_key=os.getenv("GOOGLE_AI_API_KEY"))

# System instructions for Gemini (CRITICAL - follow exactly)
SYSTEM_INSTRUCTIONS = """You are an AI journalism assistant for AI Samajh — making AI news accessible to every Indian, from a college student in Pune to a kirana shop owner in Lucknow.

Your task: Take a raw AI news article and generate:
1. An ELI5 (Explain Like I'm 5) explanation using INDIAN context and analogies
2. Category classification
3. Relevance scores for different user types

═══════════════════════════════════════════
ELI5 RULES (MOST IMPORTANT — follow strictly)
═══════════════════════════════════════════

TONE & STYLE:
- Write like you're explaining to a smart friend over chai, not writing an essay
- Start with a hook: "Arre bhai, socho...", "Yaad hai jab...", "Simple hai —"
- Keep it UNDER 200 words, conversational Hindi-English mix is fine
- End with a one-line "Toh iska matlab?" takeaway

INDIAN ANALOGIES (use these, NOT Western ones):
- Payments/Fintech → UPI, PhonePe, GPay, Paytm (not Venmo/PayPal)
- Shopping/E-commerce → Flipkart, Meesho, Zepto, Blinkit (not Amazon US)
- Big Tech → Jio, Reliance, Tata, Infosys, Wipro (not just FAANG)
- Government/ID → Aadhaar, DigiLocker, IRCTC, CoWIN, IndiaAI
- Food/Daily life → chai tapri, dabba delivery, sabzi mandi, auto-rickshaw
- Entertainment → IPL, Bigg Boss, KBC, Bollywood, Hotstar
- Education → JEE/NEET prep, BYJU'S, Unacademy, IIT/IIM
- Sports → cricket pitch, Dhoni's helicopter shot, IPL auctions
- Scale → "130 crore Indians", "har gali mein", "Tier-2/3 cities"

REGIONAL DIVERSITY (don't be only Hindi-belt):
- South India: Chennai's IT corridor, Bengaluru startups, Kerala's literacy
- West India: Mumbai's dabbawalas, Pune's IT parks, Ahmedabad's businesses
- East India: Kolkata's heritage, Bhubaneswar's Smart City
- Northeast: Digital connectivity, mobile-first users

FORBIDDEN:
- No baseball, NFL, Thanksgiving, Walmart, or US-centric references
- No dry academic tone — this is NOT a research abstract
- No "In conclusion" or "Furthermore" — keep it natural

═══════════════════════════════════════════
CATEGORY OPTIONS
═══════════════════════════════════════════
- research: Academic papers, new techniques, benchmarks
- product: New tools, model releases, features, launches
- funding: Startup raises, acquisitions, investments, valuations
- regulation: Government policy, AI ethics, safety, compliance
- opinion: Editorials, predictions, analysis, industry trends

═══════════════════════════════════════════
RELEVANCE SCORING (0-100)
═══════════════════════════════════════════
Score how relevant this article is to each Indian user type:
- student: Career impact, placement prep, learning, skill-building
- professional: Productivity tools, workflow, job market shifts
- business: Revenue, competitive edge, Indian market opportunity
- investor: Market size, ROI, funding trends, exit potential
- citizen: Daily-life impact, privacy, accessibility, Digital India

═══════════════════════════════════════════
RESPONSE FORMAT (strict JSON, no markdown, no code blocks)
═══════════════════════════════════════════
{"eli5": "Your Indian-context explanation here", "category": "product", "relevance_scores": {"student": 85, "professional": 70, "business": 60, "investor": 50, "citizen": 40}, "key_concepts": ["concept1", "concept2", "concept3"]}"""


def generate_context(article: Dict) -> Dict:
    """
    Generate ELI5 explanation, category, and relevance scores for an article.
    
    Args:
        article: Dictionary containing article data with keys:
            - title: Article title
            - source: Source name
            - published: Publication date
            - excerpt/content: Article content
    
    Returns:
        Dictionary with:
            - eli5: Indian-context explanation (under 200 words)
            - category: One of research/product/funding/regulation/opinion
            - relevance_scores: Dict with scores for each user type
            - key_concepts: List of key concepts from the article
    """
    try:
        # Extract article data
        title = article.get("title", "")
        source = article.get("source", "")
        published = article.get("published", "")
        content = article.get("excerpt", "") or article.get("content", "") or article.get("original_text", "")
        
        # Limit content to first 2000 characters
        content_truncated = content[:2000] if content else ""
        
        # Build the prompt
        prompt = f"""{SYSTEM_INSTRUCTIONS}

---
ARTICLE TO ANALYZE:

Title: {title}
Source: {source}
Published: {published}
Content: {content_truncated}
---

Generate the JSON response now:"""

        # Call Gemini API with retry on rate limits
        response_text = _call_gemini_with_retry(prompt)
        if response_text is None:
            return _get_default_response(article)
        
        # Strip markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON response
        result = json.loads(response_text)
        
        # Validate and ensure all required fields exist
        validated_result = {
            "eli5": result.get("eli5", content_truncated[:200] if content_truncated else "No explanation available."),
            "category": result.get("category", "opinion"),
            "relevance_scores": result.get("relevance_scores", {
                "student": 50,
                "professional": 50,
                "business": 50,
                "investor": 50,
                "citizen": 50
            }),
            "key_concepts": result.get("key_concepts", [])
        }
        
        # Validate category
        valid_categories = ["research", "product", "funding", "regulation", "opinion"]
        if validated_result["category"] not in valid_categories:
            validated_result["category"] = "opinion"
        
        # Validate relevance scores
        for role in ["student", "professional", "business", "investor", "citizen"]:
            if role not in validated_result["relevance_scores"]:
                validated_result["relevance_scores"][role] = 50
            else:
                # Ensure score is within 0-100
                score = validated_result["relevance_scores"][role]
                validated_result["relevance_scores"][role] = max(0, min(100, int(score)))
        
        return validated_result
        
    except json.JSONDecodeError as e:
        print(f"  ⚠ JSON parsing error: {e}")
        return _get_default_response(article)
        
    except Exception as e:
        print(f"  ⚠ Context generation error: {e}")
        return _get_default_response(article)


def _call_gemini_with_retry(prompt: str, max_retries: int = 5) -> str:
    """
    Call Gemini API with automatic retry + exponential backoff on 429 rate limits.
    
    Returns:
        Response text string, or None if all retries exhausted.
    """
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            err_str = str(e)
            if '429' in err_str or 'RESOURCE_EXHAUSTED' in err_str:
                wait = min(2 ** attempt * 10, 60)  # 10s, 20s, 40s, 60s, 60s
                print(f"  ⏳ Rate limited, retrying in {wait}s (attempt {attempt+1}/{max_retries})...")
                time.sleep(wait)
            else:
                raise
    print("  ❌ Max retries exceeded for Gemini API")
    return None


def _get_default_response(article: Dict) -> Dict:
    """
    Return default values when context generation fails.
    
    Args:
        article: The original article dictionary
    
    Returns:
        Dictionary with default/fallback values
    """
    content = article.get("excerpt", "") or article.get("content", "") or article.get("original_text", "")
    
    return {
        "eli5": content[:200] if content else "Unable to generate explanation.",
        "category": "opinion",
        "relevance_scores": {
            "student": 50,
            "professional": 50,
            "business": 50,
            "investor": 50,
            "citizen": 50
        },
        "key_concepts": []
    }


# ============================================================================
# DISPLAY HELPERS
# ============================================================================

def _print_result(article: Dict, result: Dict, index: int = 0) -> None:
    """Pretty-print a single context generation result."""
    print(f"\n{'─' * 60}")
    print(f"📰 [{index}] {article.get('title', 'Untitled')[:75]}")
    print(f"   Source: {article.get('source', '?')}")
    print(f"\n📖 ELI5 (Indian Context):")
    print(f"   {result['eli5']}")
    print(f"\n📁 Category: {result['category']}")
    print(f"📊 Relevance:")
    for role, score in result['relevance_scores'].items():
        bar = "█" * (score // 10) + "░" * (10 - score // 10)
        print(f"   {role.capitalize():15} [{bar}] {score}")
    print(f"🔑 Concepts: {', '.join(result['key_concepts']) if result['key_concepts'] else 'None'}")


# ============================================================================
# TEST BLOCK — uses REAL scraped articles, not sample data
# ============================================================================

if __name__ == "__main__":
    import sys, argparse
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

    parser = argparse.ArgumentParser(description="Test ELI5 context generation")
    parser.add_argument("-n", "--count", type=int, default=3, help="Number of articles to process (default: 3)")
    parser.add_argument("--sample", action="store_true", help="Use hardcoded sample instead of scraper")
    args = parser.parse_args()

    print("=" * 60)
    print("🧠 AI SAMAJH CONTEXT GENERATOR TEST")
    print("=" * 60)

    articles = []

    if args.sample:
        articles = [{
            "title": "Google Launches Gemini 2.0 with Enhanced Multimodal Capabilities",
            "source": "TechCrunch",
            "published": "2026-02-20",
            "excerpt": (
                "Google has unveiled Gemini 2.0, its most advanced AI model yet, "
                "featuring significant improvements in multimodal understanding and reasoning. "
                "The new model can process text, images, audio, and video simultaneously. "
                "Key features include native tool use, improved coding abilities, and a "
                "2 million token context window. Available through Google AI Studio and Vertex AI."
            ),
        }]
    else:
        # Pull REAL articles from the scraper
        try:
            from agents.scraper import scrape_indian_stack, scrape_rss_feed, MVP_RSS_FEEDS
            print("\n⏳ Fetching real articles from Indian Stack...")
            articles = scrape_indian_stack()
            if len(articles) < args.count:
                print("⏳ Adding global RSS articles...")
                for feed_url in MVP_RSS_FEEDS:
                    articles.extend(scrape_rss_feed(feed_url))
        except Exception as e:
            print(f"⚠ Scraper import failed ({e}), falling back to sample data")
            args.sample = True
            articles = [{
                "title": "India's AI Mission Gets ₹10,000 Crore Budget Boost",
                "source": "Inc42",
                "published": "2026-02-28",
                "excerpt": (
                    "The Indian government has allocated ₹10,000 crore for the IndiaAI Mission "
                    "in the 2026-27 budget, focusing on building sovereign AI compute capacity, "
                    "skilling 1 lakh AI professionals, and deploying AI in agriculture and healthcare."
                ),
            }]

    # Process articles
    test_articles = articles[:args.count]
    print(f"\n🔬 Processing {len(test_articles)} articles through context generator...")

    results = []
    for i, article in enumerate(test_articles, 1):
        print(f"\n⏳ [{i}/{len(test_articles)}] Generating context...")
        result = generate_context(article)
        results.append((article, result))
        _print_result(article, result, i)

    # Summary
    print("\n" + "=" * 60)
    print(f"✅ Processed {len(results)} articles")
    categories = {}
    for _, r in results:
        cat = r["category"]
        categories[cat] = categories.get(cat, 0) + 1
    print(f"📁 Categories: {categories}")
    print("=" * 60)
