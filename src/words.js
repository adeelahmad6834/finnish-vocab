import { saveData } from './data.js';
import { updateDailyGoalsWordAdded } from './dailyGoals.js';
import { detectCategory } from './categories.js';
import {
  clearScreen, numberedMenu, numberedMultiSelect, displayWordsTable,
  pause, chalk, inquirer
} from './ui.js';

// Add a new word
export async function addWord(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Add New Word ===\n'));

  const { finnish } = await inquirer.prompt([
    {
      type: 'input',
      name: 'finnish',
      message: 'Finnish word:',
      validate: input => input.trim() ? true : 'Please enter a word'
    }
  ]);

  const { english } = await inquirer.prompt([
    {
      type: 'input',
      name: 'english',
      message: 'English meaning:',
      validate: input => input.trim() ? true : 'Please enter the meaning'
    }
  ]);

  // Try to auto-detect category
  const detectedCategory = detectCategory(finnish, english);
  let category;

  if (detectedCategory) {
    console.log(chalk.green(`\n  Auto-detected category: ${chalk.bold(detectedCategory)}`));
    const { useDetected } = await inquirer.prompt([
      { type: 'input', name: 'useDetected', message: `Use "${detectedCategory}"? (Y/n):` }
    ]);
    if (useDetected.toLowerCase() !== 'n') {
      category = detectedCategory;
    }
  }

  // If no category yet, let user select
  if (!category) {
    const categoryChoices = [
      ...data.categories.map(c => ({ name: c, value: c })),
      { name: '+ Add new category', value: '__new__' }
    ];
    category = await numberedMenu('Category:', categoryChoices);
  }

  // Handle new category creation
  if (category === '__new__') {
    const { newCategory } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newCategory',
        message: 'Enter new category name:',
        validate: input => input.trim() ? true : 'Please enter a category name'
      }
    ]);
    category = newCategory.toLowerCase().trim();
    if (!data.categories.includes(category)) {
      data.categories.push(category);
    }
  }

  // Get optional fields
  const { example } = await inquirer.prompt([
    { type: 'input', name: 'example', message: 'Example sentence (optional):' }
  ]);
  const { notes } = await inquirer.prompt([
    { type: 'input', name: 'notes', message: 'Notes (optional):' }
  ]);

  // Check for existing word (handle array fields)
  const exists = data.words.find(w => {
    const finnishVals = Array.isArray(w.finnish) ? w.finnish : [w.finnish];
    return finnishVals.some(f => f.toLowerCase() === finnish.toLowerCase().trim());
  });

  if (exists) {
    console.log(chalk.yellow(`\nWord "${finnish}" already exists!`));
    const { update } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'update',
        message: 'Do you want to update it?',
        default: false
      }
    ]);

    if (update) {
      exists.english = english.trim();
      exists.category = category;
      exists.example = example.trim();
      exists.notes = notes.trim();
      exists.updatedAt = new Date().toISOString();
      saveData(data);
      console.log(chalk.green('\nWord updated successfully!'));
    }
  } else {
    const newWord = {
      id: Date.now(),
      finnish: finnish.trim(),
      english: english.trim(),
      category,
      example: example.trim(),
      notes: notes.trim(),
      mastered: false,
      practiceCount: 0,
      correctCount: 0,
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.words.push(newWord);
    data.stats.totalWordsAdded++;
    saveData(data);
    updateDailyGoalsWordAdded();
    console.log(chalk.green(`\n"${newWord.finnish}" added successfully!`));
  }

  await pause();
}

// List all words
export async function listAllWords(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== All Words ===\n'));
  await displayWordsTable(data.words);
  await pause();
}

// List words by category
export async function listByCategory(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== List by Category ===\n'));

  const categoriesWithCounts = data.categories
    .map(cat => {
      const count = data.words.filter(w => w.category === cat).length;
      return { name: `${cat} (${count} words)`, value: cat, count };
    })
    .filter(c => c.count > 0);

  if (categoriesWithCounts.length === 0) {
    console.log(chalk.yellow('No words added yet.'));
    await pause();
    return;
  }

  const categoryChoices = [
    ...categoriesWithCounts,
    { name: 'Back to menu', value: 'back' }
  ];

  const category = await numberedMenu('Select a category:', categoryChoices);

  if (category === 'back' || category === null) return;

  const words = data.words.filter(w => w.category === category);
  console.log(chalk.cyan.bold(`\n=== ${category.toUpperCase()} ===\n`));
  await displayWordsTable(words, false);
  await pause();
}

// List words alphabetically
export async function listAlphabetically(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Words (Alphabetical) ===\n'));

  const sortBy = await numberedMenu('Sort by:', [
    { name: 'Finnish (A-Z)', value: 'finnish-asc' },
    { name: 'Finnish (Z-A)', value: 'finnish-desc' },
    { name: 'English (A-Z)', value: 'english-asc' },
    { name: 'English (Z-A)', value: 'english-desc' }
  ]);

  if (!sortBy) return;

  const [field, order] = sortBy.split('-');
  const sorted = [...data.words].sort((a, b) => {
    // Handle fields that may be arrays (use first element for sorting)
    const aVal = Array.isArray(a[field]) ? a[field][0] : a[field];
    const bVal = Array.isArray(b[field]) ? b[field][0] : b[field];
    const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
    return order === 'asc' ? comparison : -comparison;
  });

  await displayWordsTable(sorted);
  await pause();
}

// Search words
export async function searchWords(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Search Words ===\n'));

  const { query } = await inquirer.prompt([
    {
      type: 'input',
      name: 'query',
      message: 'Search (Finnish or English):',
      validate: input => input.trim() ? true : 'Please enter a search term'
    }
  ]);

  const searchTerm = query.toLowerCase().trim();
  const results = data.words.filter(w => {
    // Handle finnish field (may be string or array)
    const finnishMatch = Array.isArray(w.finnish)
      ? w.finnish.some(f => f.toLowerCase().includes(searchTerm))
      : w.finnish.toLowerCase().includes(searchTerm);
    // Handle english field (may be string or array)
    const englishMatch = Array.isArray(w.english)
      ? w.english.some(e => e.toLowerCase().includes(searchTerm))
      : w.english.toLowerCase().includes(searchTerm);
    const notesMatch = w.notes.toLowerCase().includes(searchTerm);
    return finnishMatch || englishMatch || notesMatch;
  });

  console.log(chalk.cyan(`\nResults for "${query}":\n`));

  if (results.length === 0) {
    console.log(chalk.yellow('No words found.'));
  } else {
    await displayWordsTable(results);
  }

  await pause();
}

// Edit a word
export async function editWord(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Edit Word ===\n'));

  if (data.words.length === 0) {
    console.log(chalk.yellow('No words to edit.'));
    await pause();
    return;
  }

  const wordChoices = data.words.map(w => {
    const finnish = Array.isArray(w.finnish) ? w.finnish.join(' / ') : w.finnish;
    const english = Array.isArray(w.english) ? w.english.join(' / ') : w.english;
    return {
      name: `${finnish} - ${english} [${w.category}]`,
      value: w
    };
  });

  const word = await numberedMenu('Select a word to edit:', wordChoices);

  if (!word) return;

  // Get display values for defaults (handle arrays)
  const finnishDefault = Array.isArray(word.finnish) ? word.finnish.join(' / ') : word.finnish;
  const englishDefault = Array.isArray(word.english) ? word.english.join(' / ') : word.english;

  const { finnish } = await inquirer.prompt([
    { type: 'input', name: 'finnish', message: 'Finnish word:', default: finnishDefault }
  ]);
  const { english } = await inquirer.prompt([
    { type: 'input', name: 'english', message: 'English meaning:', default: englishDefault }
  ]);

  const categoryChoices = data.categories.map(c => ({ name: c, value: c }));
  const category = await numberedMenu('Category:', categoryChoices);

  const { example } = await inquirer.prompt([
    { type: 'input', name: 'example', message: 'Example sentence:', default: word.example }
  ]);
  const { notes } = await inquirer.prompt([
    { type: 'input', name: 'notes', message: 'Notes:', default: word.notes }
  ]);

  word.finnish = finnish.trim();
  word.english = english.trim();
  word.category = category || word.category;
  word.example = example.trim();
  word.notes = notes.trim();
  word.updatedAt = new Date().toISOString();

  saveData(data);
  console.log(chalk.green('\nWord updated successfully!'));
  await pause();
}

// Delete a word
export async function deleteWord(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Delete Word ===\n'));

  if (data.words.length === 0) {
    console.log(chalk.yellow('No words to delete.'));
    await pause();
    return;
  }

  const wordChoices = data.words.map(w => {
    const finnish = Array.isArray(w.finnish) ? w.finnish.join(' / ') : w.finnish;
    const english = Array.isArray(w.english) ? w.english.join(' / ') : w.english;
    return {
      name: `${finnish} - ${english}`,
      value: w
    };
  });

  const word = await numberedMenu('Select a word to delete:', wordChoices);

  if (!word) return;

  const { confirm } = await inquirer.prompt([
    {
      type: 'input',
      name: 'confirm',
      message: `Type "yes" to delete "${word.finnish}":`
    }
  ]);

  if (confirm.toLowerCase() === 'yes') {
    data.words = data.words.filter(w => w.id !== word.id);
    saveData(data);
    console.log(chalk.green('\nWord deleted successfully!'));
  } else {
    console.log(chalk.gray('\nDeletion cancelled.'));
  }

  await pause();
}

// Mark words as mastered or reset mastery
export async function markAsMastered(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Mastery Management ===\n'));

  const learningWords = data.words.filter(w => !w.mastered);
  const masteredWords = data.words.filter(w => w.mastered);

  console.log(chalk.gray(`Learning: ${learningWords.length} | Mastered: ${masteredWords.length}\n`));

  const actionChoices = [{ name: 'Mark words as mastered', value: 'mark' }];
  if (masteredWords.length > 0) {
    actionChoices.push({ name: 'Reset mastered words (move back to learning)', value: 'reset' });
  }
  actionChoices.push({ name: 'Back to menu', value: 'back' });

  const action = await numberedMenu('What would you like to do?', actionChoices);

  if (action === 'back' || action === null) return;

  if (action === 'mark') {
    if (learningWords.length === 0) {
      console.log(chalk.yellow('\nAll words are already mastered! Great job!'));
      await pause();
      return;
    }

    const wordChoices = learningWords.map(w => {
      const finnish = Array.isArray(w.finnish) ? w.finnish.join(' / ') : w.finnish;
      const english = Array.isArray(w.english) ? w.english.join(' / ') : w.english;
      return {
        name: `${finnish} - ${english}`,
        value: w.id
      };
    });

    const selectedIds = await numberedMultiSelect(
      'Select words to mark as mastered:',
      wordChoices
    );

    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        const word = data.words.find(w => w.id === id);
        if (word) {
          word.mastered = true;
          word.masteredAt = new Date().toISOString();
        }
      });
      saveData(data);
      console.log(chalk.green(`\n${selectedIds.length} word(s) marked as mastered!`));
    }
  }

  if (action === 'reset') {
    const wordChoices = masteredWords.map(w => {
      const finnish = Array.isArray(w.finnish) ? w.finnish.join(' / ') : w.finnish;
      const english = Array.isArray(w.english) ? w.english.join(' / ') : w.english;
      return {
        name: `${finnish} - ${english}`,
        value: w.id
      };
    });

    const selectedIds = await numberedMultiSelect(
      'Select words to reset (move back to learning):',
      wordChoices
    );

    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        const word = data.words.find(w => w.id === id);
        if (word) {
          word.mastered = false;
          word.masteredAt = null;
          word.streakFiEn = 0;
          word.streakEnFi = 0;
        }
      });
      saveData(data);
      console.log(chalk.yellow(`\n${selectedIds.length} word(s) moved back to learning!`));
    }
  }

  await pause();
}
