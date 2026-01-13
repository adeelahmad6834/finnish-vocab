import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// File paths
export const DATABASE_FILE = path.join(ROOT_DIR, 'database.json');
export const VOCABULARY_FILE = path.join(ROOT_DIR, 'vocabulary.json');
export const DAILY_GOALS_FILE = path.join(ROOT_DIR, 'daily-goals.json');

// Legacy file path (for migration)
export const LEGACY_DATA_FILE = path.join(ROOT_DIR, 'vocabulary.json');

// Pagination
export const PAGE_SIZE = 10;

// Default categories
export const DEFAULT_CATEGORIES = [
  'grocery',
  'weather',
  'automobiles',
  'body parts',
  'greetings',
  'numbers',
  'colors',
  'food & drinks',
  'family',
  'animals',
  'verbs',
  'adjectives',
  'question words',
  'pronouns',
  'common phrases',
  'spoken finnish',
  'other'
];

// Entry types
export const ENTRY_TYPES = ['word', 'phrase', 'sentence', 'expression'];

// Auto-mastery settings
export const MASTERY_CONFIG = {
  streakRequired: 3,
  minAttempts: 4,
  accuracyThreshold: 0.85
};

// SM-2 Spaced Repetition Algorithm settings
export const SM2_CONFIG = {
  defaultEaseFactor: 2.5,
  minEaseFactor: 1.3,
  initialIntervals: [1, 3]
};

// Finnish word dictionary for auto-category detection
export const FINNISH_WORD_DICTIONARY = {
  // Greetings
  'hei': 'greetings', 'moi': 'greetings', 'terve': 'greetings', 'moikka': 'greetings',
  'kiitos': 'greetings', 'anteeksi': 'greetings', 'ole hyvä': 'greetings',
  'näkemiin': 'greetings', 'hei hei': 'greetings', 'huomenta': 'greetings',
  'iltaa': 'greetings', 'yötä': 'greetings', 'päivää': 'greetings',

  // Numbers
  'yksi': 'numbers', 'kaksi': 'numbers', 'kolme': 'numbers', 'neljä': 'numbers',
  'viisi': 'numbers', 'kuusi': 'numbers', 'seitsemän': 'numbers', 'kahdeksan': 'numbers',
  'yhdeksän': 'numbers', 'kymmenen': 'numbers', 'sata': 'numbers', 'tuhat': 'numbers',

  // Colors
  'punainen': 'colors', 'sininen': 'colors', 'vihreä': 'colors', 'keltainen': 'colors',
  'musta': 'colors', 'valkoinen': 'colors', 'harmaa': 'colors', 'ruskea': 'colors',
  'oranssi': 'colors', 'violetti': 'colors', 'pinkki': 'colors',

  // Body parts
  'pää': 'body parts', 'käsi': 'body parts', 'jalka': 'body parts', 'silmä': 'body parts',
  'korva': 'body parts', 'nenä': 'body parts', 'suu': 'body parts', 'hampaat': 'body parts',
  'sormi': 'body parts', 'varvas': 'body parts', 'polvi': 'body parts', 'olkapää': 'body parts',
  'selkä': 'body parts', 'vatsa': 'body parts', 'sydän': 'body parts', 'aivot': 'body parts',

  // Weather
  'sää': 'weather', 'aurinko': 'weather', 'sade': 'weather', 'lumi': 'weather',
  'tuuli': 'weather', 'pilvi': 'weather', 'ukkonen': 'weather', 'sumu': 'weather',
  'jää': 'weather', 'lämpötila': 'weather', 'kylmä': 'weather', 'kuuma': 'weather',
  'sataa': 'weather', 'paistaa': 'weather',

  // Automobiles
  'auto': 'automobiles', 'pyörä': 'automobiles', 'bussi': 'automobiles', 'juna': 'automobiles',
  'lentokone': 'automobiles', 'vene': 'automobiles', 'laiva': 'automobiles', 'moottoripyörä': 'automobiles',
  'rengas': 'automobiles', 'moottori': 'automobiles', 'jarru': 'automobiles', 'ratti': 'automobiles',

  // Grocery
  'maito': 'grocery', 'leipä': 'grocery', 'voi': 'grocery', 'juusto': 'grocery',
  'kananmuna': 'grocery', 'liha': 'grocery', 'kala': 'grocery', 'hedelmä': 'grocery',
  'vihannes': 'grocery', 'omena': 'grocery', 'banaani': 'grocery', 'peruna': 'grocery',
  'riisi': 'grocery', 'pasta': 'grocery', 'sokeri': 'grocery', 'suola': 'grocery',

  // Food & drinks
  'kahvi': 'food & drinks', 'tee': 'food & drinks', 'vesi': 'food & drinks', 'mehu': 'food & drinks',
  'olut': 'food & drinks', 'viini': 'food & drinks', 'ruoka': 'food & drinks', 'ateria': 'food & drinks',
  'aamiainen': 'food & drinks', 'lounas': 'food & drinks', 'päivällinen': 'food & drinks',

  // Family
  'äiti': 'family', 'isä': 'family', 'veli': 'family', 'sisko': 'family',
  'mummo': 'family', 'vaari': 'family', 'täti': 'family', 'setä': 'family',
  'serkku': 'family', 'lapsi': 'family', 'poika': 'family', 'tyttö': 'family',
  'vaimo': 'family', 'mies': 'family', 'perhe': 'family',

  // Animals
  'koira': 'animals', 'kissa': 'animals', 'lintu': 'animals', 'kala': 'animals',
  'hevonen': 'animals', 'lehmä': 'animals', 'sika': 'animals', 'lammas': 'animals',
  'karhu': 'animals', 'susi': 'animals', 'kettu': 'animals', 'jänis': 'animals',
  'hiiri': 'animals', 'perhonen': 'animals', 'mehiläinen': 'animals',

  // Question words
  'mitä': 'question words', 'missä': 'question words', 'milloin': 'question words',
  'kuka': 'question words', 'miksi': 'question words', 'miten': 'question words',
  'mikä': 'question words', 'mitkä': 'question words', 'mistä': 'question words',
  'mihin': 'question words', 'kuinka': 'question words', 'onko': 'question words',
  'eikö': 'question words', 'voitko': 'question words', 'voisitko': 'question words',
  'saanko': 'question words',

  // Spoken Finnish
  'mite': 'spoken finnish', 'miks': 'spoken finnish', 'mis': 'spoken finnish',
  'millon': 'spoken finnish',

  // Pronouns
  'minä': 'pronouns', 'sinä': 'pronouns', 'hän': 'pronouns', 'se': 'pronouns',
  'me': 'pronouns', 'te': 'pronouns', 'he': 'pronouns', 'ne': 'pronouns',
  'minut': 'pronouns', 'sinut': 'pronouns', 'hänet': 'pronouns', 'sen': 'pronouns',
  'meidät': 'pronouns', 'teidät': 'pronouns', 'heidät': 'pronouns',
  'minun': 'pronouns', 'sinun': 'pronouns', 'hänen': 'pronouns',
  'meidän': 'pronouns', 'teidän': 'pronouns', 'heidän': 'pronouns',
  'tämä': 'pronouns', 'tuo': 'pronouns', 'nämä': 'pronouns', 'nuo': 'pronouns',
  'itse': 'pronouns', 'joka': 'pronouns', 'joku': 'pronouns', 'jokin': 'pronouns',
  'kaikki': 'pronouns', 'kukaan': 'pronouns', 'mitään': 'pronouns'
};

// English keywords for category detection
export const ENGLISH_CATEGORY_KEYWORDS = {
  'grocery': ['milk', 'bread', 'butter', 'cheese', 'egg', 'meat', 'fish', 'fruit', 'vegetable', 'apple', 'potato', 'rice', 'sugar', 'salt', 'flour'],
  'weather': ['sun', 'rain', 'snow', 'wind', 'cloud', 'thunder', 'fog', 'ice', 'temperature', 'cold', 'hot', 'warm', 'weather', 'storm'],
  'automobiles': ['car', 'bike', 'bus', 'train', 'plane', 'boat', 'ship', 'motorcycle', 'tire', 'engine', 'brake', 'wheel', 'drive', 'vehicle'],
  'body parts': ['head', 'hand', 'foot', 'eye', 'ear', 'nose', 'mouth', 'teeth', 'finger', 'toe', 'knee', 'shoulder', 'back', 'stomach', 'heart', 'brain', 'arm', 'leg'],
  'greetings': ['hello', 'hi', 'goodbye', 'bye', 'thanks', 'thank', 'sorry', 'please', 'welcome', 'morning', 'evening', 'night'],
  'numbers': ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'first', 'second'],
  'colors': ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'brown', 'orange', 'purple', 'pink', 'color'],
  'food & drinks': ['coffee', 'tea', 'water', 'juice', 'beer', 'wine', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'eat', 'drink'],
  'family': ['mother', 'father', 'brother', 'sister', 'grandmother', 'grandfather', 'aunt', 'uncle', 'cousin', 'child', 'son', 'daughter', 'wife', 'husband', 'family', 'parent'],
  'animals': ['dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'bear', 'wolf', 'fox', 'rabbit', 'mouse', 'butterfly', 'bee', 'animal'],
  'verbs': ['be', 'have', 'do', 'go', 'come', 'see', 'want', 'can', 'get', 'make', 'know', 'think', 'take', 'give', 'find', 'tell', 'say', 'speak', 'read', 'write', 'run', 'walk', 'sleep', 'eat', 'drink'],
  'adjectives': ['good', 'bad', 'big', 'small', 'new', 'old', 'young', 'beautiful', 'ugly', 'fast', 'slow', 'easy', 'hard', 'happy', 'sad', 'tired', 'hungry'],
  'question words': ['what', 'where', 'when', 'who', 'whom', 'why', 'how', 'which', 'how many', 'how much', 'how long', 'how often', 'how far', 'how old', 'how big', 'how fast'],
  'pronouns': ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves', 'who', 'which', 'someone', 'something', 'anyone', 'anything', 'everyone', 'everything', 'nobody', 'nothing', 'self', 'oneself'],
  'common phrases': ['how are you', 'nice to meet', 'excuse me', 'i understand', 'i don\'t understand', 'please', 'thank you', 'you\'re welcome', 'see you', 'take care', 'no problem', 'of course', 'i think', 'i know', 'i don\'t know', 'let\'s go', 'wait a moment', 'one moment', 'i\'m sorry', 'it doesn\'t matter', 'never mind'],
  'spoken finnish': ['spoken', 'colloquial', 'informal']
};
