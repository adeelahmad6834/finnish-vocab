import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Escape CSV field
export function escapeCSVField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Parse CSV line
export function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

// Format field for CSV export (handle arrays)
function formatFieldForCSV(field) {
  if (Array.isArray(field)) {
    return field.join(' / ');
  }
  return field;
}

// Generate CSV content from words
export function generateCSVContent(words) {
  const headers = ['finnish', 'english', 'category', 'example', 'notes', 'mastered'];
  let csvContent = headers.join(',') + '\n';

  words.forEach(word => {
    const row = [
      escapeCSVField(formatFieldForCSV(word.finnish)),
      escapeCSVField(formatFieldForCSV(word.english)),
      escapeCSVField(word.category),
      escapeCSVField(word.example),
      escapeCSVField(word.notes),
      word.mastered ? 'true' : 'false'
    ];
    csvContent += row.join(',') + '\n';
  });

  return csvContent;
}

// Get CSV export path
export function getExportPath(filename) {
  const timestamp = new Date().toISOString().slice(0, 10);
  return path.join(ROOT_DIR, `${filename}-${timestamp}.csv`);
}

// List CSV files in app directory
export function listCSVFiles() {
  return fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.csv'));
}

// Get root directory
export function getRootDir() {
  return ROOT_DIR;
}
