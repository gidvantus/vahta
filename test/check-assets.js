/* Проверка ресурсов React-приложения: все /img/* ссылки из src и index.html существуют в public/. */
'use strict';

const fs = require('fs');
const path = require('path');

const FRONTEND = path.join(__dirname, '..', 'frontend');
const PUBLIC = path.join(FRONTEND, 'public');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(jsx?|html)$/.test(entry.name)) out.push(p);
  }
  return out;
}

const files = [path.join(FRONTEND, 'index.html'), ...walk(path.join(FRONTEND, 'src'))];
const refs = new Set();

for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/\/img\/[a-z0-9.\-/]+/g)) refs.add(m[0]);
}

let bad = 0;
for (const r of refs) {
  const p = path.join(PUBLIC, r.replace(/^\/img\//, 'img' + path.sep));
  if (!fs.existsSync(p)) { bad++; console.log('MISSING:', r); }
  else console.log('ok:', r);
}

// index.html подключает src/main.jsx
if (!fs.existsSync(path.join(FRONTEND, 'src', 'main.jsx'))) { bad++; console.log('MISSING: src/main.jsx'); }
else console.log('ok: src/main.jsx');

console.log(bad === 0 ? 'ВСЕ РЕСУРСЫ НА МЕСТЕ' : 'ОТСУТСТВУЕТ: ' + bad);
process.exit(bad === 0 ? 0 : 1);
