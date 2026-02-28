"""
Agent 3: Action Generator
Generates personalized "why it matters" content and action items using Google Gemini.
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

# System instructions for personalization
SYSTEM_INSTRUCTIONS = """You are an AI assistant personalizing AI news for Indian users.

Generate: 1) "Why this matters to YOU" (personalized), 2) 2-3 concrete action items the user can take RIGHT NOW.

USER ROLE CONTEXT:
- student: Learning, career, portfolio
- professional: Productivity, skill development
- business: Revenue, competitive advantage
- investor: Market trends, ROI
- citizen: Societal impact, personal use

CATEGORY-SPECIFIC ACTIONS:
- product: "Try It" (demo), "Learn How" (tutorial), "See Use Cases"
- research: "Read Paper" (arXiv), "See Code" (GitHub), "Learn Concepts"
- funding: "View Jobs" (careers), "Meet Founders", "Similar Startups"
- regulation: "Read Policy", "Impact Analysis", "Compliance Guide"
- opinion: "Read Counter-View", "Fact-Check", "Expert Take"

RESPONSE FORMAT (JSON only, no markdown):
{"why_it_matters": "Personalized explanation (80-120 words)", "action_items": [{"label": "Action label", "description": "What user will do", "url": "https://...", "type": "tool/tutorial/job/analysis", "time_estimate": "15 min"}]}"""


def generate_actions(article: Dict, category: str, user_role: str) -> Dict:
    """
    Generate personalized "why it matters" and action items for an article.
    
    Args:
        article: Dict containing article data (title, content, eli5, url, source)
        category: Article category (research, product, funding, regulation, opinion)
        user_role: User's role (student, professional, business, investor, citizen)
    
    Returns:
        Dict with user_role, why_it_matters, and action_items
    """
    try:
        # Get article content - prefer ELI5, fallback to first 500 chars of content
        article_summary = article.get('eli5', '')
        if not article_summary:
            content = article.get('content', article.get('original_text', ''))
            article_summary = content[:500] if content else 'No content available'
        
        # Build the prompt
        prompt = f"""{SYSTEM_INSTRUCTIONS}

---

USER ROLE: {user_role}
ARTICLE CATEGORY: {category}
ARTICLE TITLE: {article.get('title', 'Untitled')}
ARTICLE SOURCE: {article.get('source', 'Unknown')}
ARTICLE URL: {article.get('url', '')}

ARTICLE SUMMARY:
{article_summary}

---

Generate personalized content for this {user_role} user. Focus on {category}-specific actions.
Return ONLY valid JSON, no markdown formatting."""

        # Generate content using new SDK with retry on rate limits
        response_text = _call_gemini_with_retry(prompt)
        if response_text is None:
            return _get_default_response(user_role, article, category)
        
        # Strip markdown code blocks if present
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON response
        result = json.loads(response_text)
        
        # Return structured response
        return {
            'user_role': user_role,
            'why_it_matters': result.get('why_it_matters', 'This article is relevant to your interests.'),
            'action_items': result.get('action_items', [])
        }
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        return _get_default_response(user_role, article, category)
    except Exception as e:
        print(f"Error generating actions: {e}")
        return _get_default_response(user_role, article, category)


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
                print(f"  \u23f3 Rate limited, retrying in {wait}s (attempt {attempt+1}/{max_retries})...")
                time.sleep(wait)
            else:
                raise
    print("  \u274c Max retries exceeded for Gemini API")
    return None


def _get_default_response(user_role: str, article: Dict, category: str) -> Dict:
    """
    Return default response when Gemini API fails.
    
    Args:
        user_role: User's role
        article: Article data
        category: Article category
    
    Returns:
        Default Dict with placeholder content
    """
    default_actions = {
        'product': [
            {
                'label': 'Try It',
                'description': 'Explore the product demo',
                'url': article.get('url', 'https://example.com'),
                'type': 'tool',
                'time_estimate': '10 min'
            },
            {
                'label': 'Learn How',
                'description': 'Watch a tutorial to get started',
                'url': 'https://youtube.com',
                'type': 'tutorial',
                'time_estimate': '20 min'
            }
        ],
        'research': [
            {
                'label': 'Read Paper',
                'description': 'Access the full research paper',
                'url': 'https://arxiv.org',
                'type': 'analysis',
                'time_estimate': '30 min'
            },
            {
                'label': 'See Code',
                'description': 'Explore the implementation on GitHub',
                'url': 'https://github.com',
                'type': 'tool',
                'time_estimate': '15 min'
            }
        ],
        'funding': [
            {
                'label': 'View Jobs',
                'description': 'Check open positions at this company',
                'url': 'https://linkedin.com/jobs',
                'type': 'job',
                'time_estimate': '10 min'
            },
            {
                'label': 'Similar Startups',
                'description': 'Discover related companies',
                'url': 'https://tracxn.com',
                'type': 'analysis',
                'time_estimate': '15 min'
            }
        ],
        'regulation': [
            {
                'label': 'Read Policy',
                'description': 'Access the full policy document',
                'url': article.get('url', 'https://meity.gov.in'),
                'type': 'analysis',
                'time_estimate': '20 min'
            },
            {
                'label': 'Impact Analysis',
                'description': 'Understand how this affects you',
                'url': 'https://example.com/analysis',
                'type': 'analysis',
                'time_estimate': '15 min'
            }
        ],
        'opinion': [
            {
                'label': 'Read Counter-View',
                'description': 'Explore alternative perspectives',
                'url': 'https://example.com',
                'type': 'analysis',
                'time_estimate': '10 min'
            },
            {
                'label': 'Fact-Check',
                'description': 'Verify the claims made',
                'url': 'https://example.com/facts',
                'type': 'analysis',
                'time_estimate': '10 min'
            }
        ]
    }
    
    role_context = {
        'student': 'As a student, this development could impact your learning journey and career prospects.',
        'professional': 'As a professional, this could enhance your productivity and skill development.',
        'business': 'For your business, this represents potential revenue opportunities and competitive advantages.',
        'investor': 'From an investment perspective, this signals important market trends and ROI potential.',
        'citizen': 'As a citizen, this has implications for society and your daily life.'
    }
    
    return {
        'user_role': user_role,
        'why_it_matters': role_context.get(user_role, 'This article is relevant to your interests.'),
        'action_items': default_actions.get(category, default_actions['opinion'])
    }


if __name__ == "__main__":
    # Sample article for testing
    sample_article = {
        'title': 'Google Launches Gemini 2.0 with Revolutionary Multimodal Capabilities',
        'source': 'Google AI Blog',
        'url': 'https://ai.googleblog.com/gemini-2-0',
        'content': '''Google has announced Gemini 2.0, a significant upgrade to their AI model family. 
        The new model features improved multimodal understanding, faster inference speeds, and enhanced 
        reasoning capabilities. Key features include native image and video understanding, code generation, 
        and a context window of 2 million tokens. The model is now available through Google AI Studio 
        and the Gemini API. Early benchmarks show it outperforms GPT-4 and Claude 3 on several tasks.
        Indian developers can access it through the free tier with generous rate limits.''',
        'eli5': '''Imagine Google made a super-smart assistant that can understand photos, videos, and text 
        all at once - like having a genius friend who can look at your Diwali photos and write captions, 
        help you code an app, or explain a complicated research paper in simple Hindi. It's like going 
        from a regular dabba TV to a 4K smart TV - same screen, but way more features!'''
    }
    
    # Test all 5 user roles
    user_roles = ['student', 'professional', 'business', 'investor', 'citizen']
    
    print("=" * 60)
    print("Testing Action Generator for All User Roles")
    print("=" * 60)
    
    for role in user_roles:
        print(f"\n{'=' * 20} {role.upper()} {'=' * 20}")
        result = generate_actions(sample_article, 'product', role)
        print(f"\nUser Role: {result['user_role']}")
        print(f"\nWhy It Matters:\n{result['why_it_matters']}")
        print(f"\nAction Items:")
        for i, action in enumerate(result['action_items'], 1):
            print(f"  {i}. {action.get('label', 'Action')}")
            print(f"     Description: {action.get('description', 'N/A')}")
            print(f"     URL: {action.get('url', 'N/A')}")
            print(f"     Type: {action.get('type', 'N/A')}")
            print(f"     Time: {action.get('time_estimate', 'N/A')}")
        print("-" * 50)
    
    print("\n✅ Action Generator test completed!")
