import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const BACKUP_DIR = path.join(ROOT_DIR, 'backups');
const MAX_BACKUPS = 10; // Keep last 10 backups to avoid disk bloat

// Ensure backup directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Generate backup filename with timestamp and type
function getBackupFilename(type) {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);
  return `backup_${type}_${timestamp}`;
}

// Create a backup of all data files
export function createBackup(type = 'manual') {
  ensureBackupDir();

  const backupName = getBackupFilename(type);
  const backupPath = path.join(BACKUP_DIR, backupName);

  // Create subfolder for this backup
  fs.mkdirSync(backupPath, { recursive: true });

  let backedUp = [];

  // Backup vocabulary.json
  const vocabSource = path.join(ROOT_DIR, 'vocabulary.json');
  if (fs.existsSync(vocabSource)) {
    fs.copyFileSync(vocabSource, path.join(backupPath, 'vocabulary.json'));
    backedUp.push('vocabulary.json');
  }

  // Backup daily-goals.json
  const goalsSource = path.join(ROOT_DIR, 'daily-goals.json');
  if (fs.existsSync(goalsSource)) {
    fs.copyFileSync(goalsSource, path.join(backupPath, 'daily-goals.json'));
    backedUp.push('daily-goals.json');
  }

  // Write backup metadata
  const metadata = {
    createdAt: new Date().toISOString(),
    type,
    files: backedUp
  };
  fs.writeFileSync(
    path.join(backupPath, 'backup-info.json'),
    JSON.stringify(metadata, null, 2)
  );

  // Cleanup old backups
  cleanupOldBackups();

  return { backupPath, files: backedUp };
}

// Remove old backups keeping only the most recent ones
function cleanupOldBackups() {
  ensureBackupDir();

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Newest first

  // Remove backups beyond the limit
  if (backups.length > MAX_BACKUPS) {
    const toRemove = backups.slice(MAX_BACKUPS);
    toRemove.forEach(backup => {
      fs.rmSync(backup.path, { recursive: true, force: true });
    });
  }
}

// List available backups
export function listBackups() {
  ensureBackupDir();

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_'))
    .map(f => {
      const backupPath = path.join(BACKUP_DIR, f);
      const infoPath = path.join(backupPath, 'backup-info.json');
      let info = { type: 'unknown', createdAt: null };

      if (fs.existsSync(infoPath)) {
        try {
          info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
        } catch (e) {
          // Ignore parse errors
        }
      }

      return {
        name: f,
        path: backupPath,
        type: info.type,
        createdAt: info.createdAt,
        files: info.files || []
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return backups;
}

// Restore from a backup
export function restoreBackup(backupName) {
  const backupPath = path.join(BACKUP_DIR, backupName);

  if (!fs.existsSync(backupPath)) {
    throw new Error('Backup not found');
  }

  const restored = [];

  // Restore vocabulary.json
  const vocabBackup = path.join(backupPath, 'vocabulary.json');
  if (fs.existsSync(vocabBackup)) {
    fs.copyFileSync(vocabBackup, path.join(ROOT_DIR, 'vocabulary.json'));
    restored.push('vocabulary.json');
  }

  // Restore daily-goals.json
  const goalsBackup = path.join(backupPath, 'daily-goals.json');
  if (fs.existsSync(goalsBackup)) {
    fs.copyFileSync(goalsBackup, path.join(ROOT_DIR, 'daily-goals.json'));
    restored.push('daily-goals.json');
  }

  return restored;
}

export { BACKUP_DIR };
