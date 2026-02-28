"""
Agent 5: Localization
Translates content to Indian languages using Sarvam AI Translation API.
"""

import requests
import os
from typing import Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Language codes mapping for Sarvam AI
LANGUAGE_CODES: Dict[str, str] = {
    'hindi': 'hi-IN',
    'tamil': 'ta-IN',
    'telugu': 'te-IN',
    'bengali': 'bn-IN',
    'marathi': 'mr-IN',
    'gujarati': 'gu-IN',
    'kannada': 'kn-IN',
    'malayalam': 'ml-IN',
    'punjabi': 'pa-IN',
    'odia': 'or-IN'
}

# Sarvam AI API configuration
SARVAM_API_URL = "https://api.sarvam.ai/translate"


def localize_content(text: str, target_language: str) -> str:
    """
    Translate text to the specified Indian language using Sarvam AI.
    
    Args:
        text: The English text to translate
        target_language: Target language name (e.g., 'hindi', 'tamil')
    
    Returns:
        Translated text in the target language, or original text on failure
    """
    # If target is English, return unchanged
    if target_language.lower() == 'english':
        return text
    
    # Get language code from mapping
    language_code = LANGUAGE_CODES.get(target_language.lower())
    
    if not language_code:
        print(f"Language '{target_language}' not supported yet.")
        return f"[Translation for {target_language} coming soon]"
    
    # Get API key from environment
    api_key = os.getenv("SARVAM_AI_API_KEY")
    
    if not api_key:
        print("Warning: SARVAM_AI_API_KEY not found in environment variables.")
        return text
    
    try:
        # Prepare request headers
        headers = {
            "Content-Type": "application/json",
            "api-subscription-key": api_key
        }
        
        # Prepare request body
        payload = {
            "input": text,
            "source_language_code": "en-IN",
            "target_language_code": language_code,
            "mode": "formal"
        }
        
        # Make API call
        response = requests.post(
            SARVAM_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        # Handle response
        if response.status_code == 200:
            result = response.json()
            translated_text = result.get('translated_text', text)
            return translated_text
        else:
            print(f"Translation API error: {response.status_code}")
            print(f"Response: {response.text}")
            return text
            
    except requests.exceptions.Timeout:
        print("Translation API timeout - returning original text")
        return text
    except requests.exceptions.RequestException as e:
        print(f"Translation API request error: {e}")
        return text
    except Exception as e:
        print(f"Unexpected error during translation: {e}")
        return text


def get_supported_languages() -> list:
    """
    Get list of supported language names.
    
    Returns:
        List of supported language names
    """
    return ['english'] + list(LANGUAGE_CODES.keys())


def get_language_code(language_name: str) -> str:
    """
    Get the Sarvam AI language code for a given language name.
    
    Args:
        language_name: Name of the language (e.g., 'hindi')
    
    Returns:
        Language code (e.g., 'hi-IN') or None if not found
    """
    return LANGUAGE_CODES.get(language_name.lower())


if __name__ == "__main__":
    # Test the localization function
    test_text = "Artificial Intelligence is transforming India"
    
    print("=" * 60)
    print("Testing Localization Agent (Sarvam AI)")
    print("=" * 60)
    
    print(f"\nOriginal: {test_text}")
    print("-" * 40)
    
    # Test Hindi translation
    print("\nTranslating to Hindi...")
    hindi_result = localize_content(test_text, "hindi")
    print(f"Hindi: {hindi_result}")
    
    # Test Tamil translation
    print("\nTranslating to Tamil...")
    tamil_result = localize_content(test_text, "tamil")
    print(f"Tamil: {tamil_result}")
    
    # Test Telugu translation
    print("\nTranslating to Telugu...")
    telugu_result = localize_content(test_text, "telugu")
    print(f"Telugu: {telugu_result}")
    
    # Test English (should return unchanged)
    print("\nTranslating to English (should return unchanged)...")
    english_result = localize_content(test_text, "english")
    print(f"English: {english_result}")
    
    # Test unsupported language
    print("\nTranslating to French (unsupported)...")
    french_result = localize_content(test_text, "french")
    print(f"French: {french_result}")
    
    # Print supported languages
    print("\n" + "=" * 60)
    print("Supported Languages:")
    print(", ".join(get_supported_languages()))
    print("=" * 60)
    
    print("\n✅ Localization test completed!")
