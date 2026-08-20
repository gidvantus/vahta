const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const files = ['index.html', 'js/script.js'];
let bad = 0;

for (const f of files) {
  const text = fs.readFileSync(path.join(root, f), 'utf8');
  const refs = new Set();
  for (const m of text.matchAll(/(?:src|href)="([^"]+)"/g)) refs.add(m[1]);
  for (const m of text.matchAll(/img\/[a-z0-9.\-/]+/g)) refs.add(m[0]);
  for (const r of refs) {
    const p = path.join(root, r.split('?')[0]);
    if (!fs.existsSync(p)) { bad++; console.log('MISSING:', f, '->', r); }
    else console.log('ok:', r);
  }
}
console.log(bad === 0 ? 'ВСЕ РЕСУРСЫ НА МЕСТЕ' : 'ОТСУТСТВУЕТ: ' + bad);
process.exit(bad === 0 ? 0 : 1);
