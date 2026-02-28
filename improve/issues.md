# AI Samajh - Issues & Improvements Tracker

## 🔴 Open Issues

### Issue #1: ELI5 Indian Context Quality
**File:** `agents/agents/context_generator.py`
**Date:** Feb 20, 2026
**Status:** Open

**Problem:**
- The ELI5 Indian context generated for test sample data is not satisfactory
- Need more authentic, relatable Indian analogies
- Test with REAL scraped articles, not sample data

**Suggested Improvements:**
1. Test with actual scraped articles from `scraper.py` output
2. Improve system prompt with more specific Indian examples:
   - Use UPI payments (PhonePe, GPay) instead of generic payment references
   - Reference Jio, Reliance, Tata for tech examples
   - Use IRCTC, Aadhaar for government tech examples
   - Reference IPL, Bigg Boss, KBC for entertainment analogies
3. Add more diverse regional examples (not just Hindi-belt references)
4. Make explanations more conversational ("Arre bhai, socho...")

**Action Required:**
- Run context generator with real scraped articles
- Evaluate quality of generated ELI5s
- Refine system prompt based on real outputs

---

### Issue #2: Indian Stack Scraping Returns Low/Zero Articles
**File:** `agents/agents/scraper.py`
**Date:** Feb 20, 2026
**Status:** Open

**Problem:**
- Indian Stack scrapers (MeitY, NASSCOM, YourStory, Inc42) returning 0 or very few articles
- Most of the 38 scraped articles come from Global RSS feeds, not Indian sources
- Indian sources should be the TOP PRIORITY but aren't contributing data

**Affected Functions:**
| Function | Expected | Actual |
|----------|----------|--------|
| `scrape_meity_updates()` | 5-10 | 0 |
| `scrape_nasscom_updates()` | 5-10 | 0 |
| `scrape_yourstory_from_sitemap()` | 10-15 | 0 |
| `scrape_inc42_metadata()` | 5-10 | 0 |
| `scrape_analytics_india_rss()` | 15-20 | **0** ❌ |

**Root Causes:**
1. Website structure changes - HTML selectors may be outdated
2. Anti-scraping measures blocking requests
3. Sitemap URLs may have changed
4. CSS class names/selectors not matching current site structure
5. **Analytics India RSS feed URL may have changed** (was working before)

**Suggested Fixes:**
1. Manually inspect each Indian site's HTML structure
2. Update CSS selectors in scraper functions
3. Add better User-Agent headers
4. Consider using RSS feeds where available (like Analytics India)
5. Add retry logic with different approaches
6. Log actual HTTP responses for debugging
7. **Find updated RSS feed URL for Analytics India Magazine**

**Action Required:**
- Debug each Indian Stack function individually
- Update selectors based on current website structure
- Add fallback RSS feeds for Indian sources where available

---

### Issue #3: Deprecated Google Generative AI Package
**File:** `agents/agents/context_generator.py`
**Date:** Feb 20, 2026
**Status:** ✅ RESOLVED

**Problem:**
- `google.generativeai` package is deprecated
- Warning: "Please switch to the `google.genai` package"

**Solution Applied:**
- Updated import from `import google.generativeai as genai` to `from google import genai`
- Changed API call from `genai.GenerativeModel().generate_content()` to `client.models.generate_content()`
- Installed new `google-genai` package

---

## ✅ Resolved Issues

### Issue #3: Deprecated Google Package - RESOLVED ✅
- Switched to new `google.genai` package

---

## 💡 Enhancement Ideas

1. Add feedback loop to improve ELI5 quality over time
2. A/B test different prompt styles
3. Add regional language examples in ELI5 (Hindi phrases, etc.)

---

## 📝 Notes

- Track all issues before proceeding to production
- Re-test after each improvement


//Yes, you'll need them! FastAPI is used in the backend API. Let me install them now:
This will fix the FastAPI dependencies so you won't have issues later when running the API server.
{pip install starlette annotated-doc --break-system-packages}

