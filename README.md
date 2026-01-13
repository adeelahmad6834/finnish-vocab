# Finnish Vocabulary Tracker

A command-line application for learning Finnish vocabulary with spaced repetition, progress tracking, and smart practice modes. Comes with **127 pre-built entries** covering question words, pronouns, common phrases, and spoken Finnish.

## Features

- **Split Database Architecture**: Shareable word definitions (tracked in git) + private learning progress (gitignored)
- **127 Pre-built Entries**: Question words, pronouns, common phrases, and spoken Finnish variants
- **Entry Types**: Supports words, phrases, sentences, and expressions
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
# Clone the repository
git clone https://github.com/adeelahmad6834/finnish-vocab.git
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

Database: 127 words | Learning: 45 | Mastered: 12
Reviews due: 5 now | 2 later today | 4 this week
Daily: ○ 1/3 new | ○ 5/10 practiced

  [1]  Add new word
  [2]  Browse database        <-- Browse all words, add to learning list
  [3]  List my words          <-- Your personal learning list
  [4]  List by category
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

## Database Architecture

The app uses a **split database** design:

### database.json (Tracked in Git - Shareable)
Contains word definitions that can be shared via GitHub:
- Finnish word/phrase
- English translation(s)
- Category
- Entry type (word/phrase/sentence/expression)
- Example sentences
- Usage notes

### vocabulary.json (Gitignored - Private)
Contains your personal learning progress:
- Which words you're learning
- Practice counts and accuracy
- Mastery status
- SM-2 scheduling data (ease factor, intervals, next review date)

This means you can:
- **Pull updates** from GitHub to get new words without losing your progress
- **Share your database** without exposing your learning history
- **Start fresh** by deleting vocabulary.json while keeping all word definitions

## Pre-built Content

The database includes **127 entries** across these categories:

| Category | Count | Description |
|----------|-------|-------------|
| Question words | 35 | mitä, missä, milloin, kuinka paljon, etc. |
| Pronouns | 39 | Personal, possessive, demonstrative, reflexive |
| Common phrases | 44 | Greetings, polite expressions, useful sentences |
| Spoken Finnish | 9 | Colloquial forms: mä, sä, mite, joo, etc. |

### Entry Types

Each entry has a `type` field:
- **word**: Single words (mitä, minä, kiitos)
- **phrase**: Multi-word expressions (kuinka paljon, ei hätää)
- **sentence**: Complete sentences (Puhutko englantia?)
- **expression**: Exclamations and reactions (Hienoa!, Voi ei!)

## Practice Modes

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
- `database.json` - Word definitions
- `vocabulary.json` - Your learning progress
- `daily-goals.json` - Daily goal settings and progress
- `backup-info.json` - Metadata about when the backup was created

**Automatic cleanup**: Only the last 10 backups are kept to save disk space.

## Project Structure

```
finnish-vocab/
├── index.js                  # Main entry point (menu routing only)
├── package.json              # Dependencies and scripts
├── database.json             # Word definitions (tracked in git)
├── vocabulary.json           # Personal progress (gitignored)
├── daily-goals.json          # Daily progress (gitignored)
├── README.md
├── backups/                  # Automatic backups (gitignored)
│   └── backup_startup_2026-01-09_10-30-00/
│       ├── database.json
│       ├── vocabulary.json
│       ├── daily-goals.json
│       └── backup-info.json
└── src/
    ├── config.js             # Constants and configuration
    ├── data.js               # Data loading/saving (dual-file system)
    ├── migrate.js            # Migration from old single-file format
    ├── sm2.js                # SM-2 spaced repetition algorithm
    ├── ui.js                 # UI helpers and prompts
    ├── backup.js             # Backup/restore functionality
    │
    │   Feature Modules:
    ├── practice.js           # Practice mode functionality
    ├── words.js              # Word CRUD operations + browse database
    ├── statistics.js         # Statistics view
    ├── categories.js         # Category auto-detection
    ├── categoryManager.js    # Category management UI
    ├── csv.js                # CSV utilities
    ├── csvManager.js         # CSV import/export UI
    ├── dailyGoals.js         # Daily goals data functions
    └── dailyGoalsManager.js  # Daily goals UI
```

## Data Format

### database.json (Shareable)

```json
{
  "version": 1,
  "words": [
    {
      "id": 1736800000001,
      "finnish": "mitä",
      "english": "what",
      "category": "question words",
      "type": "word",
      "example": "Mitä teet? (What are you doing?)",
      "notes": "Used for things, actions",
      "addedAt": "2026-01-13T00:00:00.000Z",
      "updatedAt": "2026-01-13T00:00:00.000Z"
    },
    {
      "id": 1736800000040,
      "finnish": ["minä", "mä"],
      "english": "I",
      "category": "pronouns",
      "type": "word",
      "example": "Minä olen opiskelija. (I am a student.)",
      "notes": "Subject pronoun. Spoken: mä. Often dropped as verb shows person."
    }
  ],
  "categories": ["question words", "pronouns", "common phrases", "spoken finnish", ...]
}
```

### vocabulary.json (Private)

```json
{
  "version": 1,
  "learningEntries": [
    {
      "wordId": 1736800000001,
      "startedLearningAt": "2026-01-13T10:00:00.000Z",
      "mastered": false,
      "practiceCount": 5,
      "correctCount": 4,
      "streakFiEn": 2,
      "streakEnFi": 1,
      "easeFactor": 2.5,
      "interval": 3,
      "nextReviewDate": "2026-01-16T00:00:00.000Z"
    }
  ],
  "stats": {
    "totalPracticeSessions": 12,
    "lastPracticeDate": "2026-01-13T10:30:00.000Z"
  }
}
```

### CSV Format

For import/export:

```csv
finnish,english,category,type,example,notes,mastered
mitä,what,question words,word,Mitä teet?,Used for things,false
kuinka paljon,how much,question words,phrase,Kuinka paljon se maksaa?,Uncountable nouns,false
```

## Built-in Categories

- question words, pronouns, common phrases, spoken finnish
- grocery, weather, automobiles, body parts
- greetings, numbers, colors, food & drinks
- family, animals, verbs, adjectives, other

New categories can be added when adding words.

## Auto-Category Detection

The app recognizes 150+ common Finnish words and automatically suggests categories:

- Finnish patterns: verb endings (-da, -dä), adjective endings (-inen, -nen)
- Finnish words: "mitä" → question words, "minä" → pronouns
- English keywords: "what" → question words, "I/you/he" → pronouns

## Tips for Effective Learning

1. **Start with Browse Database**: Add words you want to learn to your personal list
2. **Practice daily**: Even 5-10 minutes helps retention
3. **Use the SM-2 reviews**: Do your due reviews first each day
4. **Learn phrases, not just words**: The common phrases are essential for conversation
5. **Practice both directions**: Finnish→English AND English→Finnish
6. **Don't skip difficult words**: The algorithm will show them more often

## Contributing

The word database (`database.json`) is tracked in git. To contribute new words:

1. Fork the repository
2. Add words to `database.json`
3. Submit a pull request

Your learning progress (`vocabulary.json`) is gitignored and won't be included in commits.

## Dependencies

- [inquirer](https://www.npmjs.com/package/inquirer) - Interactive prompts
- [chalk](https://www.npmjs.com/package/chalk) - Terminal colors
- [cli-table3](https://www.npmjs.com/package/cli-table3) - Table formatting

## License

ISC
