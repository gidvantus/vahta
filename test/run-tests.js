/* Функциональные тесты чистой логики фронтенда:
   параметры запроса API (lib/query.js), форматирование (lib/format.js)
   и сессия авторизации (lib/auth.js). */
'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const FRONTEND = path.join(__dirname, '..', 'frontend');

(async () => {
  const { buildQueryParams, SALARY_MIN } = await import(
    pathToFileURL(path.join(FRONTEND, 'src', 'lib', 'query.js')).href
  );
  const { fmtSalary, fmtHourlySalary, countWords, plural, dateLabel, normalizeLogo } = await import(
    pathToFileURL(path.join(FRONTEND, 'src', 'lib', 'format.js')).href
  );

  /* Подменяем localStorage (в Node его нет) и импортируем сессию. */
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };
  const auth = await import(
    pathToFileURL(path.join(FRONTEND, 'src', 'lib', 'auth.js')).href
  );

  let failures = 0;
  function check(name, cond, extra) {
    if (cond) console.log('  ✓', name);
    else { failures++; console.error('  ✗', name, extra !== undefined ? '— got: ' + JSON.stringify(extra) : ''); }
  }

  const normSpace = (s) => s.replace(/[\u00A0\u202F]/g, ' ');
  const DAY = 86400000;

  console.log('— buildQueryParams —');
  check('пустое состояние → {}', JSON.stringify(buildQueryParams({ query: '', cities: new Set(), salary: 'any', schedule: 'any', sort: 'date' })) === '{}');
  check('поиск → q', buildQueryParams({ query: '  сварщик ', cities: new Set(), salary: 'any', schedule: 'any', sort: 'date' }).q === 'сварщик');
  const cities = new Set(['Москва', 'Тобольск']);
  check('города → cities', buildQueryParams({ query: '', cities, salary: 'any', schedule: 'any', sort: 'date' }).cities === 'Москва,Тобольск');
  check('зарплата specified → salary_specified=true', buildQueryParams({ query: '', cities: new Set(), salary: 'specified', schedule: 'any', sort: 'date' }).salary_specified === true);
  check('зарплата 150k → salary_min=150000', buildQueryParams({ query: '', cities: new Set(), salary: '150k', schedule: 'any', sort: 'date' }).salary_min === 150000);
  check('график other → schedule=other', buildQueryParams({ query: '', cities: new Set(), salary: 'any', schedule: 'other', sort: 'date' }).schedule === 'other');
  check('сортировка → sort', buildQueryParams({ query: '', cities: new Set(), salary: 'any', schedule: 'any', sort: 'salary-desc' }).sort === 'salary-desc');
  check('SALARY_MIN: 200k → 200000', SALARY_MIN['200k'] === 200000);

  console.log('— fmtSalary —');
  check('от и до', normSpace(fmtSalary(180000, 220000)) === '180 000 – 220 000 ₽', fmtSalary(180000, 220000));
  check('только от', normSpace(fmtSalary(100000, null)) === 'от 100 000 ₽', fmtSalary(100000, null));
  check('без зарплаты', fmtSalary(null, null) === 'Зарплата не указана');

  console.log('— plural —');
  check('1 → "вакансия"', plural(1, ['вакансия', 'вакансии', 'вакансий']) === 'вакансия');
  check('2 → "вакансии"', plural(2, ['вакансия', 'вакансии', 'вакансий']) === 'вакансии');
  check('5 → "вакансий"', plural(5, ['вакансия', 'вакансии', 'вакансий']) === 'вакансий');
  check('21 → "вакансия"', plural(21, ['вакансия', 'вакансии', 'вакансий']) === 'вакансия');

  console.log('— dateLabel —');
  check('сейчас → Сегодня', dateLabel(new Date(Date.now() - 1000).toISOString()) === 'Сегодня');
  check('~1 день → Вчера', dateLabel(new Date(Date.now() - DAY - 1000).toISOString()) === 'Вчера');
  check('2 дня назад', dateLabel(new Date(Date.now() - 2 * DAY - 1000).toISOString()) === '2 дня назад');
  check('7+ дней → дата', /^\d+\s+\p{L}+\.?$/u.test(dateLabel(new Date(Date.now() - 10 * DAY).toISOString())));
  check('пусто → ""', dateLabel('') === '');
  check('без часового пояса обрабатывается', dateLabel('2026-08-20T15:49:56.701054').length > 0);

  console.log('— normalizeLogo —');
  check('img/gazprom.svg → /img/gazprom.svg', normalizeLogo('img/gazprom.svg') === '/img/gazprom.svg');
  check('с ведущим /', normalizeLogo('/img/lukoil.svg') === '/img/lukoil.svg');
  check('внешний URL как есть', normalizeLogo('https://cdn.example.com/l.png') === 'https://cdn.example.com/l.png');
  check('blob: URL как есть (превью фото)', normalizeLogo('blob:http://localhost:5173/abc-123') === 'blob:http://localhost:5173/abc-123');
  check('data: URL как есть', normalizeLogo('data:image/png;base64,AAAA') === 'data:image/png;base64,AAAA');
  check('null → null', normalizeLogo(null) === null);

  const account = { registrant: { full_name: 'Иванов Иван', phone: '+79123456789' }, companies: [] };

  console.log('— сессия авторизации (lib/auth.js) —');
  check('до входа — не авторизован', auth.isAuthenticated() === false);
  check('loadSession до входа → null', auth.loadSession() === null);

  let notified = 0;
  const unsubscribe = auth.subscribeAuth(() => { notified++; });
  auth.saveSession(account);
  check('после saveSession — авторизован', auth.isAuthenticated() === true);
  check('loadSession возвращает данные', JSON.stringify(auth.loadSession()) === JSON.stringify(account));
  check('подписка вызвана при saveSession', notified === 1);

  auth.saveSession(account);
  check('повторный saveSession — подписка вызвана снова', notified === 2);

  unsubscribe();
  auth.saveSession(account);
  check('после отписки — подписка не вызывается', notified === 2);

  auth.clearSession();
  check('после clearSession — не авторизован', auth.isAuthenticated() === false);
  check('loadSession после выхода → null', auth.loadSession() === null);

  console.log('— fmtHourlySalary —');
  check('от и до', normSpace(fmtHourlySalary(900, 1100)) === '900 – 1 100 ₽/час', fmtHourlySalary(900, 1100));
  check('только от', normSpace(fmtHourlySalary(900, null)) === 'от 900 ₽/час', fmtHourlySalary(900, null));
  check('только до', normSpace(fmtHourlySalary(null, 1100)) === 'до 1 100 ₽/час', fmtHourlySalary(null, 1100));
  check('пусто → ""', fmtHourlySalary(null, null) === '');

  console.log('— countWords —');
  check('"Машинист буровой установки" → 3', countWords('Машинист буровой установки') === 3);
  check('4 слова → 4', countWords('а б в г') === 4);
  check('двойные пробелы схлопываются', countWords('  а   б  ') === 2);
  check('пусто → 0', countWords('') === 0);
  check('null → 0', countWords(null) === 0);

  console.log(failures === 0 ? '\nВСЕ ТЕСТЫ ПРОЙДЕНЫ' : `\nПРОВАЛЕНО: ${failures}`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
