import { getWordsForPractice, saveData } from './data.js';
import {
  calculateQuality, calculateSM2Review, getWordsDueForReview,
  formatNextReview, updateWordStats, getWordPriority
} from './sm2.js';
import { updateDailyGoalsPractice } from './dailyGoals.js';
import {
  clearScreen, numberedMenu, shuffleArray, pause, chalk, inquirer
} from './ui.js';

// Practice mode - main function
export async function practiceMode(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Practice Mode ===\n'));

  const unmasteredCount = data.words.filter(w => !w.mastered).length;
  const masteredCount = data.words.filter(w => w.mastered).length;
  const dueForReview = getWordsDueForReview(data.words, false);

  console.log(chalk.gray(`Words to learn: ${unmasteredCount} | Mastered: ${masteredCount}`));
  if (dueForReview.length > 0) {
    console.log(chalk.yellow(`Due for review (SM-2): ${dueForReview.length} words\n`));
  } else {
    console.log(chalk.green(`All caught up on reviews!\n`));
  }

  if (data.words.length === 0) {
    console.log(chalk.yellow('No words to practice. Add some words first!'));
    await pause();
    return;
  }

  if (unmasteredCount === 0) {
    console.log(chalk.green('All words mastered! You can:'));
    console.log(chalk.gray('  - Add new words to continue learning'));
    console.log(chalk.gray('  - Practice mastered words to keep them fresh\n'));
  }

  const modeChoices = [];
  if (dueForReview.length > 0) {
    modeChoices.push({ name: `Due for Review - SM-2 (${dueForReview.length} words)`, value: 'sm2-review' });
  }
  modeChoices.push(
    { name: 'Smart Practice (prioritizes weak words)', value: 'smart' },
    { name: 'Finnish -> English', value: 'fi-en' },
    { name: 'English -> Finnish', value: 'en-fi' },
    { name: 'Mixed (both directions)', value: 'mixed' }
  );
  if (masteredCount > 0) {
    modeChoices.push({ name: 'Review mastered words', value: 'review' });
  }
  modeChoices.push({ name: 'Back to menu', value: 'back' });

  const mode = await numberedMenu('Select practice type:', modeChoices);
  if (mode === 'back' || mode === null) return;

  const includeMastered = mode === 'review';
  let wordsToUse = mode === 'sm2-review'
    ? dueForReview
    : getWordsForPractice(data.words, includeMastered);

  if (wordsToUse.length === 0) {
    console.log(chalk.yellow('\nNo words available for this mode.'));
    await pause();
    return;
  }

  // Select word count
  const maxWords = wordsToUse.length;
  const countChoices = [];
  if (maxWords >= 5) countChoices.push({ name: '5 words', value: 5 });
  if (maxWords >= 10) countChoices.push({ name: '10 words', value: 10 });
  if (maxWords >= 20) countChoices.push({ name: '20 words', value: 20 });
  countChoices.push({ name: `All ${maxWords} words`, value: maxWords });

  const count = await numberedMenu('How many words?', countChoices);
  if (!count) return;

  // Sort/shuffle words based on mode
  if (mode === 'smart') {
    wordsToUse.sort((a, b) => getWordPriority(b) - getWordPriority(a));
  } else if (mode !== 'sm2-review') {
    wordsToUse = shuffleArray(wordsToUse);
  }
  wordsToUse = wordsToUse.slice(0, count);

  // Run practice session
  const result = await runPracticeSession(wordsToUse, mode);

  // Update stats
  data.stats.totalPracticeSessions++;
  data.stats.lastPracticeDate = new Date().toISOString();
  saveData(data);
  updateDailyGoalsPractice(result.total, result.correct);

  // Display results
  displayPracticeResults(result, data);

  await pause();
}

// Run a practice session with given words
async function runPracticeSession(words, mode) {
  let correct = 0;
  const total = words.length;
  const newlyMastered = [];

  console.log(chalk.cyan(`\nStarting practice with ${total} words...\n`));
  console.log(chalk.gray('Type your answer and press Enter. Type "quit" to exit.\n'));

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const direction = getDirection(word, mode);
    const result = await askQuestion(word, direction, i + 1, total);

    if (result.quit) {
      console.log(chalk.gray('\nPractice ended early.'));
      break;
    }

    if (result.correct) {
      correct++;
      if (result.masteryStatus === 'newly_mastered') {
        newlyMastered.push(word);
      }
    }
  }

  return { correct, total, newlyMastered };
}

// Determine practice direction for a word
function getDirection(word, mode) {
  if (mode === 'fi-en') return 'fi-en';
  if (mode === 'en-fi') return 'en-fi';
  if (mode === 'mixed' || mode === 'review') {
    return Math.random() > 0.5 ? 'fi-en' : 'en-fi';
  }

  // Smart/SM2 mode: prioritize weaker direction
  const fiEnStreak = word.streakFiEn || 0;
  const enFiStreak = word.streakEnFi || 0;
  let direction = fiEnStreak <= enFiStreak ? 'fi-en' : 'en-fi';

  // Add some randomness (30% chance to flip)
  if (Math.random() > 0.7) {
    direction = direction === 'fi-en' ? 'en-fi' : 'fi-en';
  }

  return direction;
}

// Helper to normalize field to array
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

// Helper to get display string for a field (may be string or array)
function getDisplayString(value) {
  return Array.isArray(value) ? value[0] : value;
}

// Helper to check if user answer matches any of the valid answers
function checkAnswer(userAnswer, validAnswers) {
  const normalized = userAnswer.toLowerCase().trim();
  const answers = toArray(validAnswers);
  return answers.some(ans => ans.toLowerCase() === normalized);
}

// Ask a single question and process the answer
async function askQuestion(word, direction, current, total) {
  const questionField = direction === 'fi-en' ? word.finnish : word.english;
  const answerField = direction === 'fi-en' ? word.english : word.finnish;
  const question = getDisplayString(questionField);
  const dirLabel = direction === 'fi-en' ? 'FI->EN' : 'EN->FI';

  const { userAnswer } = await inquirer.prompt([
    {
      type: 'input',
      name: 'userAnswer',
      message: `(${current}/${total}) [${dirLabel}] ${chalk.yellow(question)} ->`
    }
  ]);

  if (userAnswer.toLowerCase() === 'quit') {
    return { quit: true };
  }

  const isCorrect = checkAnswer(userAnswer, answerField);
  const masteryStatus = updateWordStats(word, direction, isCorrect);

  // Calculate SM-2 review scheduling
  const streakBefore = direction === 'fi-en'
    ? (word.streakFiEn || 0) - (isCorrect ? 1 : 0)
    : (word.streakEnFi || 0) - (isCorrect ? 1 : 0);
  const quality = calculateQuality(isCorrect, Math.max(0, streakBefore));
  const sm2Result = calculateSM2Review(word, quality);

  // Get display string for correct answer (show all options if array)
  const correctAnswerDisplay = Array.isArray(answerField)
    ? answerField.join(' / ')
    : answerField;

  // Display feedback
  displayFeedback(word, direction, isCorrect, masteryStatus, sm2Result, correctAnswerDisplay);

  return { correct: isCorrect, masteryStatus };
}

// Display feedback after each answer
function displayFeedback(word, direction, isCorrect, masteryStatus, sm2Result, correctAnswer) {
  if (isCorrect) {
    if (masteryStatus === 'newly_mastered') {
      console.log(chalk.green('  Correct!') + chalk.magenta.bold(' * MASTERED! *'));
    } else {
      const streak = direction === 'fi-en' ? word.streakFiEn : word.streakEnFi;
      const streakInfo = streak > 1 ? chalk.gray(` (streak: ${streak})`) : '';
      console.log(chalk.green('  Correct!') + streakInfo);
    }
    console.log(chalk.gray(`    Next review: ${formatNextReview(sm2Result.interval)}\n`));
  } else {
    console.log(chalk.red(`  Incorrect. The answer was: ${chalk.yellow(correctAnswer)}`));
    console.log(chalk.gray(`    Review again: ${formatNextReview(sm2Result.interval)}\n`));
  }
}

// Display final practice results
function displayPracticeResults(result, data) {
  const { correct, total, newlyMastered } = result;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  console.log(chalk.cyan('\n========================================='));
  console.log(chalk.white.bold('Practice Complete!'));
  console.log(chalk.cyan('========================================='));
  console.log(`Score: ${correct}/${total} (${percentage}%)`);

  if (newlyMastered.length > 0) {
    console.log(chalk.magenta.bold(`\n* Newly Mastered (${newlyMastered.length}):`));
    newlyMastered.forEach(w => {
      console.log(chalk.magenta(`  - ${w.finnish} (${w.english})`));
    });
  }

  const remainingToLearn = data.words.filter(w => !w.mastered).length;
  if (remainingToLearn > 0) {
    console.log(chalk.gray(`\nWords still learning: ${remainingToLearn}`));
  } else {
    console.log(chalk.green.bold('\n* All words mastered! Add new words to continue learning.'));
  }

  // Encouraging message based on score
  if (percentage >= 90) {
    console.log(chalk.green('\nErinomaista! (Excellent!)'));
  } else if (percentage >= 70) {
    console.log(chalk.yellow('\nHyvaa tyota! (Good job!)'));
  } else {
    console.log(chalk.gray('\nJatka harjoittelua! (Keep practicing!)'));
  }
}
