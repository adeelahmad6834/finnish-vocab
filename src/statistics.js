import { clearScreen, pause, chalk, Table } from './ui.js';

// View statistics
export async function viewStatistics(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Statistics ===\n'));

  const total = data.words.length;
  const mastered = data.words.filter(w => w.mastered).length;
  const learning = total - mastered;

  // Calculate category statistics
  const categoryStats = {};
  data.categories.forEach(cat => {
    const words = data.words.filter(w => w.category === cat);
    if (words.length > 0) {
      categoryStats[cat] = {
        total: words.length,
        mastered: words.filter(w => w.mastered).length
      };
    }
  });

  // Display overview
  console.log(chalk.white.bold('Overview:'));
  console.log(`  Total words: ${chalk.cyan(total)}`);
  console.log(`  Mastered: ${chalk.green(mastered)} (${total > 0 ? Math.round((mastered / total) * 100) : 0}%)`);
  console.log(`  Learning: ${chalk.yellow(learning)}`);
  console.log(`  Practice sessions: ${chalk.cyan(data.stats.totalPracticeSessions)}`);

  if (data.stats.lastPracticeDate) {
    console.log(`  Last practice: ${new Date(data.stats.lastPracticeDate).toLocaleString()}`);
  }

  // Display category breakdown
  console.log(chalk.white.bold('\nBy Category:'));

  const table = new Table({
    head: [
      chalk.cyan('Category'),
      chalk.cyan('Total'),
      chalk.cyan('Mastered'),
      chalk.cyan('Progress')
    ],
    colWidths: [20, 10, 10, 20]
  });

  Object.entries(categoryStats).forEach(([cat, stats]) => {
    const progress = stats.total > 0
      ? Math.round((stats.mastered / stats.total) * 100)
      : 0;
    const barFilled = Math.floor(progress / 10);
    const bar = '█'.repeat(barFilled) + '░'.repeat(10 - barFilled);
    table.push([cat, stats.total, stats.mastered, `${bar} ${progress}%`]);
  });

  if (Object.keys(categoryStats).length > 0) {
    console.log(table.toString());
  } else {
    console.log(chalk.gray('  No words added yet.'));
  }

  // Most practiced words
  const mostPracticed = [...data.words]
    .filter(w => w.practiceCount > 0)
    .sort((a, b) => b.practiceCount - a.practiceCount)
    .slice(0, 5);

  if (mostPracticed.length > 0) {
    console.log(chalk.white.bold('\nMost Practiced Words:'));
    mostPracticed.forEach((w, i) => {
      const accuracy = w.practiceCount > 0
        ? Math.round((w.correctCount / w.practiceCount) * 100)
        : 0;
      const finnish = Array.isArray(w.finnish) ? w.finnish[0] : w.finnish;
      console.log(`  ${i + 1}. ${finnish} - ${accuracy}% accuracy (${w.practiceCount} times)`);
    });
  }

  // Words needing attention (low accuracy)
  const needsAttention = [...data.words]
    .filter(w => w.practiceCount >= 3 && (w.correctCount / w.practiceCount) < 0.5)
    .slice(0, 5);

  if (needsAttention.length > 0) {
    console.log(chalk.white.bold('\nNeeds More Practice:'));
    needsAttention.forEach((w, i) => {
      const finnish = Array.isArray(w.finnish) ? w.finnish[0] : w.finnish;
      const english = Array.isArray(w.english) ? w.english.join(' / ') : w.english;
      console.log(`  ${i + 1}. ${chalk.yellow(finnish)} - ${english}`);
    });
  }

  await pause();
}
