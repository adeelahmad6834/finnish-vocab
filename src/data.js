import fs from 'fs';
import { DATA_FILE, DEFAULT_CATEGORIES } from './config.js';

// Load or initialize vocabulary data
export function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (error) {
    console.log('Warning: Could not load data file. Starting fresh.');
  }
  return {
    words: [],
    categories: DEFAULT_CATEGORIES,
    stats: {
      totalWordsAdded: 0,
      totalPracticeSessions: 0,
      lastPracticeDate: null
    }
  };
}

// Save data to file
export function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get quick stats
export function getQuickStats(data) {
  const total = data.words.length;
  const mastered = data.words.filter(w => w.mastered).length;
  const learning = total - mastered;
  return { total, mastered, learning };
}

// Get words for practice (excludes mastered by default)
export function getWordsForPractice(words, includeMastered = false) {
  if (includeMastered) {
    return [...words];
  }
  return words.filter(w => !w.mastered);
}
