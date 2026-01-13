import fs from 'fs';
import { DATABASE_FILE, VOCABULARY_FILE, LEGACY_DATA_FILE } from './config.js';

// Check if migration is needed
export function needsMigration() {
  // Migration needed if:
  // 1. Old vocabulary.json exists AND
  // 2. database.json does NOT exist
  // This means we have old-format data that needs to be split
  const oldExists = fs.existsSync(LEGACY_DATA_FILE);
  const newExists = fs.existsSync(DATABASE_FILE);

  if (!oldExists) {
    return false; // No data at all, fresh start
  }

  if (newExists) {
    return false; // Already migrated
  }

  // Check if old file is in legacy format (has 'words' array with progress fields)
  try {
    const oldData = JSON.parse(fs.readFileSync(LEGACY_DATA_FILE, 'utf-8'));
    // Legacy format has words with both definition and progress fields mixed
    if (oldData.words && oldData.words.length > 0) {
      const firstWord = oldData.words[0];
      // Check for progress fields that wouldn't be in new format database
      if ('practiceCount' in firstWord || 'mastered' in firstWord) {
        return true;
      }
    }
  } catch (error) {
    return false;
  }

  return false;
}

// Perform migration from old format to new split format
export function migrateToSplitDatabase() {
  console.log('\nMigrating to split database format...');

  // Load old format data
  let oldData;
  try {
    oldData = JSON.parse(fs.readFileSync(LEGACY_DATA_FILE, 'utf-8'));
  } catch (error) {
    console.log('Error reading old data file:', error.message);
    return false;
  }

  // Extract definition fields for database.json
  const database = {
    version: 1,
    words: oldData.words.map(w => ({
      id: w.id,
      finnish: w.finnish,
      english: w.english,
      category: w.category,
      example: w.example || '',
      notes: w.notes || '',
      addedAt: w.addedAt,
      updatedAt: w.updatedAt
    })),
    categories: oldData.categories
  };

  // Extract progress fields for vocabulary.json
  const vocabulary = {
    version: 1,
    learningEntries: oldData.words.map(w => ({
      wordId: w.id,
      startedLearningAt: w.addedAt,
      mastered: w.mastered || false,
      masteredAt: w.masteredAt || null,
      practiceCount: w.practiceCount || 0,
      correctCount: w.correctCount || 0,
      streakFiEn: w.streakFiEn || 0,
      streakEnFi: w.streakEnFi || 0,
      attemptsFiEn: w.attemptsFiEn || 0,
      attemptsEnFi: w.attemptsEnFi || 0,
      correctFiEn: w.correctFiEn || 0,
      correctEnFi: w.correctEnFi || 0,
      lastPracticedFiEn: w.lastPracticedFiEn || null,
      lastPracticedEnFi: w.lastPracticedEnFi || null,
      easeFactor: w.easeFactor || 2.5,
      interval: w.interval || 0,
      repetitions: w.repetitions || 0,
      nextReviewDate: w.nextReviewDate || null,
      lastReviewed: w.lastReviewed || null
    })),
    stats: oldData.stats || {
      totalPracticeSessions: 0,
      lastPracticeDate: null
    },
    orphanedEntries: []
  };

  // Remove totalWordsAdded from stats (now tracked in database)
  delete vocabulary.stats.totalWordsAdded;

  // Write new files
  try {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(database, null, 2));
    console.log(`  Created: database.json (${database.words.length} words)`);

    // Rename old file as backup before writing new vocabulary.json
    const backupPath = LEGACY_DATA_FILE + '.backup-premigration';
    fs.renameSync(LEGACY_DATA_FILE, backupPath);
    console.log(`  Backed up: vocabulary.json -> vocabulary.json.backup-premigration`);

    fs.writeFileSync(VOCABULARY_FILE, JSON.stringify(vocabulary, null, 2));
    console.log(`  Created: vocabulary.json (${vocabulary.learningEntries.length} learning entries)`);

    console.log('\nMigration complete!\n');
    return true;
  } catch (error) {
    console.log('Error during migration:', error.message);
    return false;
  }
}

// Run migration if this file is executed directly
if (process.argv[1]?.endsWith('migrate.js')) {
  if (needsMigration()) {
    migrateToSplitDatabase();
  } else {
    console.log('No migration needed.');
  }
}
