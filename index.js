#!/usr/bin/env node

// Main application entry point
// This file handles the main menu and routes to feature modules

import { loadData, getQuickStats } from './src/data.js';
import { getReviewStats } from './src/sm2.js';
import { getDailyProgressSummary } from './src/dailyGoals.js';
import { clearScreen, displayHeader, pause, chalk, inquirer } from './src/ui.js';
import { createBackup } from './src/backup.js';

// Feature modules
import { practiceMode } from './src/practice.js';
import {
  addWord, listAllWords, listByCategory, listAlphabetically,
  searchWords, editWord, deleteWord, markAsMastered
} from './src/words.js';
import { viewStatistics } from './src/statistics.js';
import { manageCategories } from './src/categoryManager.js';
import { manageDailyGoals } from './src/dailyGoalsManager.js';
import { exportToCSV, importFromCSV } from './src/csvManager.js';

// Main menu display and input
async function mainMenu(data) {
  displayHeader();

  // Quick stats summary
  const stats = getQuickStats(data);
  const reviewStats = getReviewStats(data.words);

  console.log(chalk.gray(`Total words: ${stats.total} | Mastered: ${stats.mastered} | Learning: ${stats.learning}`));

  // Review status
  if (reviewStats.dueNow > 0) {
    console.log(
      chalk.yellow(`Reviews due: ${reviewStats.dueNow} now`) +
      (reviewStats.dueToday > 0 ? chalk.gray(` | ${reviewStats.dueToday} later today`) : '') +
      (reviewStats.dueThisWeek > 0 ? chalk.gray(` | ${reviewStats.dueThisWeek} this week`) : '')
    );
  } else {
    console.log(
      chalk.green('No reviews due now') +
      (reviewStats.dueToday > 0 ? chalk.gray(` | ${reviewStats.dueToday} later today`) : '') +
      (reviewStats.dueThisWeek > 0 ? chalk.gray(` | ${reviewStats.dueThisWeek} this week`) : '')
    );
  }

  // Daily progress summary
  const dailyProgress = getDailyProgressSummary();
  const learnIcon = dailyProgress.wordsLearned >= dailyProgress.wordsToLearn
    ? chalk.green('✓')
    : chalk.yellow('○');
  const practiceIcon = dailyProgress.wordsPracticed >= dailyProgress.wordsToPractice
    ? chalk.green('✓')
    : chalk.yellow('○');
  console.log(chalk.gray(
    `Daily: ${learnIcon} ${dailyProgress.wordsLearned}/${dailyProgress.wordsToLearn} new | ` +
    `${practiceIcon} ${dailyProgress.wordsPracticed}/${dailyProgress.wordsToPractice} practiced\n`
  ));

  // Menu options
  console.log(chalk.white('  [1]  Add new word'));
  console.log(chalk.white('  [2]  List all words'));
  console.log(chalk.white('  [3]  List by category'));
  console.log(chalk.white('  [4]  List alphabetically'));
  console.log(chalk.white('  [5]  Search words'));
  console.log(chalk.white('  [6]  Edit a word'));
  console.log(chalk.white('  [7]  Delete a word'));
  console.log(chalk.white('  [8]  Mark as mastered'));
  console.log(chalk.white('  [9]  Practice mode'));
  console.log(chalk.white('  [10] View statistics'));
  console.log(chalk.white('  [11] Manage categories'));
  console.log(chalk.white('  [12] Daily goals'));
  console.log(chalk.white('  [13] Export to CSV'));
  console.log(chalk.white('  [14] Import from CSV'));
  console.log(chalk.white('  [0]  Exit'));
  console.log('');

  const { choice } = await inquirer.prompt([
    { type: 'input', name: 'choice', message: 'Enter your choice (0-14):' }
  ]);

  const menuMap = {
    '1': 'add',
    '2': 'listAll',
    '3': 'listCategory',
    '4': 'listAlpha',
    '5': 'search',
    '6': 'edit',
    '7': 'delete',
    '8': 'master',
    '9': 'practice',
    '10': 'stats',
    '11': 'categories',
    '12': 'dailyGoals',
    '13': 'export',
    '14': 'import',
    '0': 'exit'
  };

  return menuMap[choice.trim()] || 'invalid';
}

// Main application loop
async function main() {
  // Create backup on startup
  console.log(chalk.gray('Creating startup backup...'));
  createBackup('startup');

  let data = loadData();

  while (true) {
    clearScreen();
    const choice = await mainMenu(data);

    switch (choice) {
      case 'add':
        await addWord(data);
        break;
      case 'listAll':
        await listAllWords(data);
        break;
      case 'listCategory':
        await listByCategory(data);
        break;
      case 'listAlpha':
        await listAlphabetically(data);
        break;
      case 'search':
        await searchWords(data);
        break;
      case 'edit':
        await editWord(data);
        break;
      case 'delete':
        await deleteWord(data);
        break;
      case 'master':
        await markAsMastered(data);
        break;
      case 'practice':
        await practiceMode(data);
        break;
      case 'stats':
        await viewStatistics(data);
        break;
      case 'categories':
        await manageCategories(data);
        break;
      case 'dailyGoals':
        await manageDailyGoals();
        break;
      case 'export':
        await exportToCSV(data);
        break;
      case 'import':
        await importFromCSV(data);
        break;
      case 'exit':
        // Create backup on exit
        console.log(chalk.gray('\nCreating exit backup...'));
        createBackup('exit');
        console.log(chalk.cyan('\nNakemiin! (Goodbye!)\n'));
        process.exit(0);
      default:
        console.log(chalk.yellow('\nInvalid choice. Please enter a number 0-14.'));
        await pause();
    }

    // Reload data after each operation
    data = loadData();
  }
}

// Start the application
main().catch(err => {
  console.error(chalk.red('An error occurred:'), err.message);
  process.exit(1);
});
