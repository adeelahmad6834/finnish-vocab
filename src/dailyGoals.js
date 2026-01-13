import fs from 'fs';
import { DAILY_GOALS_FILE } from './config.js';

// Load daily goals data
export function loadDailyGoals() {
  try {
    if (fs.existsSync(DAILY_GOALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(DAILY_GOALS_FILE, 'utf-8'));
      const today = new Date().toDateString();
      if (data.lastDate !== today) {
        data.lastDate = today;
        data.wordsLearned = 0;
        data.wordsPracticed = 0;
        data.correctAnswers = 0;
        saveDailyGoals(data);
      }
      return data;
    }
  } catch (error) {
    // Ignore errors, return default
  }
  return {
    lastDate: new Date().toDateString(),
    goals: {
      wordsToLearn: 3,
      wordsToPractice: 10,
      targetAccuracy: 80
    },
    wordsLearned: 0,
    wordsPracticed: 0,
    correctAnswers: 0
  };
}

// Save daily goals data
export function saveDailyGoals(data) {
  fs.writeFileSync(DAILY_GOALS_FILE, JSON.stringify(data, null, 2));
}

// Update daily progress after adding a word
export function updateDailyGoalsWordAdded() {
  const goals = loadDailyGoals();
  goals.wordsLearned++;
  saveDailyGoals(goals);
}

// Update daily progress after practice
export function updateDailyGoalsPractice(wordsPracticed, correctCount) {
  const goals = loadDailyGoals();
  goals.wordsPracticed += wordsPracticed;
  goals.correctAnswers += correctCount;
  saveDailyGoals(goals);
}

// Get daily progress summary
export function getDailyProgressSummary() {
  const goals = loadDailyGoals();
  const learnProgress = Math.min(100, Math.round((goals.wordsLearned / goals.goals.wordsToLearn) * 100));
  const practiceProgress = Math.min(100, Math.round((goals.wordsPracticed / goals.goals.wordsToPractice) * 100));
  const accuracy = goals.wordsPracticed > 0 ? Math.round((goals.correctAnswers / goals.wordsPracticed) * 100) : 0;

  return {
    wordsLearned: goals.wordsLearned,
    wordsToLearn: goals.goals.wordsToLearn,
    learnProgress,
    wordsPracticed: goals.wordsPracticed,
    wordsToPractice: goals.goals.wordsToPractice,
    practiceProgress,
    accuracy,
    targetAccuracy: goals.goals.targetAccuracy
  };
}
