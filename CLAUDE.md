# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Run the application (or: node index.js)
npm install      # Install dependencies
```

No test framework is configured.

## Architecture

### Split Database Design

The app uses a dual-file architecture separating shareable content from personal progress:

- **database.json** (git-tracked): Word definitions, categories, examples, notes
- **vocabulary.json** (gitignored): Personal learning progress, SM-2 scheduling data, practice stats

The `loadMergedData()` function in [data.js](src/data.js) combines both files at runtime, creating merged word objects with an `isLearning` flag. The `_database` and `_vocabulary` properties preserve references for targeted saves.

### Module Structure

- **index.js**: Entry point, main menu loop, routes to feature modules
- **src/config.js**: Constants, file paths, category dictionaries, algorithm settings
- **src/data.js**: Data loading/saving, merge logic, learning entry management
- **src/sm2.js**: SM-2 spaced repetition algorithm, auto-mastery checks, review scheduling
- **src/ui.js**: Shared UI components (tables, menus, prompts), re-exports chalk/inquirer

Feature modules (practice.js, words.js, statistics.js, etc.) receive the merged `data` object and use functions from data.js to persist changes.

### Data Flow Pattern

1. `loadMergedData()` creates unified view of database + vocabulary
2. Feature modules modify the merged data
3. Changes to word definitions → `saveDatabase(data._database)`
4. Changes to learning progress → `saveVocabulary(data._vocabulary)`
5. Main loop reloads merged data after each operation

### Key Concepts

- **Learning entries**: Created when user adds a word to their learning list via `addToLearning()`
- **SM-2 fields**: `easeFactor`, `interval`, `repetitions`, `nextReviewDate` control review scheduling
- **Auto-mastery**: Words automatically marked mastered after 3 consecutive correct answers in both directions OR 85%+ accuracy over 4+ attempts
- **Finnish field**: Can be string or array (for words with spoken variants like `["minä", "mä"]`)

## Code Conventions

- ES modules with explicit `.js` extensions in imports
- Async/await throughout for user interaction
- UI uses numbered menus (not inquirer lists) for terminal compatibility
