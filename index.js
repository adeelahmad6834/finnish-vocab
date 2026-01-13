#!/usr/bin/env node

// Main application entry point
// This file handles the main menu and routes to feature modules

import { loadMergedData, getQuickStats } from './src/data.js';
import { needsMigration, migrateToSplitDatabase } from './src/migrate.js';
import { getReviewStats } from './src/sm2.js';
import { getDailyProgressSummary } from './src/dailyGoals.js';
import { clearScreen, displayHeader, pause, chalk, inquirer } from './src/ui.js';
import { createBackup } from './src/backup.js';

// Feature modules
import { practiceMode } from './src/practice.js';
import {
  addWord, browseDatabase, listAllWords, listByCategory, listAlphabetically,
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
  const learningWords = data.words.filter(w => w.isLearning);
  const reviewStats = getReviewStats(learningWords);

  console.log(chalk.gray(`Database: ${stats.totalInDatabase} | Learning: ${stats.totalLearning} | Mastered: ${stats.mastered}`));

  // Review status (only for learning words)
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
  console.log(chalk.white('  [2]  Browse database'));
  console.log(chalk.white('  [3]  My learning words'));
  console.log(chalk.white('  [4]  List by category'));
  console.log(chalk.white('  [5]  List alphabetically'));
  console.log(chalk.white('  [6]  Search words'));
  console.log(chalk.white('  [7]  Edit a word'));
  console.log(chalk.white('  [8]  Delete a word'));
  console.log(chalk.white('  [9]  Mark as mastered'));
  console.log(chalk.white('  [10] Practice mode'));
  console.log(chalk.white('  [11] View statistics'));
  console.log(chalk.white('  [12] Manage categories'));
  console.log(chalk.white('  [13] Daily goals'));
  console.log(chalk.white('  [14] Export to CSV'));
  console.log(chalk.white('  [15] Import from CSV'));
  console.log(chalk.white('  [0]  Exit'));
  console.log('');

  const { choice } = await inquirer.prompt([
    { type: 'input', name: 'choice', message: 'Enter your choice (0-15):' }
  ]);

  const menuMap = {
    '1': 'add',
    '2': 'browse',
    '3': 'listAll',
    '4': 'listCategory',
    '5': 'listAlpha',
    '6': 'search',
    '7': 'edit',
    '8': 'delete',
    '9': 'master',
    '10': 'practice',
    '11': 'stats',
    '12': 'categories',
    '13': 'dailyGoals',
    '14': 'export',
    '15': 'import',
    '0': 'exit'
  };

  return menuMap[choice.trim()] || 'invalid';
}

// Main application loop
async function main() {
  // Check for and run migration if needed
  if (needsMigration()) {
    console.log(chalk.yellow('\nDetected old data format. Running migration...'));
    const migrated = migrateToSplitDatabase();
    if (!migrated) {
      console.log(chalk.red('Migration failed. Please check your data files.'));
      process.exit(1);
    }
  }

  // Create backup on startup
  console.log(chalk.gray('Creating startup backup...'));
  createBackup('startup');

  let data = loadMergedData();

  // Check for orphaned entries
  if (data.orphanedEntries.length > 0) {
    console.log(chalk.yellow(`\nNote: ${data.orphanedEntries.length} words in your learning list no longer exist in the database.`));
    console.log(chalk.gray('These words may have been removed from the shared database.'));
    await pause();
  }

  while (true) {
    clearScreen();
    const choice = await mainMenu(data);

    switch (choice) {
      case 'add':
        await addWord(data);
        break;
      case 'browse':
        await browseDatabase(data);
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
        console.log(chalk.yellow('\nInvalid choice. Please enter a number 0-15.'));
        await pause();
    }

    // Reload data after each operation
    data = loadMergedData();
  }
}

// Start the application
main().catch(err => {
  console.error(chalk.red('An error occurred:'), err.message);
  process.exit(1);
});
