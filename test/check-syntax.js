/* Синтаксическая проверка всех JS/JSX файлов приложения через @babel/parser
   (чистый JS, не требует spawn — работает в песочнице). */
'use strict';

const fs = require('fs');
const path = require('path');

const FRONTEND = path.join(__dirname, '..', 'frontend');
const parser = require(path.join(FRONTEND, 'node_modules', '@babel', 'parser'));
const SRC = path.join(FRONTEND, 'src');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
let bad = 0;

for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  try {
    parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'importAttributes'],
    });
    console.log('  ✓', path.relative(FRONTEND, f));
  } catch (e) {
    bad++;
    console.error('  ✗', path.relative(FRONTEND, f), '—', e.message);
  }
}

console.log(bad === 0 ? `\nСИНТАКСИС OK (${files.length} файлов)` : `\nОШИБКИ: ${bad}`);

/* Проверка относительных импортов */
let importBad = 0;
for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  for (const m of code.matchAll(/from\s+['"](\.[^'"]+)['"]|import\s+['"](\.[^'"]+)['"]/g)) {
    const spec = m[1] || m[2];
    let p = path.resolve(path.dirname(f), spec);
    if (!fs.existsSync(p)) {
      if (!p.endsWith('.js') && fs.existsSync(p + '.js')) continue; // расширение добавлено
      if (!p.endsWith('.jsx') && fs.existsSync(p + '.jsx')) continue;
      importBad++;
      console.error('  ✗ импорт не найден:', path.relative(FRONTEND, f), '→', spec);
    }
  }
}
console.log(importBad === 0 ? 'ИМПОРТЫ OK' : `ОШИБКИ ИМПОРТОВ: ${importBad}`);
process.exit(bad === 0 && importBad === 0 ? 0 : 1);
