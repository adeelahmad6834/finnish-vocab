import { FINNISH_WORD_DICTIONARY, ENGLISH_CATEGORY_KEYWORDS } from './config.js';

// Auto-detect category based on Finnish word and English meaning
export function detectCategory(finnishWord, englishMeaning) {
  const finnishLower = finnishWord.toLowerCase().trim();
  const englishLower = englishMeaning.toLowerCase().trim();

  // Check Finnish dictionary first
  if (FINNISH_WORD_DICTIONARY[finnishLower]) {
    return FINNISH_WORD_DICTIONARY[finnishLower];
  }

  // Check if Finnish word contains a known word
  for (const [word, category] of Object.entries(FINNISH_WORD_DICTIONARY)) {
    if (finnishLower.includes(word) || word.includes(finnishLower)) {
      return category;
    }
  }

  // Check English keywords
  for (const [category, keywords] of Object.entries(ENGLISH_CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (englishLower.includes(keyword) || keyword.includes(englishLower)) {
        return category;
      }
    }
  }

  // Check for verb patterns
  if (finnishLower.match(/(da|dä|ta|tä|la|lä|na|nä|ra|rä|va|vä)$/) &&
      englishLower.match(/^(to |i |we |they )?[a-z]+$/)) {
    return 'verbs';
  }

  // Check for adjective patterns
  if (finnishLower.match(/(inen|nen|kas|käs|va|vä|ea|eä)$/)) {
    return 'adjectives';
  }

  return null;
}
