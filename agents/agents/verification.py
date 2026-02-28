"""
AI Samajh Verification Module
==============================
Scores article credibility using rule-based logic.

This agent evaluates articles based on:
1. Source trustworthiness (domain reputation)
2. Citation presence (research backing)
3. Title quality (absence of sensationalism)

No AI/ML required - pure rule-based scoring for fast, consistent results.
"""

from typing import Dict
from urllib.parse import urlparse


# ============================================================================
# CONSTANTS
# ============================================================================

# Trusted academic and industry sources (+40 points if matched)
TRUSTED_DOMAINS: list[str] = [
    'arxiv.org',
    'openai.com',
    'anthropic.com',
    'deepmind.google',
    'google.com',
    'microsoft.com',
    'nature.com',
    'science.org',
    'mit.edu',
    'stanford.edu',
    'berkeley.edu',
    'ieee.org',
    # Additional trusted Indian sources
    'meity.gov.in',
    'nasscom.in',
    'iisc.ac.in',
    'iitb.ac.in',
    'iitd.ac.in',
]

# Red flag keywords that indicate clickbait/sensationalism (0 points if found)
SENSATIONAL_KEYWORDS: list[str] = [
    'shocking',
    'unbelievable',
    'will destroy',
    'exposed',
    "you won't believe",
    'doctors hate',
    'one weird trick',
    'scientists baffled',
    'mind-blowing',
    'secret revealed',
    'they don\'t want you to know',
]

# Citation indicators (+30 points if any found)
CITATION_PHRASES: list[str] = [
    'according to',
    'study shows',
    'research',
    'paper',
    'http://',
    'https://',
    'published in',
    'peer-reviewed',
    'journal',
    'findings suggest',
]


# ============================================================================
# MAIN FUNCTION
# ============================================================================

def verify_article(article: Dict) -> Dict:
    """
    Score article credibility using rule-based logic.
    
    Scoring breakdown (max 100 points):
    - Source Check: +40 points if from trusted domain
    - Citation Check: +30 points if contains citation indicators
    - Title Check: +30 points if no sensational keywords
    
    Args:
        article: Dictionary containing:
            - url: Article URL
            - title: Article title
            - content/excerpt: Article content
    
    Returns:
        Dictionary with:
            - credibility_score: int (0-100)
            - badge: string emoji badge based on score
            - breakdown: dict with individual scores
    """
    score = 0
    breakdown = {
        'source_score': 0,
        'citation_score': 0,
        'title_score': 0,
    }
    
    # ─────────────────────────────────────────────────────────────────────────
    # a) Source Check (+40 points)
    # ─────────────────────────────────────────────────────────────────────────
    url = article.get('url', '')
    if url:
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            
            # Remove 'www.' prefix if present
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # Check if domain matches or is a subdomain of trusted domains
            for trusted in TRUSTED_DOMAINS:
                if domain == trusted or domain.endswith('.' + trusted):
                    breakdown['source_score'] = 40
                    score += 40
                    break
        except Exception:
            pass  # Invalid URL, no points
    
    # ─────────────────────────────────────────────────────────────────────────
    # b) Citation Check (+30 points)
    # ─────────────────────────────────────────────────────────────────────────
    content = article.get('content', '') or article.get('excerpt', '') or article.get('original_text', '')
    content_lower = content.lower()
    
    # Check for any citation indicators
    for phrase in CITATION_PHRASES:
        if phrase in content_lower:
            breakdown['citation_score'] = 30
            score += 30
            break
    
    # ─────────────────────────────────────────────────────────────────────────
    # c) Title Check (+30 points)
    # ─────────────────────────────────────────────────────────────────────────
    title = article.get('title', '')
    title_lower = title.lower()
    
    # Check for sensational keywords
    is_sensational = False
    for keyword in SENSATIONAL_KEYWORDS:
        if keyword in title_lower:
            is_sensational = True
            break
    
    if not is_sensational:
        breakdown['title_score'] = 30
        score += 30
    
    # ─────────────────────────────────────────────────────────────────────────
    # Determine badge based on final score
    # ─────────────────────────────────────────────────────────────────────────
    if score >= 80:
        badge = "⭐⭐⭐⭐⭐"
    elif score >= 50:
        badge = "⭐⭐⭐"
    else:
        badge = "⚠️"
    
    return {
        'credibility_score': score,
        'badge': badge,
        'breakdown': breakdown,
    }


# ============================================================================
# TEST BLOCK
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🔍 AI SAMAJH VERIFICATION MODULE TEST")
    print("=" * 60)
    
    # Test 1: Trusted source (arxiv)
    test_article_1 = {
        'title': 'Attention Is All You Need: Transformer Architecture',
        'url': 'https://arxiv.org/abs/1706.03762',
        'content': 'This paper introduces the Transformer, a model architecture based entirely on attention mechanisms. According to our research, the model achieves state-of-the-art results on translation tasks.'
    }
    
    print("\n📄 Test 1: arXiv Paper (Trusted Source)")
    print(f"   Title: {test_article_1['title']}")
    print(f"   URL: {test_article_1['url']}")
    result_1 = verify_article(test_article_1)
    print(f"   ✅ Score: {result_1['credibility_score']}/100 {result_1['badge']}")
    print(f"   📊 Breakdown: {result_1['breakdown']}")
    
    # Test 2: Unknown blog with sensational title
    test_article_2 = {
        'title': 'SHOCKING: AI Will Destroy All Jobs by 2025!',
        'url': 'https://random-ai-blog.com/shocking-news',
        'content': 'Everyone is talking about AI taking over. This is going to change everything!'
    }
    
    print("\n📄 Test 2: Random Blog (Sensational Title)")
    print(f"   Title: {test_article_2['title']}")
    print(f"   URL: {test_article_2['url']}")
    result_2 = verify_article(test_article_2)
    print(f"   ⚠️ Score: {result_2['credibility_score']}/100 {result_2['badge']}")
    print(f"   📊 Breakdown: {result_2['breakdown']}")
    
    # Test 3: Medium quality article
    test_article_3 = {
        'title': 'Google Announces New AI Features for Search',
        'url': 'https://techcrunch.com/2026/02/20/google-ai-search',
        'content': 'According to Google\'s announcement, the new AI features will improve search results. Research shows that AI-powered search can be 30% more accurate.'
    }
    
    print("\n📄 Test 3: Tech News (Medium Quality)")
    print(f"   Title: {test_article_3['title']}")
    print(f"   URL: {test_article_3['url']}")
    result_3 = verify_article(test_article_3)
    print(f"   📊 Score: {result_3['credibility_score']}/100 {result_3['badge']}")
    print(f"   📊 Breakdown: {result_3['breakdown']}")
    
    # Test 4: Indian government source
    test_article_4 = {
        'title': 'MeitY Releases National AI Strategy 2026',
        'url': 'https://www.meity.gov.in/ai-strategy-2026',
        'content': 'The Ministry of Electronics and IT has published the national AI strategy document.'
    }
    
    print("\n📄 Test 4: Indian Government (MeitY)")
    print(f"   Title: {test_article_4['title']}")
    print(f"   URL: {test_article_4['url']}")
    result_4 = verify_article(test_article_4)
    print(f"   ✅ Score: {result_4['credibility_score']}/100 {result_4['badge']}")
    print(f"   📊 Breakdown: {result_4['breakdown']}")
    
    print("\n" + "=" * 60)
    print("✅ Verification Module test completed!")
    print("=" * 60)
