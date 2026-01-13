# Finnish Vocabulary Tracker

A command-line application for learning Finnish vocabulary with spaced repetition, progress tracking, and smart practice modes.

## Features

- **Vocabulary Management**: Add, edit, delete, and search Finnish-English word pairs
- **Smart Categories**: Auto-detects categories based on Finnish word patterns and English meanings
- **SM-2 Spaced Repetition**: Scientifically-proven algorithm that schedules reviews at optimal intervals
- **Bidirectional Practice**: Practice Finnish→English and English→Finnish with streak tracking
- **Auto-Mastery System**: Automatically marks words as mastered based on performance
- **Daily Goals**: Track daily learning targets for new words, practice count, and accuracy
- **CSV Import/Export**: Backup and share vocabulary lists
- **Progress Statistics**: View detailed stats by category with visual progress bars
- **Automatic Backups**: Data backed up on every startup and exit

## Installation

```bash
# Clone or navigate to the project directory
cd finnish-vocab

# Install dependencies
npm install

# Run the application
npm start
```

## Requirements

- Node.js 18+
- npm

## Usage

Run the application:

```bash
npm start
# or
node index.js
```

### Main Menu

```
+------------------------------------------+
|     Finnish Vocabulary Tracker          |
|     Opi suomea - Learn Finnish!         |
+------------------------------------------+

Total words: 11 | Mastered: 3 | Learning: 8
Reviews due: 5 now | 2 later today | 4 this week
Daily: ○ 1/3 new | ○ 5/10 practiced

  [1]  Add new word
  [2]  List all words
  [3]  List by category
  [4]  List alphabetically
  [5]  Search words
  [6]  Edit a word
  [7]  Delete a word
  [8]  Mark as mastered
  [9]  Practice mode
  [10] View statistics
  [11] Manage categories
  [12] Daily goals
  [13] Export to CSV
  [14] Import from CSV
  [0]  Exit
```

### Practice Modes

1. **Due for Review (SM-2)**: Practice words scheduled for review based on spaced repetition
2. **Smart Practice**: Prioritizes words with lower accuracy and longer time since last practice
3. **Finnish → English**: Translate Finnish words to English
4. **English → Finnish**: Translate English words to Finnish
5. **Mixed**: Random direction for each word
6. **Review Mastered**: Practice words you've already mastered

### Spaced Repetition (SM-2)

The app uses the SM-2 algorithm to optimize learning:

- **Correct answers** increase the review interval (1 day → 3 days → 8 days → 20 days → ...)
- **Incorrect answers** reset the word for review the next day
- Each word has an **ease factor** that adjusts based on how easily you recall it
- The main menu shows how many words are due for review

### Auto-Mastery

Words are automatically marked as mastered when you:
- Get 3 consecutive correct answers in both directions (FI→EN and EN→FI), OR
- Achieve 85%+ accuracy over 4+ attempts in both directions

Mastered words are hidden from regular practice but can still be reviewed.

### Daily Goals

Set and track daily targets:
- **New words to learn** (default: 3/day)
- **Words to practice** (default: 10/day)
- **Target accuracy** (default: 80%)

Progress resets automatically at midnight.

## Automatic Backups

The app automatically creates backups of your data:

- **On startup**: Creates a `backup_startup_*` snapshot before you start
- **On exit**: Creates a `backup_exit_*` snapshot when you quit

Backups are stored in the `backups/` folder and include:
- `vocabulary.json` - All your words and progress
- `daily-goals.json` - Daily goal settings and progress
- `backup-info.json` - Metadata about when the backup was created

**Automatic cleanup**: Only the last 10 backups are kept to save disk space.

To restore from a backup manually, copy the files from a backup folder to the main directory.

## Project Structure

```
finnish-vocab/
├── index.js                  # Main entry point (menu routing only)
├── package.json              # Dependencies and scripts
├── vocabulary.json           # Word database (auto-created)
├── daily-goals.json          # Daily progress (auto-created)
├── README.md
├── backups/                  # Automatic backups (auto-created)
│   └── backup_startup_2026-01-09_10-30-00/
│       ├── vocabulary.json
│       ├── daily-goals.json
│       └── backup-info.json
└── src/
    ├── config.js             # Constants and configuration
    ├── data.js               # Data loading/saving functions
    ├── sm2.js                # SM-2 spaced repetition algorithm
    ├── ui.js                 # UI helpers and prompts
    ├── backup.js             # Backup/restore functionality
    │
    │   Feature Modules:
    ├── practice.js           # Practice mode functionality
    ├── words.js              # Word CRUD operations
    ├── statistics.js         # Statistics view
    ├── categories.js         # Category auto-detection
    ├── categoryManager.js    # Category management UI
    ├── csv.js                # CSV utilities
    ├── csvManager.js         # CSV import/export UI
    ├── dailyGoals.js         # Daily goals data functions
    └── dailyGoalsManager.js  # Daily goals UI
```

## Data Format

### vocabulary.json

```json
{
  "words": [
    {
      "id": 1704067200000,
      "finnish": "kiitos",
      "english": "thank you",
      "category": "greetings",
      "example": "Kiitos paljon!",
      "notes": "One of the most important words",
      "mastered": false,
      "practiceCount": 5,
      "correctCount": 4,
      "streakFiEn": 2,
      "streakEnFi": 1,
      "easeFactor": 2.5,
      "interval": 3,
      "nextReviewDate": "2026-01-12T00:00:00.000Z"
    }
  ],
  "categories": ["greetings", "numbers", "food & drinks", ...],
  "stats": {
    "totalWordsAdded": 50,
    "totalPracticeSessions": 12,
    "lastPracticeDate": "2026-01-09T10:30:00.000Z"
  }
}
```

### CSV Format

For import/export:

```csv
finnish,english,category,example,notes,mastered
kiitos,thank you,greetings,Kiitos paljon!,Important word,false
hei,hello,greetings,Hei! Mitä kuuluu?,Informal,false
```

## Built-in Categories

- grocery, weather, automobiles, body parts
- greetings, numbers, colors, food & drinks
- family, animals, verbs, adjectives, other

New categories can be added when adding words.

## Auto-Category Detection

The app recognizes 100+ common Finnish words and automatically suggests categories:

- Finnish patterns: verb endings (-da, -dä), adjective endings (-inen, -nen)
- English keywords: "milk" → grocery, "sun" → weather, "hand" → body parts

## Tips for Effective Learning

1. **Practice daily**: Even 5-10 minutes helps retention
2. **Use the SM-2 reviews**: Do your due reviews first each day
3. **Add example sentences**: Context helps memory
4. **Practice both directions**: Finnish→English AND English→Finnish
5. **Don't skip difficult words**: The algorithm will show them more often

## Dependencies

- [inquirer](https://www.npmjs.com/package/inquirer) - Interactive prompts
- [chalk](https://www.npmjs.com/package/chalk) - Terminal colors
- [cli-table3](https://www.npmjs.com/package/cli-table3) - Table formatting

## License

ISC
