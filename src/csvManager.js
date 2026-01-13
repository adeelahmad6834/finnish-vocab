import fs from 'fs';
import path from 'path';
import { saveData } from './data.js';
import { detectCategory } from './categories.js';
import {
  generateCSVContent, parseCSVLine, getExportPath, listCSVFiles, getRootDir
} from './csv.js';
import { clearScreen, numberedMenu, pause, chalk, inquirer } from './ui.js';

// Export to CSV
export async function exportToCSV(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Export to CSV ===\n'));

  if (data.words.length === 0) {
    console.log(chalk.yellow('No words to export.'));
    await pause();
    return;
  }

  const exportType = await numberedMenu('What to export?', [
    { name: `All words (${data.words.length})`, value: 'all' },
    { name: 'Only mastered words', value: 'mastered' },
    { name: 'Only learning words', value: 'learning' },
    { name: 'By category', value: 'category' },
    { name: 'Back', value: 'back' }
  ]);

  if (exportType === 'back' || !exportType) return;

  let wordsToExport = [];
  let filename = 'finnish-vocabulary';

  if (exportType === 'all') {
    wordsToExport = data.words;
    filename = 'finnish-vocabulary-all';
  } else if (exportType === 'mastered') {
    wordsToExport = data.words.filter(w => w.mastered);
    filename = 'finnish-vocabulary-mastered';
  } else if (exportType === 'learning') {
    wordsToExport = data.words.filter(w => !w.mastered);
    filename = 'finnish-vocabulary-learning';
  } else if (exportType === 'category') {
    const categoryChoices = data.categories
      .map(cat => ({ name: cat, value: cat }))
      .filter(c => data.words.some(w => w.category === c.value));

    const category = await numberedMenu('Select category:', categoryChoices);
    if (!category) return;

    wordsToExport = data.words.filter(w => w.category === category);
    filename = `finnish-vocabulary-${category.replace(/\s+/g, '-')}`;
  }

  if (wordsToExport.length === 0) {
    console.log(chalk.yellow('\nNo words found for export.'));
    await pause();
    return;
  }

  const csvContent = generateCSVContent(wordsToExport);
  const exportPath = getExportPath(filename);
  fs.writeFileSync(exportPath, csvContent, 'utf-8');

  console.log(chalk.green(`\nExported ${wordsToExport.length} words to:`));
  console.log(chalk.cyan(`  ${exportPath}`));

  await pause();
}

// Import from CSV
export async function importFromCSV(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Import from CSV ===\n'));

  console.log(chalk.gray('CSV format: finnish,english,category,example,notes,mastered'));
  console.log(chalk.gray('First row should be headers.\n'));

  const files = listCSVFiles();

  if (files.length === 0) {
    console.log(chalk.yellow('No CSV files found in the application directory.'));
    console.log(chalk.gray(`\nPlace your CSV file in: ${getRootDir()}`));
    await pause();
    return;
  }

  const fileChoices = files.map(f => ({ name: f, value: f }));
  fileChoices.push({ name: 'Enter custom path', value: '__custom__' });
  fileChoices.push({ name: 'Back', value: 'back' });

  const selectedFile = await numberedMenu('Select CSV file:', fileChoices);
  if (selectedFile === 'back' || !selectedFile) return;

  let filePath;
  if (selectedFile === '__custom__') {
    const { customPath } = await inquirer.prompt([
      { type: 'input', name: 'customPath', message: 'Enter full path to CSV file:' }
    ]);
    filePath = customPath.trim();
  } else {
    filePath = path.join(getRootDir(), selectedFile);
  }

  if (!fs.existsSync(filePath)) {
    console.log(chalk.red('\nFile not found.'));
    await pause();
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      console.log(chalk.yellow('\nCSV file is empty or has only headers.'));
      await pause();
      return;
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    const finnishIdx = headers.indexOf('finnish');
    const englishIdx = headers.indexOf('english');

    if (finnishIdx === -1 || englishIdx === -1) {
      console.log(chalk.red('\nCSV must have "finnish" and "english" columns.'));
      await pause();
      return;
    }

    const categoryIdx = headers.indexOf('category');
    const exampleIdx = headers.indexOf('example');
    const notesIdx = headers.indexOf('notes');
    const masteredIdx = headers.indexOf('mastered');

    // Ask how to handle duplicates
    const { duplicateAction } = await inquirer.prompt([
      {
        type: 'input',
        name: 'duplicateAction',
        message: 'How to handle duplicates? (s)kip / (u)pdate / (a)sk each:',
        default: 's'
      }
    ]);
    const dupAction = duplicateAction.toLowerCase().charAt(0);

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const finnish = values[finnishIdx]?.trim();
      const english = values[englishIdx]?.trim();

      if (!finnish || !english) {
        skipped++;
        continue;
      }

      const existing = data.words.find(w => {
        const finnishVals = Array.isArray(w.finnish) ? w.finnish : [w.finnish];
        return finnishVals.some(f => f.toLowerCase() === finnish.toLowerCase());
      });

      if (existing) {
        if (dupAction === 's') {
          skipped++;
          continue;
        } else if (dupAction === 'u') {
          updateExistingWord(existing, values, {
            englishIdx, categoryIdx, exampleIdx, notesIdx, masteredIdx
          }, english);
          updated++;
          continue;
        } else {
          // Ask for each duplicate
          const { action } = await inquirer.prompt([
            {
              type: 'input',
              name: 'action',
              message: `"${finnish}" exists. (s)kip / (u)pdate?`,
              default: 's'
            }
          ]);

          if (action.toLowerCase().charAt(0) === 'u') {
            updateExistingWord(existing, values, {
              englishIdx, categoryIdx, exampleIdx, notesIdx, masteredIdx
            }, english);
            updated++;
          } else {
            skipped++;
          }
          continue;
        }
      }

      // Create new word
      let category = categoryIdx !== -1 && values[categoryIdx]
        ? values[categoryIdx].trim()
        : null;

      if (!category) {
        category = detectCategory(finnish, english) || 'other';
      }

      if (!data.categories.includes(category)) {
        data.categories.push(category);
      }

      const newWord = {
        id: Date.now() + i,
        finnish,
        english,
        category,
        example: exampleIdx !== -1 ? (values[exampleIdx]?.trim() || '') : '',
        notes: notesIdx !== -1 ? (values[notesIdx]?.trim() || '') : '',
        mastered: masteredIdx !== -1 ? values[masteredIdx]?.toLowerCase() === 'true' : false,
        practiceCount: 0,
        correctCount: 0,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      data.words.push(newWord);
      imported++;
    }

    data.stats.totalWordsAdded += imported;
    saveData(data);

    console.log(chalk.green(`\nImport complete:`));
    console.log(`  - Imported: ${chalk.green(imported)} new words`);
    console.log(`  - Updated: ${chalk.yellow(updated)} existing words`);
    console.log(`  - Skipped: ${chalk.gray(skipped)} (duplicates or invalid)`);

  } catch (error) {
    console.log(chalk.red(`\nError reading CSV: ${error.message}`));
  }

  await pause();
}

// Helper function to update existing word from CSV
function updateExistingWord(existing, values, indices, english) {
  const { categoryIdx, exampleIdx, notesIdx, masteredIdx } = indices;

  existing.english = english;

  if (categoryIdx !== -1 && values[categoryIdx]) {
    existing.category = values[categoryIdx].trim();
  }
  if (exampleIdx !== -1 && values[exampleIdx]) {
    existing.example = values[exampleIdx].trim();
  }
  if (notesIdx !== -1 && values[notesIdx]) {
    existing.notes = values[notesIdx].trim();
  }
  if (masteredIdx !== -1) {
    existing.mastered = values[masteredIdx]?.toLowerCase() === 'true';
  }

  existing.updatedAt = new Date().toISOString();
}
