from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer
from typing import Dict, List
import nltk
from nltk.corpus import wordnet
from nltk.metrics.distance import edit_distance

# Download required NLTK data
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')
try:
    nltk.data.find('corpora/omw-1.4')
except LookupError:
    nltk.download('omw-1.4')
try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words')

class MultilingualSpellChecker:
    def __init__(self):
        self.models = {}
        self.tokenizers = {}
        self.supported_languages = {
            'en': 'oliverguhr/spelling-correction-english-base',  # English
            'de': 'oliverguhr/spelling-correction-german-base',   # German
            # 'fr': 'julien-c/french-spelling-correction'          # French - dedicated spell checker
        }
        
        self._load_models()
        self._load_word_lists()
    
    def _load_models(self):
        for lang, model_name in self.supported_languages.items():
            if lang == 'fr':
                # Use pipeline for French spell checking
                self.models[lang] = pipeline('text2text-generation', model=model_name)
                self.tokenizers[lang] = None  # Not needed for pipeline
            else:
                self.models[lang] = AutoModelForSeq2SeqLM.from_pretrained(model_name)
                self.tokenizers[lang] = AutoTokenizer.from_pretrained(model_name)
    
    def _load_word_lists(self):
        # Load English words from NLTK
        self.word_lists = {
            'en': set(word.lower() for word in nltk.corpus.words.words()),
            'de': set()  # Can add German word list if needed
        }
    
    def get_word_suggestions(self, word: str, language: str, max_distance: int = 2) -> List[str]:
        suggestions = []
        if language == 'en':
            word = word.lower()
            # Get similar words based on edit distance
            suggestions = [w for w in self.word_lists[language] 
                         if edit_distance(word, w) <= max_distance]
            # Sort by edit distance and limit results
            suggestions.sort(key=lambda x: edit_distance(word, x))
            suggestions = suggestions[:5]  # Limit to top 5 suggestions
        return suggestions

    def get_word_meanings(self, word: str, language: str) -> List[Dict]:
        meanings = []
        if language == 'en':
            synsets = wordnet.synsets(word)
            for syn in synsets:
                meanings.append({
                    'definition': syn.definition(),
                    'examples': syn.examples(),
                    'synonyms': [lemma.name() for lemma in syn.lemmas()]
                })
        return meanings

    def correct_text(self, text: str, language: str) -> Dict:
        if language not in self.supported_languages:
            return {
                'corrected_text': text,
                'error': 'Language not supported'
            }
        
        try:
            if language == 'fr':
                # Use the pipeline directly for French
                result = self.models[language](text, max_length=len(text) + 100)[0]['generated_text']
                corrected_text = result
            else:
                # Original handling for English and German
                tokenizer = self.tokenizers[language]
                model = self.models[language]
                inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
                outputs = model.generate(**inputs)
                corrected_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Analyze each word
            word_analysis = {}
            original_words = text.split()
            corrected_words = corrected_text.split()
            
            for orig, corr in zip(original_words, corrected_words):
                orig_lower = orig.lower().strip('.,!?')
                corr_lower = corr.lower().strip('.,!?')
                
                if orig_lower != corr_lower:  # Word was corrected
                    word_analysis[orig_lower] = {
                        'corrected': corr_lower,
                        'suggestions': self.get_word_suggestions(orig_lower, language),
                        'meanings': self.get_word_meanings(corr_lower, language)
                    }
            
            return {
                'corrected_text': corrected_text,
                'original_text': text,
                'language': language,
                'word_analysis': word_analysis
            }
        except Exception as e:
            return {
                'corrected_text': text,
                'error': str(e)
            }

# Initialize the spell checker
spell_checker = MultilingualSpellChecker()