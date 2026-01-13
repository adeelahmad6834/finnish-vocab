import { saveData } from './data.js';
import {
  clearScreen, numberedMenu, numberedMultiSelect, pause, chalk, inquirer
} from './ui.js';

// Manage categories
export async function manageCategories(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Manage Categories ===\n'));

  const action = await numberedMenu('What would you like to do?', [
    { name: 'View all categories', value: 'view' },
    { name: 'Add new category', value: 'add' },
    { name: 'Remove empty category', value: 'remove' },
    { name: 'Back to menu', value: 'back' }
  ]);

  if (action === 'back' || action === null) return;

  if (action === 'view') {
    console.log(chalk.white.bold('\nCategories:'));
    data.categories.forEach(cat => {
      const count = data.words.filter(w => w.category === cat).length;
      console.log(`  - ${cat} (${count} words)`);
    });
  }

  if (action === 'add') {
    const { newCat } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newCat',
        message: 'New category name:',
        validate: input => input.trim() ? true : 'Please enter a name'
      }
    ]);

    const catName = newCat.toLowerCase().trim();
    if (data.categories.includes(catName)) {
      console.log(chalk.yellow('\nCategory already exists.'));
    } else {
      data.categories.push(catName);
      saveData(data);
      console.log(chalk.green(`\nCategory "${catName}" added!`));
    }
  }

  if (action === 'remove') {
    const emptyCategories = data.categories.filter(cat =>
      data.words.filter(w => w.category === cat).length === 0
    );

    if (emptyCategories.length === 0) {
      console.log(chalk.yellow('\nNo empty categories to remove.'));
    } else {
      const toRemove = await numberedMultiSelect(
        'Select categories to remove:',
        emptyCategories
      );

      if (toRemove.length > 0) {
        data.categories = data.categories.filter(c => !toRemove.includes(c));
        saveData(data);
        console.log(chalk.green(`\n${toRemove.length} category(ies) removed!`));
      }
    }
  }

  await pause();
}
