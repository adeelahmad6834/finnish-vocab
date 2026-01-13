import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { PAGE_SIZE } from './config.js';

// Clear console
export function clearScreen() {
  console.clear();
}

// Display header
export function displayHeader() {
  console.log(chalk.cyan.bold('\n+------------------------------------------+'));
  console.log(chalk.cyan.bold('|') + chalk.white.bold('     Finnish Vocabulary Tracker          ') + chalk.cyan.bold('|'));
  console.log(chalk.cyan.bold('|') + chalk.gray('     Opi suomea - Learn Finnish!         ') + chalk.cyan.bold('|'));
  console.log(chalk.cyan.bold('+------------------------------------------+\n'));
}

// Numbered menu prompt (replaces inquirer list)
export async function numberedMenu(title, choices) {
  console.log(chalk.cyan(title));
  choices.forEach((choice, index) => {
    const name = typeof choice === 'string' ? choice : choice.name;
    console.log(chalk.white(`  [${index + 1}] ${name}`));
  });
  console.log('');

  const { answer } = await inquirer.prompt([
    {
      type: 'input',
      name: 'answer',
      message: `Enter choice (1-${choices.length}):`
    }
  ]);

  const idx = parseInt(answer.trim(), 10) - 1;
  if (idx >= 0 && idx < choices.length) {
    const choice = choices[idx];
    return typeof choice === 'string' ? choice : choice.value;
  }
  return null;
}

// Multi-select prompt (replaces inquirer checkbox)
export async function numberedMultiSelect(title, choices) {
  console.log(chalk.cyan(title));
  choices.forEach((choice, index) => {
    const name = typeof choice === 'string' ? choice : choice.name;
    console.log(chalk.white(`  [${index + 1}] ${name}`));
  });
  console.log('');

  const { answer } = await inquirer.prompt([
    {
      type: 'input',
      name: 'answer',
      message: 'Enter numbers separated by commas (e.g., 1,3,5) or "all":'
    }
  ]);

  const input = answer.trim().toLowerCase();
  if (input === 'all') {
    return choices.map(c => typeof c === 'string' ? c : c.value);
  }

  const indices = input.split(',').map(s => parseInt(s.trim(), 10) - 1);
  const selected = [];
  indices.forEach(idx => {
    if (idx >= 0 && idx < choices.length) {
      const choice = choices[idx];
      selected.push(typeof choice === 'string' ? choice : choice.value);
    }
  });
  return selected;
}

// Pause for user
export async function pause() {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: chalk.gray('Press Enter to continue...')
    }
  ]);
}

// Helper to format field (may be string or array) for display
function formatField(value) {
  return Array.isArray(value) ? value.join(' / ') : value;
}

// Display words in a table (single page)
export function displayWordsTablePage(words, showCategory = true, startIndex = 0) {
  if (words.length === 0) {
    console.log(chalk.yellow('\nNo words found.'));
    return;
  }

  const headers = ['#', 'Finnish', 'English'];
  if (showCategory) headers.push('Category');
  headers.push('Status');

  const table = new Table({
    head: headers.map(h => chalk.cyan(h)),
    colWidths: showCategory ? [5, 22, 26, 16, 8] : [5, 24, 32, 8]
  });

  words.forEach((word, index) => {
    const status = word.mastered ? chalk.green('M') : chalk.yellow('L');
    const finnishDisplay = formatField(word.finnish);
    const englishDisplay = formatField(word.english);
    const row = [startIndex + index + 1, finnishDisplay, englishDisplay];
    if (showCategory) row.push(word.category);
    row.push(status);
    table.push(row);
  });

  console.log(table.toString());
}

// Display words with pagination
export async function displayWordsTable(words, showCategory = true) {
  if (words.length === 0) {
    console.log(chalk.yellow('\nNo words found.'));
    return;
  }

  if (words.length <= PAGE_SIZE) {
    displayWordsTablePage(words, showCategory, 0);
    console.log(chalk.gray(`\nTotal: ${words.length} words | M=Mastered, L=Learning`));
    return;
  }

  let currentPage = 0;
  const totalPages = Math.ceil(words.length / PAGE_SIZE);

  while (true) {
    clearScreen();
    const start = currentPage * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, words.length);
    const pageWords = words.slice(start, end);

    console.log(chalk.cyan.bold(`\n=== Words (Page ${currentPage + 1}/${totalPages}) ===\n`));
    displayWordsTablePage(pageWords, showCategory, start);
    console.log(chalk.gray(`\nShowing ${start + 1}-${end} of ${words.length} words | M=Mastered, L=Learning`));

    const navChoices = [];
    if (currentPage > 0) navChoices.push({ name: 'Previous page', value: 'prev' });
    if (currentPage < totalPages - 1) navChoices.push({ name: 'Next page', value: 'next' });
    navChoices.push({ name: 'Go to page...', value: 'goto' });
    navChoices.push({ name: 'Back to menu', value: 'back' });

    const action = await numberedMenu('Navigation:', navChoices);

    if (action === 'prev') {
      currentPage--;
    } else if (action === 'next') {
      currentPage++;
    } else if (action === 'goto') {
      const { pageNum } = await inquirer.prompt([
        {
          type: 'input',
          name: 'pageNum',
          message: `Enter page number (1-${totalPages}):`
        }
      ]);
      const num = parseInt(pageNum, 10);
      if (num >= 1 && num <= totalPages) {
        currentPage = num - 1;
      }
    } else {
      break;
    }
  }
}

// Shuffle array
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Re-export chalk and inquirer for use in other modules
export { chalk, inquirer, Table };
