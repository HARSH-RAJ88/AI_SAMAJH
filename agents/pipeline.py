"""
Pipeline Orchestrator
Orchestrates all agents to process a single article through the AI Samajh pipeline.
"""

import os
import json
import time
from typing import Dict
from dotenv import load_dotenv
from supabase import create_client, Client

# Import all agent functions
from agents.context_generator import generate_context
from agents.verification import verify_article
from agents.action_generator import generate_actions
from agents.localization import localize_content

# Load environment variables
load_dotenv()

# Initialize Supabase client at module level
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    print("Warning: Supabase credentials not found. Database operations will fail.")
    supabase: Client = None
else:
    supabase: Client = create_client(supabase_url, supabase_key)

# User roles for personalized context generation
USER_ROLES = ['student', 'professional', 'business', 'investor', 'citizen']


def process_article(article: Dict) -> Dict:
    """
    Process a single article through the complete AI Samajh pipeline.
    
    Pipeline Steps:
    1. Generate Context (ELI5, category, relevance scores)
    2. Verify Credibility
    3. Save Article to Database
    4. Generate Personalized Contexts for all user roles
    5. Localization (TODO: post-MVP)
    6. Voice (stub)
    
    Args:
        article: Dict containing article data (title, url, source, content, published)
    
    Returns:
        Dict with article_id, processed status, and contexts_created count
    """
    try:
        article_title = article.get('title', 'Untitled')
        print(f"\nProcessing article: \"{article_title}\"")
        print("-" * 50)
        
        # Step 1: Generate Context (Agent 2)
        print("Step 1: Generating context...")
        context_result = generate_context(article)
        
        eli5 = context_result.get('eli5', '')
        category = context_result.get('category', 'opinion')
        relevance_scores = context_result.get('relevance_scores', {
            'student': 50,
            'professional': 50,
            'business': 50,
            'investor': 50,
            'citizen': 50
        })
        key_concepts = context_result.get('key_concepts', [])
        
        print(f"✓ Generated context (category: {category})")
        
        # Step 2: Verify Credibility (Agent 4)
        print("Step 2: Verifying credibility...")
        verification_result = verify_article(article)
        
        credibility_score = verification_result.get('credibility_score', 50)
        badge = verification_result.get('badge', '⭐⭐⭐')
        
        print(f"✓ Verified credibility (score: {credibility_score}, badge: {badge})")
        
        # Step 3: Save Article to Database
        print("Step 3: Saving article to database...")
        
        if supabase is None:
            print("⚠ Supabase not configured - skipping database save")
            article_id = "test-article-id"
        else:
            # Prepare article data for insertion
            article_data = {
                'title': article.get('title', 'Untitled'),
                'url': article.get('url', ''),
                'source': article.get('source', 'Unknown'),
                'category': category,
                'original_text': article.get('content', article.get('excerpt', ''))[:10000],  # Limit text size
                'eli5': eli5,
                'credibility': credibility_score,
                'published_at': article.get('published', None),
                'relevance_scores': relevance_scores if isinstance(relevance_scores, dict) else {}
            }
            
            # Upsert into articles table (skip duplicates by URL)
            result = supabase.table('articles').upsert(
                article_data, on_conflict='url'
            ).execute()
            
            if result.data and len(result.data) > 0:
                article_id = result.data[0]['id']
                print(f"✓ Saved article to database (ID: {article_id})")
            else:
                raise Exception("Failed to insert article into database")
        
        # Step 4: Generate Personalized Contexts (Agent 3)
        print("Step 4: Generating personalized contexts...")
        
        # Enhance article with ELI5 for better action generation
        enhanced_article = {**article, 'eli5': eli5}
        contexts_created = 0
        
        for role in USER_ROLES:
            print(f"  Generating context for {role}...")
            
            action_result = generate_actions(enhanced_article, category, role)
            
            why_it_matters = action_result.get('why_it_matters', '')
            action_items = action_result.get('action_items', [])
            
            if supabase is not None:
                # Prepare context data for insertion
                context_data = {
                    'article_id': article_id,
                    'user_role': role,
                    'why_it_matters': why_it_matters,
                    'action_items': action_items if isinstance(action_items, list) else [],
                    'language': 'english'
                }
                
                # Insert into article_contexts table
                supabase.table('article_contexts').insert(context_data).execute()
            
            contexts_created += 1
            print(f"  ✓ Generated context for {role}")
        
        # Step 5: Localization (Agent 5) - Optional for MVP
        # TODO: Localize for Hindi post-MVP
        # Example: hindi_eli5 = localize_content(eli5, 'hindi')
        print("Step 5: Localization (skipped for MVP)")
        
        # Step 6: Voice (Agent 6) - Stub
        # Already returns placeholder URL
        print("Step 6: Voice generation (stub - skipped)")
        
        print("-" * 50)
        print(f"✅ Successfully processed article: {article_title}")
        
        return {
            'article_id': article_id,
            'processed': True,
            'contexts_created': contexts_created,
            'category': category,
            'credibility_score': credibility_score,
            'badge': badge
        }
        
    except Exception as e:
        print(f"❌ Error processing article: {e}")
        return {
            'processed': False,
            'error': str(e)
        }


def process_articles_batch(articles: list) -> Dict:
    """
    Process multiple articles through the pipeline.
    
    Args:
        articles: List of article dictionaries
    
    Returns:
        Dict with summary statistics
    """
    processed = 0
    failed = 0
    
    for i, article in enumerate(articles, 1):
        print(f"\n{'='*60}")
        print(f"Processing article {i}/{len(articles)}")
        print(f"{'='*60}")
        
        result = process_article(article)
        
        if result.get('processed'):
            processed += 1
        else:
            failed += 1
    
    return {
        'total': len(articles),
        'processed': processed,
        'failed': failed
    }


if __name__ == "__main__":
    import argparse
    from agents.scraper import scrape_indian_stack, scrape_rss_feed, MVP_RSS_FEEDS

    parser = argparse.ArgumentParser(description="AI Samajh Pipeline")
    parser.add_argument("-n", "--count", type=int, default=10, help="Number of articles to process (default: 10)")
    parser.add_argument("--sample", action="store_true", help="Use hardcoded sample instead of scraper")
    parser.add_argument("--clear", action="store_true", help="Delete ALL existing articles from DB before processing")
    args = parser.parse_args()

    print("=" * 60)
    print("🚀 AI SAMAJH PIPELINE")
    print("=" * 60)

    # Clear old data if requested
    if args.clear and supabase:
        print("\n🗑️  Clearing existing articles and contexts from database...")
        supabase.table('article_contexts').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('articles').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print("✅ Database cleared!")

    articles = []

    if args.sample:
        articles = [{
            'title': 'Google Launches Gemini 2.0 with Revolutionary Multimodal Capabilities',
            'source': 'Google AI Blog',
            'url': f'https://ai.googleblog.com/gemini-2-0-test-{os.urandom(4).hex()}',
            'published': '2026-02-27T10:00:00Z',
            'content': 'Google has announced Gemini 2.0, featuring improved multimodal understanding, '
                       'faster inference, and a 2M token context window. Available via Google AI Studio '
                       'and Vertex AI. Supports Hindi, Tamil, Telugu. Free tier for Indian developers.',
        }]
    else:
        print("\n⏳ Scraping real articles from Indian Stack...")
        articles = scrape_indian_stack()
        if len(articles) < args.count:
            print("⏳ Adding global RSS articles...")
            for feed_url in MVP_RSS_FEEDS:
                articles.extend(scrape_rss_feed(feed_url))

    # Process top N articles
    batch = articles[:args.count]
    print(f"\n🔬 Processing {len(batch)} articles through pipeline...\n")

    result = process_articles_batch(batch)

    print("\n" + "=" * 60)
    print("📊 PIPELINE SUMMARY")
    print("=" * 60)
    print(json.dumps(result, indent=2))
    print("\n✅ Pipeline completed!")
