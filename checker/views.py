from django.shortcuts import render
from django.http import JsonResponse
from .utils import spell_checker
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def spell_check(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            text = data.get('text', '')
            language = data.get('language', 'en')
            
            result = spell_checker.correct_text(text, language)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return render(request, 'checker/index.html')

# Example usage in views (for testing)
def test_spellcheck():
    # Test English with ambiguous words
    english_text = "I saw a bat flying near the bank"
    result = spell_checker.correct_text(english_text, 'en')
    print("English test:")
    print("Original:", result['original_text'])
    print("Corrected:", result['corrected_text'])
    print("\nWord Analysis:")
    for word, meanings in result['word_analysis'].items():
        print(f"\n{word}:")
        for i, meaning in enumerate(meanings, 1):
            print(f"  Meaning {i}:")
            print(f"    Definition: {meaning['definition']}")
            if meaning['examples']:
                print(f"    Examples: {', '.join(meaning['examples'])}")
            print(f"    Synonyms: {', '.join(meaning['synonyms'])}")

    # Test German
    german_text = "Ich geen zur bank"
    result = spell_checker.correct_text(german_text, 'de')
    print("\nGerman test:")
    print("Original:", result['original_text'])
    print("Corrected:", result['corrected_text'])