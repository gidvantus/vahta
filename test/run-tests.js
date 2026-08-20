/* Минимальный фейковый DOM для функционального теста js/script.js */
'use strict';

const fs = require('fs');
const path = require('path');

/* ---------------------------- fake DOM ---------------------------- */

const registry = [];

class FakeClassList {
  constructor(el) { this.el = el; }
  add(...cls) { for (const c of cls) if (!this.el._classes.includes(c)) this.el._classes.push(c); }
  remove(...cls) { this.el._classes = this.el._classes.filter((c) => !cls.includes(c)); }
  toggle(c, force) {
    const has = this.el._classes.includes(c);
    const want = force === undefined ? !has : !!force;
    if (want) this.add(c); else this.remove(c);
    return want;
  }
  contains(c) { return this.el._classes.includes(c); }
}

class FakeNode {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parent = null;
    this.attrs = {};
    this.dataset = {};
    this._classes = [];
    this._className = '';
    this._textContent = '';
    this.value = '';
    this.checked = false;
    this._html = '';
    this.listeners = {};
    this.id = '';
    this.classList = new FakeClassList(this);
    Object.defineProperty(this, 'className', {
      get() { return this._className; },
      set(v) { this._className = v; this._classes = String(v).split(/\s+/).filter(Boolean); },
    });
    Object.defineProperty(this, 'textContent', {
      get() { return this._textContent; },
      set(v) { this._textContent = String(v); },
    });
  }
  set innerHTML(v) {
    this._html = v;
    this.children = [];
    parseHtml(v, this);
  }
  get innerHTML() { return this._html; }
  appendChild(c) { c.parent = this; this.children.push(c); registry.push(c); return c; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  querySelector(sel) { return queryAll(this, sel)[0] || null; }
  querySelectorAll(sel) { return queryAll(this, sel); }
  closest(sel) { let n = this; while (n) { if (matches(n, sel)) return n; n = n.parent; } return null; }
  remove() { /* noop */ }
}

function parseHtml(html, parent) {
  const tagRe = /<(\/?)([a-zA-Z0-9]+)([^>]*)>/g;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    if (m[1] === '/') continue;
    const node = new FakeNode(m[2]);
    const attrs = m[3] || '';
    // class
    const cm = attrs.match(/class="([^"]*)"/);
    if (cm) { node._classes = cm[1].split(/\s+/).filter(Boolean); node.className = cm[1]; }
    // id
    const im = attrs.match(/id="([^"]*)"/);
    if (im) node.id = im[1];
    // value / name / type / checked
    const vm = attrs.match(/value="([^"]*)"/); if (vm) node.value = vm[1];
    const nm = attrs.match(/name="([^"]*)"/); if (nm) node.attrs.name = nm[1];
    const tm = attrs.match(/type="([^"]*)"/); if (tm) node.attrs.type = tm[1];
    if (/checked/.test(attrs)) node.checked = true;
    // data-*
    for (const dm of attrs.matchAll(/data-([a-z]+)="([^"]*)"/g)) node.dataset[dm[1]] = dm[2];
    parent.appendChild(node);
  }
}

function hasClass(node, cls) { return node._classes.includes(cls); }

function matches(node, sel) {
  sel = sel.trim();
  const tagM = sel.match(/^([a-z]+)?(#[\w-]+|\.([\w-]+))?(\[([\w-]+)(?:="?([^"\]]*)"?)?\])?$/);
  if (!tagM) return false;
  const [, tag, idOrCls, cls, , attr, val] = tagM;
  if (tag && node.tagName.toLowerCase() !== tag) return false;
  if (idOrCls) {
    if (idOrCls[0] === '#') { if (node.id !== idOrCls.slice(1)) return false; }
    else if (cls && !hasClass(node, cls)) return false;
  }
  if (attr) {
    const key = attr.startsWith('data-') ? attr.slice(5) : attr;
    const attrVal = node.attrs[key] !== undefined ? node.attrs[key]
      : node.dataset[key] !== undefined ? node.dataset[key] : undefined;
    if (val === undefined || val === '') { if (attrVal === undefined) return false; }
    else if (attrVal !== val) return false;
  }
  return true;
}

function allDescendants(node, out) {
  for (const c of node.children) { out.push(c); allDescendants(c, out); }
  return out;
}

function splitTopLevel(part) {
  /* разбиение по пробелам вне квадратных скобок (для селекторов-потомков) */
  const out = [];
  let depth = 0, cur = '';
  for (const ch of part) {
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    if (ch === ' ' && depth === 0) { if (cur) { out.push(cur); cur = ''; } }
    else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

function queryAll(root, selector) {
  const parts = selector.split(',').map((s) => s.trim()).filter(Boolean);
  const res = [];
  for (let part of parts) {
    part = part.trim();
    const sub = splitTopLevel(part);
    if (sub.length > 1) {
      const [a, ...rest] = sub;
      let anchors = queryAll(root, a);
      for (const b of rest) {
        const next = [];
        for (const an of anchors) {
          for (const d of allDescendants(an, [])) if (matches(d, b)) next.push(d);
        }
        anchors = next;
      }
      res.push(...anchors);
    } else {
      const scope = root === document ? registry : allDescendants(root, [root]);
      for (const n of scope) if (matches(n, part)) res.push(n);
    }
  }
  return res;
}

const document = {
  _registry: registry,
  addEventListener(type, fn) { if (type === 'DOMContentLoaded') this._domReady = fn; },
  createElement(tag) { return new FakeNode(tag); },
  createDocumentFragment() { return new FakeNode('fragment'); },
  querySelector(sel) { return queryAll(this, sel)[0] || null; },
  querySelectorAll(sel) { return queryAll(this, sel); },
  body: new FakeNode('body'),
  dispatchReady() { if (this._domReady) this._domReady(); },
};

global.document = document;

/* -------------------- статическая разметка (из index.html) -------------------- */

function staticNode(id, tag = 'div') {
  const n = new FakeNode(tag);
  n.id = id;
  document.body.appendChild(n);
  return n;
}

const ids = ['headerSearch', 'citySearch', 'cityList', 'cityExtraList', 'cityMoreBtn', 'cityMoreLabel',
  'salaryList', 'scheduleList', 'resetFilters', 'foundCount', 'foundWord', 'vacancyList',
  'sortBtn', 'sortLabel', 'sortMenu'];
ids.forEach((id) => staticNode(id, id === 'headerSearch' || id === 'citySearch' ? 'input' : 'div'));

// sort menu options
const sortMenu = document.querySelector('#sortMenu');
sortMenu.innerHTML = `
  <button class="sort__option is-active" type="button" data-sort="date">По дате</button>
  <button class="sort__option" type="button" data-sort="salary-desc">По зарплате (сначала выше)</button>
  <button class="sort__option" type="button" data-sort="salary-asc">По зарплате (сначала ниже)</button>`;

/* ---------------------------- загрузка скрипта ---------------------------- */

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'script.js'), 'utf8');
eval(code);
document.dispatchReady();

/* ------------------------------- проверки -------------------------------- */

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log('  ✓', name);
  else { failures++; console.error('  ✗', name, extra !== undefined ? '— got: ' + extra : ''); }
}

const text = (sel) => { const n = document.querySelector(sel); return n ? n.textContent : null; };
const count = (sel) => document.querySelectorAll(sel).length;
const itemCount = (sel) => {
  const it = document.querySelector(sel);
  return it ? it.querySelector('.filter-item__count').textContent : null;
};

console.log('— инициализация —');
check('init без ошибок', true);
check('найдено 13 вакансий', text('#foundCount') === '13', text('#foundCount'));
check('склонение "вакансий"', text('#foundWord') === 'вакансий', text('#foundWord'));
check('13 карточек отрисовано', count('#vacancyList .vacancy-card') === 13, count('#vacancyList .vacancy-card'));

console.log('— счётчики —');
check('город: Новый Уренгой = 4', itemCount('.filter-item[data-city="Новый Уренгой"]') === '4', itemCount('.filter-item[data-city="Новый Уренгой"]'));
check('город: Москва = 1', itemCount('.filter-item[data-city="Москва"]') === '1', itemCount('.filter-item[data-city="Москва"]'));
check('зарплата: от 100 000 = 11', itemCount('.filter-item[data-salary="100k"]') === '11', itemCount('.filter-item[data-salary="100k"]'));
check('зарплата: от 200 000 = 1', itemCount('.filter-item[data-salary="200k"]') === '1', itemCount('.filter-item[data-salary="200k"]'));
check('график: 30/30 = 6', itemCount('.filter-item[data-schedule="30/30"]') === '6', itemCount('.filter-item[data-schedule="30/30"]'));
check('график: Другой = 1', itemCount('.filter-item[data-schedule="other"]') === '1', itemCount('.filter-item[data-schedule="other"]'));

console.log('— фильтр по городу —');
const moscowLi = document.querySelector('.filter-item[data-city="Москва"]');
const moscowInput = moscowLi.querySelector('input');
moscowInput.checked = true;
moscowLi.listeners.change.forEach((fn) => fn());
check('Москва: найдено 1', text('#foundCount') === '1', text('#foundCount'));
check('Москва: "вакансия"', text('#foundWord') === 'вакансия', text('#foundWord'));
check('1 карточка', count('#vacancyList .vacancy-card') === 1, count('#vacancyList .vacancy-card'));
check('Новый Уренгой счётчик = 5 (юнион с Москвой)', itemCount('.filter-item[data-city="Новый Уренгой"]') === '5', itemCount('.filter-item[data-city="Новый Уренгой"]'));

console.log('— фильтр по зарплате (от 200 000) —');
const salary200 = document.querySelector('.filter-item[data-salary="200k"]');
salary200.querySelector('input').checked = true;
salary200.listeners.change.forEach((fn) => fn());
check('от 200 000 (Москва) = 0', text('#foundCount') === '0', text('#foundCount'));

console.log('— поиск —');
// сброс: снять Москва, вернуть зарплату на Любая
const moscowInput2 = document.querySelector('.filter-item[data-city="Москва"] input');
moscowInput2.checked = false;
document.querySelector('.filter-item[data-city="Москва"]').listeners.change.forEach((fn) => fn());
document.querySelector('.filter-item[data-salary="any"] input').checked = true;
document.querySelector('.filter-item[data-salary="any"]').listeners.change.forEach((fn) => fn());
const searchInput = document.querySelector('#headerSearch');
searchInput.value = 'сварщик';
searchInput.listeners.input.forEach((fn) => fn({ target: searchInput }));
setTimeout(() => {
  check('поиск "сварщик" = 2', text('#foundCount') === '2', text('#foundCount'));
  console.log('— сброс фильтров —');
  document.querySelector('#resetFilters').listeners.click.forEach((fn) => fn());
  check('после сброса = 13', text('#foundCount') === '13', text('#foundCount'));
  check('запрос очищен', document.querySelector('#headerSearch').value === '', document.querySelector('#headerSearch').value);

  console.log(failures === 0 ? '\nВСЕ ТЕСТЫ ПРОЙДЕНЫ ✓' : `\nПРОВАЛЕНО: ${failures}`);
  process.exit(failures === 0 ? 0 : 1);
}, 400);
