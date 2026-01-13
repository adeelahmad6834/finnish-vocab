import fs from 'fs';
import { DATABASE_FILE, VOCABULARY_FILE, DEFAULT_CATEGORIES } from './config.js';

// Default empty progress entry for a word
export function createEmptyLearningEntry(wordId) {
  return {
    wordId,
    startedLearningAt: new Date().toISOString(),
    mastered: false,
    masteredAt: null,
    practiceCount: 0,
    correctCount: 0,
    streakFiEn: 0,
    streakEnFi: 0,
    attemptsFiEn: 0,
    attemptsEnFi: 0,
    correctFiEn: 0,
    correctEnFi: 0,
    lastPracticedFiEn: null,
    lastPracticedEnFi: null,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: null,
    lastReviewed: null
  };
}

// Load database (word definitions)
export function loadDatabase() {
  try {
    if (fs.existsSync(DATABASE_FILE)) {
      return JSON.parse(fs.readFileSync(DATABASE_FILE, 'utf-8'));
    }
  } catch (error) {
    console.log('Warning: Could not load database file.');
  }
  return {
    version: 1,
    words: [],
    categories: DEFAULT_CATEGORIES
  };
}

// Load vocabulary (personal progress)
export function loadVocabulary() {
  try {
    if (fs.existsSync(VOCABULARY_FILE)) {
      return JSON.parse(fs.readFileSync(VOCABULARY_FILE, 'utf-8'));
    }
  } catch (error) {
    console.log('Warning: Could not load vocabulary file.');
  }
  return {
    version: 1,
    learningEntries: [],
    stats: {
      totalPracticeSessions: 0,
      lastPracticeDate: null
    },
    orphanedEntries: []
  };
}

// Load and merge both data sources
export function loadMergedData() {
  const database = loadDatabase();
  const vocabulary = loadVocabulary();

  // Build lookup map for learning entries by wordId
  const progressMap = new Map(
    vocabulary.learningEntries.map(e => [e.wordId, e])
  );

  // Track which wordIds exist in database
  const databaseWordIds = new Set(database.words.map(w => w.id));

  // Merge: combine word definitions with their progress (if learning)
  const mergedWords = database.words.map(word => {
    const progress = progressMap.get(word.id);
    if (progress) {
      return {
        ...word,
        ...progress,
        isLearning: true
      };
    }
    return {
      ...word,
      isLearning: false,
      mastered: false,
      practiceCount: 0,
      correctCount: 0
    };
  });

  // Detect orphaned entries (learning entries whose word was deleted from database)
  const orphaned = vocabulary.learningEntries.filter(
    e => !databaseWordIds.has(e.wordId)
  );

  // Update orphaned entries in vocabulary
  vocabulary.orphanedEntries = orphaned;

  return {
    words: mergedWords,
    categories: database.categories,
    stats: vocabulary.stats,
    orphanedEntries: orphaned,
    // Keep references for targeted saves
    _database: database,
    _vocabulary: vocabulary
  };
}

// Save database (word definitions only)
export function saveDatabase(database) {
  const toSave = {
    version: database.version || 1,
    words: database.words,
    categories: database.categories
  };
  fs.writeFileSync(DATABASE_FILE, JSON.stringify(toSave, null, 2));
}

// Save vocabulary (personal progress only)
export function saveVocabulary(vocabulary) {
  const toSave = {
    version: vocabulary.version || 1,
    learningEntries: vocabulary.learningEntries,
    stats: vocabulary.stats,
    orphanedEntries: vocabulary.orphanedEntries || []
  };
  fs.writeFileSync(VOCABULARY_FILE, JSON.stringify(toSave, null, 2));
}

// Legacy saveData - saves both files (for compatibility during transition)
export function saveData(data) {
  if (data._database && data._vocabulary) {
    saveDatabase(data._database);
    saveVocabulary(data._vocabulary);
  }
}

// Get quick stats
export function getQuickStats(data) {
  const totalInDatabase = data._database ? data._database.words.length : data.words.length;
  const learningEntries = data._vocabulary ? data._vocabulary.learningEntries : [];
  const totalLearning = learningEntries.length;
  const mastered = learningEntries.filter(e => e.mastered).length;
  const learning = totalLearning - mastered;

  return {
    totalInDatabase,
    totalLearning,
    mastered,
    learning
  };
}

// Get words for practice (only words user is learning, excludes mastered by default)
export function getWordsForPractice(data, includeMastered = false) {
  // Filter to only words the user is learning
  const learningWords = data.words.filter(w => w.isLearning);

  if (includeMastered) {
    return [...learningWords];
  }
  return learningWords.filter(w => !w.mastered);
}

// Add a word to personal learning list
export function addToLearning(data, wordId) {
  // Check if already learning
  const existing = data._vocabulary.learningEntries.find(e => e.wordId === wordId);
  if (existing) {
    return false;
  }

  const entry = createEmptyLearningEntry(wordId);
  data._vocabulary.learningEntries.push(entry);
  saveVocabulary(data._vocabulary);

  // Update merged words list
  const word = data.words.find(w => w.id === wordId);
  if (word) {
    Object.assign(word, entry, { isLearning: true });
  }

  return true;
}

// Remove a word from personal learning list
export function removeFromLearning(data, wordId) {
  const idx = data._vocabulary.learningEntries.findIndex(e => e.wordId === wordId);
  if (idx === -1) {
    return false;
  }

  data._vocabulary.learningEntries.splice(idx, 1);
  saveVocabulary(data._vocabulary);

  // Update merged words list
  const word = data.words.find(w => w.id === wordId);
  if (word) {
    word.isLearning = false;
    word.mastered = false;
    word.practiceCount = 0;
    word.correctCount = 0;
  }

  return true;
}

// Find learning entry for a word
export function findLearningEntry(data, wordId) {
  return data._vocabulary.learningEntries.find(e => e.wordId === wordId);
}

// Update learning entry and sync to merged word
export function updateLearningEntry(data, wordId, updates) {
  const entry = findLearningEntry(data, wordId);
  if (!entry) return false;

  Object.assign(entry, updates);

  // Also update the merged word
  const word = data.words.find(w => w.id === wordId);
  if (word) {
    Object.assign(word, updates);
  }

  return true;
}
