import { SM2_CONFIG, MASTERY_CONFIG } from './config.js';

// Initialize SM-2 fields for a word if not present
export function initializeSM2Fields(word) {
  if (word.easeFactor === undefined) word.easeFactor = SM2_CONFIG.defaultEaseFactor;
  if (word.interval === undefined) word.interval = 0;
  if (word.repetitions === undefined) word.repetitions = 0;
  if (word.nextReviewDate === undefined) word.nextReviewDate = new Date().toISOString();
}

// Calculate quality score (0-5) based on answer correctness
export function calculateQuality(isCorrect, streakInDirection) {
  if (!isCorrect) {
    return streakInDirection > 0 ? 1 : 0;
  }
  if (streakInDirection >= 3) return 5;
  if (streakInDirection >= 2) return 4;
  return 3;
}

// SM-2 Algorithm: Calculate next review based on quality
export function calculateSM2Review(word, quality) {
  initializeSM2Fields(word);

  let { easeFactor, interval, repetitions } = word;

  if (quality < 3) {
    repetitions = 0;
    interval = SM2_CONFIG.initialIntervals[0];
  } else {
    if (repetitions === 0) {
      interval = SM2_CONFIG.initialIntervals[0];
    } else if (repetitions === 1) {
      interval = SM2_CONFIG.initialIntervals[1];
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  easeFactor = Math.max(SM2_CONFIG.minEaseFactor, easeFactor);

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  word.easeFactor = easeFactor;
  word.interval = interval;
  word.repetitions = repetitions;
  word.nextReviewDate = nextReview.toISOString();
  word.lastReviewed = new Date().toISOString();

  return { interval, easeFactor, nextReviewDate: nextReview };
}

// Check if a word is due for review
export function isWordDueForReview(word) {
  if (!word.nextReviewDate) return true;
  return new Date() >= new Date(word.nextReviewDate);
}

// Get words due for review, sorted by urgency
export function getWordsDueForReview(words, includeMastered = false) {
  const now = new Date();

  return words
    .filter(w => {
      if (!includeMastered && w.mastered) return false;
      return isWordDueForReview(w);
    })
    .map(w => {
      const reviewDate = w.nextReviewDate ? new Date(w.nextReviewDate) : new Date(0);
      const overdueDays = (now - reviewDate) / (1000 * 60 * 60 * 24);
      return { word: w, overdueDays };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays)
    .map(item => item.word);
}

// Format next review interval for display
export function formatNextReview(intervalDays) {
  if (intervalDays === 0) return 'today';
  if (intervalDays === 1) return 'tomorrow';
  if (intervalDays < 7) return `in ${intervalDays} days`;
  if (intervalDays < 14) return 'in 1 week';
  if (intervalDays < 30) return `in ${Math.round(intervalDays / 7)} weeks`;
  if (intervalDays < 60) return 'in 1 month';
  return `in ${Math.round(intervalDays / 30)} months`;
}

// Get review statistics
export function getReviewStats(words) {
  const now = new Date();
  let dueNow = 0;
  let dueToday = 0;
  let dueThisWeek = 0;

  words.forEach(w => {
    if (w.mastered) return;
    if (!w.nextReviewDate) {
      dueNow++;
      return;
    }

    const reviewDate = new Date(w.nextReviewDate);
    const daysUntil = (reviewDate - now) / (1000 * 60 * 60 * 24);

    if (daysUntil <= 0) dueNow++;
    else if (daysUntil <= 1) dueToday++;
    else if (daysUntil <= 7) dueThisWeek++;
  });

  return { dueNow, dueToday, dueThisWeek };
}

// Check if word should be auto-mastered based on performance
export function checkAutoMastery(word) {
  const fiEnStreak = word.streakFiEn || 0;
  const enFiStreak = word.streakEnFi || 0;

  if (fiEnStreak >= MASTERY_CONFIG.streakRequired && enFiStreak >= MASTERY_CONFIG.streakRequired) {
    return true;
  }

  const fiEnAttempts = word.attemptsFiEn || 0;
  const enFiAttempts = word.attemptsEnFi || 0;
  const fiEnCorrect = word.correctFiEn || 0;
  const enFiCorrect = word.correctEnFi || 0;

  if (fiEnAttempts >= MASTERY_CONFIG.minAttempts && enFiAttempts >= MASTERY_CONFIG.minAttempts) {
    const fiEnAccuracy = fiEnCorrect / fiEnAttempts;
    const enFiAccuracy = enFiCorrect / enFiAttempts;
    if (fiEnAccuracy >= MASTERY_CONFIG.accuracyThreshold && enFiAccuracy >= MASTERY_CONFIG.accuracyThreshold) {
      return true;
    }
  }

  return false;
}

// Update word stats after practice
export function updateWordStats(word, direction, isCorrect) {
  // Initialize tracking fields if not present
  if (word.streakFiEn === undefined) word.streakFiEn = 0;
  if (word.streakEnFi === undefined) word.streakEnFi = 0;
  if (word.attemptsFiEn === undefined) word.attemptsFiEn = 0;
  if (word.attemptsEnFi === undefined) word.attemptsEnFi = 0;
  if (word.correctFiEn === undefined) word.correctFiEn = 0;
  if (word.correctEnFi === undefined) word.correctEnFi = 0;

  if (direction === 'fi-en') {
    word.attemptsFiEn++;
    if (isCorrect) {
      word.correctFiEn++;
      word.streakFiEn++;
    } else {
      word.streakFiEn = 0;
    }
    word.lastPracticedFiEn = new Date().toISOString();
  } else {
    word.attemptsEnFi++;
    if (isCorrect) {
      word.correctEnFi++;
      word.streakEnFi++;
    } else {
      word.streakEnFi = 0;
    }
    word.lastPracticedEnFi = new Date().toISOString();
  }

  word.practiceCount = (word.practiceCount || 0) + 1;
  if (isCorrect) {
    word.correctCount = (word.correctCount || 0) + 1;
  }

  const wasMastered = word.mastered;
  if (!word.mastered && checkAutoMastery(word)) {
    word.mastered = true;
    word.masteredAt = new Date().toISOString();
    return 'newly_mastered';
  }

  return wasMastered ? 'already_mastered' : 'learning';
}

// Calculate word priority for spaced repetition
export function getWordPriority(word) {
  const now = Date.now();
  const lastFiEn = word.lastPracticedFiEn ? new Date(word.lastPracticedFiEn).getTime() : 0;
  const lastEnFi = word.lastPracticedEnFi ? new Date(word.lastPracticedEnFi).getTime() : 0;
  const lastPracticed = Math.max(lastFiEn, lastEnFi);

  const daysSince = lastPracticed ? (now - lastPracticed) / (1000 * 60 * 60 * 24) : 999;
  const totalAttempts = (word.attemptsFiEn || 0) + (word.attemptsEnFi || 0);
  const totalCorrect = (word.correctFiEn || 0) + (word.correctEnFi || 0);
  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0.5;

  return daysSince * (1.5 - accuracy);
}
