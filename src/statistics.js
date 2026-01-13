import { clearScreen, pause, chalk, Table } from './ui.js';

// View statistics
export async function viewStatistics(data) {
  clearScreen();
  console.log(chalk.cyan.bold('\n=== Statistics ===\n'));

  const totalInDatabase = data._database.words.length;
  const learningEntries = data._vocabulary.learningEntries;
  const totalLearning = learningEntries.length;
  const mastered = learningEntries.filter(e => e.mastered).length;
  const learning = totalLearning - mastered;

  // Get learning words with merged data
  const learningWords = data.words.filter(w => w.isLearning);

  // Calculate category statistics (from learning words only)
  const categoryStats = {};
  data.categories.forEach(cat => {
    const words = learningWords.filter(w => w.category === cat);
    if (words.length > 0) {
      categoryStats[cat] = {
        total: words.length,
        mastered: words.filter(w => w.mastered).length
      };
    }
  });

  // Display overview
  console.log(chalk.white.bold('Overview:'));
  console.log(`  Database: ${chalk.cyan(totalInDatabase)} words available`);
  console.log(`  Learning: ${chalk.yellow(totalLearning)} words`);
  console.log(`    - Mastered: ${chalk.green(mastered)} (${totalLearning > 0 ? Math.round((mastered / totalLearning) * 100) : 0}%)`);
  console.log(`    - In progress: ${chalk.yellow(learning)}`);
  console.log(`  Practice sessions: ${chalk.cyan(data._vocabulary.stats.totalPracticeSessions)}`);

  if (data._vocabulary.stats.lastPracticeDate) {
    console.log(`  Last practice: ${new Date(data._vocabulary.stats.lastPracticeDate).toLocaleString()}`);
  }

  // Display category breakdown
  console.log(chalk.white.bold('\nBy Category (Learning):'));

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
    console.log(chalk.gray('  No words in your learning list yet.'));
  }

  // Most practiced words
  const mostPracticed = [...learningWords]
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
  const needsAttention = [...learningWords]
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
