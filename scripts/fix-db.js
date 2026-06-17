const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'data', 'db.json');
const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
const keepCount = 300;
if (lines.length < keepCount) {
  throw new Error(`File has only ${lines.length} lines, expected at least ${keepCount}`);
}
fs.writeFileSync(filePath, lines.slice(0, keepCount).join('\n'), 'utf8');
console.log(`Trimmed ${filePath} to ${keepCount} lines. New length: ${lines.slice(0, keepCount).length}`);
