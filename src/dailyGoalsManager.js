import {
  loadDailyGoals, saveDailyGoals, getDailyProgressSummary
} from './dailyGoals.js';
import { clearScreen, numberedMenu, pause, chalk, inquirer } from './ui.js';

// Manage daily goals
export async function manageDailyGoals() {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Daily Learning Goals ===\n'));

  const goals = loadDailyGoals();
  const summary = getDailyProgressSummary();

  console.log(chalk.white.bold("Today's Progress:\n"));

  // Words learned progress bar
  const learnBarFilled = Math.floor(summary.learnProgress / 10);
  const learnBar = '█'.repeat(learnBarFilled) + '░'.repeat(10 - learnBarFilled);
  const learnStatus = summary.wordsLearned >= summary.wordsToLearn
    ? chalk.green('✓')
    : chalk.yellow('○');
  console.log(`  ${learnStatus} New words: ${summary.wordsLearned}/${summary.wordsToLearn} [${learnBar}] ${summary.learnProgress}%`);

  // Practice progress bar
  const practiceBarFilled = Math.floor(summary.practiceProgress / 10);
  const practiceBar = '█'.repeat(practiceBarFilled) + '░'.repeat(10 - practiceBarFilled);
  const practiceStatus = summary.wordsPracticed >= summary.wordsToPractice
    ? chalk.green('✓')
    : chalk.yellow('○');
  console.log(`  ${practiceStatus} Practice: ${summary.wordsPracticed}/${summary.wordsToPractice} [${practiceBar}] ${summary.practiceProgress}%`);

  // Accuracy
  const accuracyStatus = summary.accuracy >= summary.targetAccuracy
    ? chalk.green('✓')
    : chalk.yellow('○');
  console.log(`  ${accuracyStatus} Accuracy: ${summary.accuracy}% (target: ${summary.targetAccuracy}%)`);

  // Check if all goals met
  const allGoalsMet =
    summary.wordsLearned >= summary.wordsToLearn &&
    summary.wordsPracticed >= summary.wordsToPractice &&
    summary.accuracy >= summary.targetAccuracy;

  if (allGoalsMet) {
    console.log(chalk.green.bold('\n  * All daily goals achieved! Hienoa! *'));
  }

  console.log('');

  const action = await numberedMenu('Options:', [
    { name: 'Change daily goals', value: 'change' },
    { name: "Reset today's progress", value: 'reset' },
    { name: 'Back to menu', value: 'back' }
  ]);

  if (action === 'change') {
    console.log(chalk.gray('\nSet your daily learning targets:\n'));

    const { wordsToLearn } = await inquirer.prompt([
      {
        type: 'input',
        name: 'wordsToLearn',
        message: 'New words to learn per day:',
        default: goals.goals.wordsToLearn.toString(),
        validate: input => parseInt(input, 10) > 0 ? true : 'Enter a positive number'
      }
    ]);

    const { wordsToPractice } = await inquirer.prompt([
      {
        type: 'input',
        name: 'wordsToPractice',
        message: 'Words to practice per day:',
        default: goals.goals.wordsToPractice.toString(),
        validate: input => parseInt(input, 10) > 0 ? true : 'Enter a positive number'
      }
    ]);

    const { targetAccuracy } = await inquirer.prompt([
      {
        type: 'input',
        name: 'targetAccuracy',
        message: 'Target accuracy percentage:',
        default: goals.goals.targetAccuracy.toString(),
        validate: input => {
          const n = parseInt(input, 10);
          return n >= 0 && n <= 100 ? true : 'Enter 0-100';
        }
      }
    ]);

    goals.goals.wordsToLearn = parseInt(wordsToLearn, 10);
    goals.goals.wordsToPractice = parseInt(wordsToPractice, 10);
    goals.goals.targetAccuracy = parseInt(targetAccuracy, 10);
    saveDailyGoals(goals);

    console.log(chalk.green('\nDaily goals updated!'));
  }

  if (action === 'reset') {
    goals.wordsLearned = 0;
    goals.wordsPracticed = 0;
    goals.correctAnswers = 0;
    saveDailyGoals(goals);
    console.log(chalk.yellow("\nToday's progress has been reset."));
  }

  await pause();
}
