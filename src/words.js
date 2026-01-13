import {
  saveData, saveDatabase, saveVocabulary, addToLearning, removeFromLearning,
  findLearningEntry, updateLearningEntry
} from './data.js';
import { updateDailyGoalsWordAdded } from './dailyGoals.js';
import { detectCategory } from './categories.js';
import {
  clearScreen, numberedMenu, numberedMultiSelect, displayWordsTable,
  pause, chalk, inquirer
} from './ui.js';

// Helper to get display string for a field (may be string or array)
function formatField(value) {
  return Array.isArray(value) ? value.join(' / ') : value;
}

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

  // Check if word exists in database
  const existsInDb = data._database.words.find(w => {
    const finnishVals = Array.isArray(w.finnish) ? w.finnish : [w.finnish];
    return finnishVals.some(f => f.toLowerCase() === finnish.toLowerCase().trim());
  });

  if (existsInDb) {
    // Word exists in database
    const isLearning = data._vocabulary.learningEntries.some(e => e.wordId === existsInDb.id);

    if (isLearning) {
      console.log(chalk.yellow(`\nYou're already learning "${finnish}"!`));
      const { update } = await inquirer.prompt([
        { type: 'input', name: 'update', message: 'Update the definition? (y/N):' }
      ]);

      if (update.toLowerCase() === 'y') {
        existsInDb.english = english.trim();
        existsInDb.updatedAt = new Date().toISOString();
        saveDatabase(data._database);
        console.log(chalk.green('\nDefinition updated!'));
      }
    } else {
      console.log(chalk.yellow(`\n"${finnish}" exists in database but you're not learning it.`));
      const { startLearning } = await inquirer.prompt([
        { type: 'input', name: 'startLearning', message: 'Start learning this word? (Y/n):' }
      ]);

      if (startLearning.toLowerCase() !== 'n') {
        addToLearning(data, existsInDb.id);
        console.log(chalk.green(`\nAdded "${finnish}" to your learning list!`));
      }
    }
    await pause();
    return;
  }

  // New word - proceed with full creation
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
    if (!data._database.categories.includes(category)) {
      data._database.categories.push(category);
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

  // Create new word in database
  const newWord = {
    id: Date.now(),
    finnish: finnish.trim(),
    english: english.trim(),
    category,
    example: example.trim(),
    notes: notes.trim(),
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  data._database.words.push(newWord);
  saveDatabase(data._database);

  // Add to merged words list
  data.words.push({
    ...newWord,
    isLearning: false,
    mastered: false,
    practiceCount: 0,
    correctCount: 0
  });

  // Auto-add to learning
  addToLearning(data, newWord.id);

  updateDailyGoalsWordAdded();
  console.log(chalk.green(`\n"${newWord.finnish}" added to database and your learning list!`));

  await pause();
}

// Browse database - view all words and add to learning
export async function browseDatabase(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Browse Word Database ===\n'));

  const dbWords = data._database.words;

  if (dbWords.length === 0) {
    console.log(chalk.yellow('No words in database yet.'));
    await pause();
    return;
  }

  // Enrich with learning status
  const enrichedWords = dbWords.map(w => {
    const isLearning = data._vocabulary.learningEntries.some(e => e.wordId === w.id);
    const entry = data._vocabulary.learningEntries.find(e => e.wordId === w.id);
    return {
      ...w,
      isLearning,
      mastered: entry?.mastered || false,
      practiceCount: entry?.practiceCount || 0,
      correctCount: entry?.correctCount || 0
    };
  });

  const learningCount = enrichedWords.filter(w => w.isLearning).length;
  const notLearningCount = enrichedWords.filter(w => !w.isLearning).length;

  console.log(chalk.gray(`Total: ${dbWords.length} | Learning: ${learningCount} | Not started: ${notLearningCount}\n`));

  const action = await numberedMenu('What to view?', [
    { name: `All words (${dbWords.length})`, value: 'all' },
    { name: `Words I'm learning (${learningCount})`, value: 'learning' },
    { name: `Words not started (${notLearningCount})`, value: 'not_learning' },
    { name: 'Add words to learning list', value: 'add' },
    { name: 'Back', value: 'back' }
  ]);

  if (action === 'back' || !action) return;

  if (action === 'all') {
    await displayWordsTable(enrichedWords);
  } else if (action === 'learning') {
    const learningWords = enrichedWords.filter(w => w.isLearning);
    await displayWordsTable(learningWords);
  } else if (action === 'not_learning') {
    const notLearning = enrichedWords.filter(w => !w.isLearning);
    if (notLearning.length === 0) {
      console.log(chalk.green('\nYou\'re learning all words in the database!'));
    } else {
      await displayWordsTable(notLearning);
    }
  } else if (action === 'add') {
    await addToLearningBulk(data, enrichedWords);
  }

  await pause();
}

// Add multiple words to learning list
async function addToLearningBulk(data, enrichedWords) {
  const notLearning = enrichedWords.filter(w => !w.isLearning);

  if (notLearning.length === 0) {
    console.log(chalk.green('\nYou\'re already learning all words!'));
    return;
  }

  const wordChoices = notLearning.map(w => ({
    name: `${formatField(w.finnish)} - ${formatField(w.english)} [${w.category}]`,
    value: w.id
  }));

  const selectedIds = await numberedMultiSelect(
    'Select words to start learning (or "all"):',
    wordChoices
  );

  if (selectedIds.length > 0) {
    selectedIds.forEach(id => {
      addToLearning(data, id);
    });
    console.log(chalk.green(`\nAdded ${selectedIds.length} word(s) to your learning list!`));
  }
}

// List all words (only learning words)
export async function listAllWords(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== My Learning Words ===\n'));

  const learningWords = data.words.filter(w => w.isLearning);

  if (learningWords.length === 0) {
    console.log(chalk.yellow('No words in your learning list yet.'));
    console.log(chalk.gray('Use "Browse database" to add words to your learning list.'));
  } else {
    await displayWordsTable(learningWords);
  }
  await pause();
}

// List words by category
export async function listByCategory(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== List by Category ===\n'));

  const learningWords = data.words.filter(w => w.isLearning);

  const categoriesWithCounts = data.categories
    .map(cat => {
      const count = learningWords.filter(w => w.category === cat).length;
      return { name: `${cat} (${count} words)`, value: cat, count };
    })
    .filter(c => c.count > 0);

  if (categoriesWithCounts.length === 0) {
    console.log(chalk.yellow('No words in your learning list yet.'));
    await pause();
    return;
  }

  const categoryChoices = [
    ...categoriesWithCounts,
    { name: 'Back to menu', value: 'back' }
  ];

  const category = await numberedMenu('Select a category:', categoryChoices);

  if (category === 'back' || category === null) return;

  const words = learningWords.filter(w => w.category === category);
  console.log(chalk.cyan.bold(`\n=== ${category.toUpperCase()} ===\n`));
  await displayWordsTable(words, false);
  await pause();
}

// List words alphabetically
export async function listAlphabetically(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Words (Alphabetical) ===\n'));

  const learningWords = data.words.filter(w => w.isLearning);

  if (learningWords.length === 0) {
    console.log(chalk.yellow('No words in your learning list yet.'));
    await pause();
    return;
  }

  const sortBy = await numberedMenu('Sort by:', [
    { name: 'Finnish (A-Z)', value: 'finnish-asc' },
    { name: 'Finnish (Z-A)', value: 'finnish-desc' },
    { name: 'English (A-Z)', value: 'english-asc' },
    { name: 'English (Z-A)', value: 'english-desc' }
  ]);

  if (!sortBy) return;

  const [field, order] = sortBy.split('-');
  const sorted = [...learningWords].sort((a, b) => {
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

  // Search in all database words
  const results = data._database.words.filter(w => {
    // Handle finnish field (may be string or array)
    const finnishMatch = Array.isArray(w.finnish)
      ? w.finnish.some(f => f.toLowerCase().includes(searchTerm))
      : w.finnish.toLowerCase().includes(searchTerm);
    // Handle english field (may be string or array)
    const englishMatch = Array.isArray(w.english)
      ? w.english.some(e => e.toLowerCase().includes(searchTerm))
      : w.english.toLowerCase().includes(searchTerm);
    const notesMatch = w.notes?.toLowerCase().includes(searchTerm) || false;
    return finnishMatch || englishMatch || notesMatch;
  });

  console.log(chalk.cyan(`\nResults for "${query}":\n`));

  if (results.length === 0) {
    console.log(chalk.yellow('No words found.'));
  } else {
    // Enrich with learning status
    const enrichedResults = results.map(w => {
      const entry = data._vocabulary.learningEntries.find(e => e.wordId === w.id);
      return {
        ...w,
        isLearning: !!entry,
        mastered: entry?.mastered || false,
        practiceCount: entry?.practiceCount || 0,
        correctCount: entry?.correctCount || 0
      };
    });
    await displayWordsTable(enrichedResults);
  }

  await pause();
}

// Edit a word (updates database only, preserves progress)
export async function editWord(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Edit Word ===\n'));

  if (data._database.words.length === 0) {
    console.log(chalk.yellow('No words to edit.'));
    await pause();
    return;
  }

  const wordChoices = data._database.words.map(w => {
    const finnish = formatField(w.finnish);
    const english = formatField(w.english);
    return {
      name: `${finnish} - ${english} [${w.category}]`,
      value: w
    };
  });

  const word = await numberedMenu('Select a word to edit:', wordChoices);

  if (!word) return;

  // Get display values for defaults (handle arrays)
  const finnishDefault = formatField(word.finnish);
  const englishDefault = formatField(word.english);

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

  // Update in database only
  word.finnish = finnish.trim();
  word.english = english.trim();
  word.category = category || word.category;
  word.example = example.trim();
  word.notes = notes.trim();
  word.updatedAt = new Date().toISOString();

  saveDatabase(data._database);

  // Also update in merged words list
  const mergedWord = data.words.find(w => w.id === word.id);
  if (mergedWord) {
    mergedWord.finnish = word.finnish;
    mergedWord.english = word.english;
    mergedWord.category = word.category;
    mergedWord.example = word.example;
    mergedWord.notes = word.notes;
    mergedWord.updatedAt = word.updatedAt;
  }

  console.log(chalk.green('\nWord updated! Your learning progress is preserved.'));
  await pause();
}

// Delete a word
export async function deleteWord(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Delete Word ===\n'));

  if (data._database.words.length === 0) {
    console.log(chalk.yellow('No words to delete.'));
    await pause();
    return;
  }

  const wordChoices = data._database.words.map(w => {
    const finnish = formatField(w.finnish);
    const english = formatField(w.english);
    const isLearning = data._vocabulary.learningEntries.some(e => e.wordId === w.id);
    const badge = isLearning ? chalk.green(' [Learning]') : '';
    return {
      name: `${finnish} - ${english}${badge}`,
      value: w
    };
  });

  const word = await numberedMenu('Select a word to delete:', wordChoices);

  if (!word) return;

  const hasProgress = data._vocabulary.learningEntries.some(e => e.wordId === word.id);

  if (hasProgress) {
    const action = await numberedMenu(
      `"${formatField(word.finnish)}" has learning progress. What to do?`,
      [
        { name: 'Remove from my learning only (keep in database)', value: 'learning_only' },
        { name: 'Delete from database only (keep my progress as orphan)', value: 'db_only' },
        { name: 'Delete completely (database AND my progress)', value: 'both' },
        { name: 'Cancel', value: 'cancel' }
      ]
    );

    if (action === 'cancel' || !action) return;

    if (action === 'learning_only') {
      removeFromLearning(data, word.id);
      console.log(chalk.green('\nRemoved from your learning list. Word still exists in database.'));
    } else if (action === 'db_only') {
      data._database.words = data._database.words.filter(w => w.id !== word.id);
      data.words = data.words.filter(w => w.id !== word.id);
      saveDatabase(data._database);
      console.log(chalk.yellow('\nDeleted from database. Your progress is orphaned.'));
    } else if (action === 'both') {
      const { confirm } = await inquirer.prompt([
        { type: 'input', name: 'confirm', message: 'Type "yes" to confirm deletion:' }
      ]);

      if (confirm.toLowerCase() === 'yes') {
        data._database.words = data._database.words.filter(w => w.id !== word.id);
        data.words = data.words.filter(w => w.id !== word.id);
        removeFromLearning(data, word.id);
        saveDatabase(data._database);
        console.log(chalk.green('\nWord and progress deleted completely.'));
      } else {
        console.log(chalk.gray('\nDeletion cancelled.'));
      }
    }
  } else {
    // No progress, simple delete
    const { confirm } = await inquirer.prompt([
      { type: 'input', name: 'confirm', message: `Type "yes" to delete "${formatField(word.finnish)}":` }
    ]);

    if (confirm.toLowerCase() === 'yes') {
      data._database.words = data._database.words.filter(w => w.id !== word.id);
      data.words = data.words.filter(w => w.id !== word.id);
      saveDatabase(data._database);
      console.log(chalk.green('\nWord deleted from database.'));
    } else {
      console.log(chalk.gray('\nDeletion cancelled.'));
    }
  }

  await pause();
}

// Mark words as mastered or reset mastery
export async function markAsMastered(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Mastery Management ===\n'));

  const learningEntries = data._vocabulary.learningEntries;
  const learningWords = learningEntries.filter(e => !e.mastered);
  const masteredWords = learningEntries.filter(e => e.mastered);

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

    const wordChoices = learningWords.map(entry => {
      const word = data._database.words.find(w => w.id === entry.wordId);
      if (!word) return null;
      const finnish = formatField(word.finnish);
      const english = formatField(word.english);
      return {
        name: `${finnish} - ${english}`,
        value: entry.wordId
      };
    }).filter(Boolean);

    const selectedIds = await numberedMultiSelect(
      'Select words to mark as mastered:',
      wordChoices
    );

    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        const entry = data._vocabulary.learningEntries.find(e => e.wordId === id);
        if (entry) {
          entry.mastered = true;
          entry.masteredAt = new Date().toISOString();
        }
        // Update merged word too
        const word = data.words.find(w => w.id === id);
        if (word) {
          word.mastered = true;
          word.masteredAt = entry.masteredAt;
        }
      });
      saveVocabulary(data._vocabulary);
      console.log(chalk.green(`\n${selectedIds.length} word(s) marked as mastered!`));
    }
  }

  if (action === 'reset') {
    const wordChoices = masteredWords.map(entry => {
      const word = data._database.words.find(w => w.id === entry.wordId);
      if (!word) return null;
      const finnish = formatField(word.finnish);
      const english = formatField(word.english);
      return {
        name: `${finnish} - ${english}`,
        value: entry.wordId
      };
    }).filter(Boolean);

    const selectedIds = await numberedMultiSelect(
      'Select words to reset (move back to learning):',
      wordChoices
    );

    if (selectedIds.length > 0) {
      selectedIds.forEach(id => {
        const entry = data._vocabulary.learningEntries.find(e => e.wordId === id);
        if (entry) {
          entry.mastered = false;
          entry.masteredAt = null;
          entry.streakFiEn = 0;
          entry.streakEnFi = 0;
        }
        // Update merged word too
        const word = data.words.find(w => w.id === id);
        if (word) {
          word.mastered = false;
          word.masteredAt = null;
          word.streakFiEn = 0;
          word.streakEnFi = 0;
        }
      });
      saveVocabulary(data._vocabulary);
      console.log(chalk.yellow(`\n${selectedIds.length} word(s) moved back to learning!`));
    }
  }

  await pause();
}
