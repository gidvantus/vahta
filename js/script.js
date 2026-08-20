/* ==========================================================================
   Вахта.ру — каталог вакансий
   Скрипт отделён от разметки (js/script.js)
   Данные, фильтры, сортировка, отклик
   ========================================================================== */

'use strict';

/* ------------------------------ Данные --------------------------------- */

const VACANCIES = [
  { id: 1,  title: 'Машинист буровой установки',         salaryFrom: 180000, salaryTo: 220000, city: 'Новый Уренгой', schedule: '30/30',  company: 'Газпром нефть',      logo: 'img/gazprom.svg',       dateLabel: 'Сегодня',      dateDays: 0 },
  { id: 2,  title: 'Водитель самосвала (кат. АIII)',     salaryFrom: 180000, salaryTo: 220000, city: 'Талнах',        schedule: '30/30',  company: 'Норникель',          logo: 'img/nornickel.svg',     dateLabel: 'Сегодня',      dateDays: 0 },
  { id: 3,  title: 'Электрогазосварщик НАКС',            salaryFrom: 180000, salaryTo: 220000, city: 'Пермь',         schedule: '30/30',  company: 'Лукойл',             logo: 'img/lukoil.svg',        dateLabel: 'Вчера',         dateDays: 1 },
  { id: 4,  title: 'Аппаратчик химического производства', salaryFrom: 180000, salaryTo: 220000, city: 'Тобольск',      schedule: '30/30',  company: 'СИБУР',              logo: 'img/sibur.svg',         dateLabel: '2 дня назад',   dateDays: 2 },
  { id: 5,  title: 'Машинист экскаватора',               salaryFrom: 150000, salaryTo: 180000, city: 'Красноярск',    schedule: '45/15',  company: 'ООО «Сибстрой»',     logo: 'img/sibstroy.svg',      dateLabel: 'Сегодня',      dateDays: 0 },
  { id: 6,  title: 'Водитель самосвала (кат. С)',        salaryFrom: 120000, salaryTo: 140000, city: 'Иркутск',       schedule: '60/30',  company: 'ООО «ТрансСервис»',  logo: 'img/transservice.svg',  dateLabel: '3 дня назад',   dateDays: 3 },
  { id: 7,  title: 'Электрогазосварщик',                 salaryFrom: 130000, salaryTo: 160000, city: 'Новый Уренгой', schedule: '60/30',  company: 'ООО «Газстрой»',     logo: 'img/gazstroy.svg',      dateLabel: '5 дней назад',  dateDays: 5 },
  { id: 8,  title: 'Разнорабочий',                       salaryFrom: 70000,  salaryTo: 90000,  city: 'Москва',        schedule: '15/15',  company: 'ООО «АлмазДорСтрой»', logo: 'img/almazdorstroy.svg', dateLabel: 'Сегодня',      dateDays: 0 },
  { id: 9,  title: 'Слесарь-ремонтник',                  salaryFrom: 100000, salaryTo: 130000, city: 'Санкт-Петербург', schedule: '30/30', company: 'Газпром нефть',      logo: 'img/gazprom.svg',       dateLabel: 'Вчера',         dateDays: 1 },
  { id: 10, title: 'Монтажник',                          salaryFrom: 90000,  salaryTo: 120000, city: 'Новосибирск',   schedule: '15/15',  company: 'ООО «ТрансСервис»',  logo: 'img/transservice.svg',  dateLabel: '4 дня назад',   dateDays: 4 },
  { id: 11, title: 'Крановщик',                          salaryFrom: 160000, salaryTo: 200000, city: 'Новый Уренгой', schedule: '45/15',  company: 'Норникель',          logo: 'img/nornickel.svg',     dateLabel: 'Сегодня',      dateDays: 0 },
  { id: 12, title: 'Оператор технологических установок', salaryFrom: 140000, salaryTo: 170000, city: 'Тобольск',      schedule: '90/60',  company: 'СИБУР',              logo: 'img/sibur.svg',         dateLabel: '6 дней назад',  dateDays: 6 },
  { id: 13, title: 'Бурильщик',                          salaryFrom: 200000, salaryTo: 250000, city: 'Новый Уренгой', schedule: '30/30',  company: 'Газпром нефть',      logo: 'img/gazprom.svg',       dateLabel: 'Сегодня',      dateDays: 0 },
];

/* Основные города (показываются сразу), остальные — по кнопке «Показать все» */
const MAIN_CITIES = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Красноярск', 'Новый Уренгой'];

const STANDARD_SCHEDULES = new Set(['15/15', '30/30', '45/15', '60/30']);

const SALARY_OPTIONS = [
  { value: 'any',       label: 'Любая',            min: null,     specified: false },
  { value: 'specified', label: 'Указана зарплата', min: null,     specified: true },
  { value: '100k',      label: 'от 100 000 ₽',     min: 100000,   specified: false },
  { value: '150k',      label: 'от 150 000 ₽',     min: 150000,   specified: false },
  { value: '200k',      label: 'от 200 000 ₽',     min: 200000,   specified: false },
];

/* ------------------------------ Состояние ------------------------------ */

const state = {
  query: '',
  cities: new Set(),          // выбранные города
  salary: 'any',
  schedule: 'any',
  sort: 'date',               // date | salary-desc | salary-asc
  showAllCities: false,
};

/* ------------------------------- DOM ----------------------------------- */

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const els = {
  headerSearch: $('#headerSearch'),
  citySearch: $('#citySearch'),
  cityList: $('#cityList'),
  cityExtraList: $('#cityExtraList'),
  cityMoreBtn: $('#cityMoreBtn'),
  salaryList: $('#salaryList'),
  scheduleList: $('#scheduleList'),
  resetBtn: $('#resetFilters'),
  foundCount: $('#foundCount'),
  vacancyList: $('#vacancyList'),
  sortBtn: $('#sortBtn'),
  sortLabel: $('#sortLabel'),
  sortMenu: $('#sortMenu'),
};

/* --------------------------- Вспомогательные --------------------------- */

function fmtSalary(from, to) {
  const n = (v) => v.toLocaleString('ru-RU');
  return `${n(from)} – ${n(to)} ₽`;
}

function plural(n, forms) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
  return forms[2];
}

function showToast(html) {
  let toast = $('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = html;
  toast.classList.add('is-visible');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

/* ----------------------------- Рендер карточек -------------------------- */

function renderCards(list) {
  els.vacancyList.innerHTML = '';

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <img class="icon" src="img/icon-search.svg" alt="">
      <h3>Ничего не найдено</h3>
      <p>По вашему запросу вакансий нет. Попробуйте изменить фильтры или запрос.</p>
      <button class="btn btn--ghost" type="button" id="emptyReset">Сбросить фильтры</button>`;
    els.vacancyList.appendChild(empty);
    $('#emptyReset', empty).addEventListener('click', resetFilters);
    return;
  }

  const frag = document.createDocumentFragment();
  list.forEach((v) => {
    const card = document.createElement('article');
    card.className = 'vacancy-card';
    card.dataset.id = v.id;
    card.innerHTML = `
      <div class="vacancy-card__company">
        <img src="${v.logo}" alt="${v.company}">
      </div>
      <div class="vacancy-card__body">
        <div class="vacancy-card__top">
          <h3 class="vacancy-card__title"><a href="#" data-title="${v.id}">${v.title}</a></h3>
          <span class="vacancy-card__date">
            <img class="icon" src="img/icon-clock.svg" alt="">
            ${v.dateLabel}
          </span>
        </div>
        <p class="vacancy-card__salary">${fmtSalary(v.salaryFrom, v.salaryTo)}</p>
        <div class="vacancy-card__meta">
          <span><img class="icon" src="img/icon-pin.svg" alt="">${v.city}</span>
          <span class="schedule-chip"><img class="icon" src="img/icon-calendar.svg" alt="">Вахта ${v.schedule}</span>
        </div>
        <p class="vacancy-card__company-line">
          <img class="icon" src="img/icon-check.svg" alt="">
          Проверенная компания · <b>${v.company}</b>
        </p>
      </div>
      <div class="vacancy-card__actions">
        <button class="btn btn--apply" type="button" data-apply="${v.id}">Откликнуться</button>
      </div>`;
    frag.appendChild(card);
  });
  els.vacancyList.appendChild(frag);
}

/* ----------------------------- Фильтрация ------------------------------- */

function matchesBase(v) {
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = `${v.title} ${v.company} ${v.city} ${v.schedule}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (state.cities.size && !state.cities.has(v.city)) return false;
  if (state.salary !== 'any') {
    if (state.salary === 'specified') {
      if (!v.salaryFrom) return false;
    } else {
      const opt = SALARY_OPTIONS.find((o) => o.value === state.salary);
      if (!opt || !v.salaryFrom || v.salaryFrom < opt.min) return false;
    }
  }
  if (state.schedule !== 'any') {
    if (state.schedule === 'other') {
      if (STANDARD_SCHEDULES.has(v.schedule)) return false;
    } else if (v.schedule !== state.schedule) {
      return false;
    }
  }
  return true;
}

/* Число вакансий под опцию с учётом остальных активных фильтров */
function countFor(group, option) {
  return VACANCIES.filter((v) => {
    if (state.query) {
      const q = state.query.toLowerCase();
      const hay = `${v.title} ${v.company} ${v.city} ${v.schedule}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (group === 'city') {
      const union = new Set(state.cities);
      union.add(option);
      if (!union.has(v.city)) return false;
    } else if (state.cities.size && !state.cities.has(v.city)) {
      return false;
    }

    if (group === 'salary') {
      if (option === 'specified' ? !v.salaryFrom : !(v.salaryFrom && v.salaryFrom >= (SALARY_OPTIONS.find((o) => o.value === option) || {}).min)) return false;
    } else if (state.salary !== 'any') {
      if (state.salary === 'specified') {
        if (!v.salaryFrom) return false;
      } else {
        const opt = SALARY_OPTIONS.find((o) => o.value === state.salary);
        if (!opt || !v.salaryFrom || v.salaryFrom < opt.min) return false;
      }
    }

    if (group === 'schedule') {
      if (option === 'other' ? STANDARD_SCHEDULES.has(v.schedule) : v.schedule !== option) return false;
    } else if (state.schedule !== 'any') {
      if (state.schedule === 'other') {
        if (STANDARD_SCHEDULES.has(v.schedule)) return false;
      } else if (v.schedule !== state.schedule) return false;
    }
    return true;
  }).length;
}

function applyFilters() {
  let list = VACANCIES.filter(matchesBase);

  switch (state.sort) {
    case 'salary-desc': list = [...list].sort((a, b) => b.salaryFrom - a.salaryFrom); break;
    case 'salary-asc':  list = [...list].sort((a, b) => a.salaryFrom - b.salaryFrom); break;
    default:            list = [...list].sort((a, b) => a.dateDays - b.dateDays || b.id - a.id);
  }

  renderCards(list);
  updateCounts();
  els.foundCount.textContent = list.length.toLocaleString('ru-RU');
  $('#foundWord').textContent = plural(list.length, ['вакансия', 'вакансии', 'вакансий']);
}

/* ----------------------------- Счётчики фильтров ------------------------ */

function updateCounts() {
  $$('.filter-item[data-city]').forEach((item) => {
    const count = countFor('city', item.dataset.city);
    $('.filter-item__count', item).textContent = count;
    item.classList.toggle('is-empty', count === 0);
  });
  $$('.filter-item[data-salary]').forEach((item) => {
    const count = countFor('salary', item.dataset.salary);
    $('.filter-item__count', item).textContent = count;
  });
  $$('.filter-item[data-schedule]').forEach((item) => {
    const count = countFor('schedule', item.dataset.schedule);
    $('.filter-item__count', item).textContent = count;
  });
}

/* ------------------------------ Построение сайдбара --------------------- */

function buildCityList() {
  const cities = [...new Set(VACANCIES.map((v) => v.city))];
  const main = cities.filter((c) => MAIN_CITIES.includes(c));
  const extra = cities.filter((c) => !MAIN_CITIES.includes(c));

  els.cityList.innerHTML = '';
  main.forEach((city) => els.cityList.appendChild(makeCityItem(city)));

  els.cityExtraList.innerHTML = '';
  extra.forEach((city) => els.cityExtraList.appendChild(makeCityItem(city)));

  els.cityMoreBtn.classList.toggle('hidden', extra.length === 0);
  els.cityMoreBtn.classList.remove('is-open');
  els.cityExtraList.classList.add('hidden');
}

function makeCityItem(city) {
  const li = document.createElement('li');
  li.className = 'filter-item';
  li.dataset.city = city;
  li.innerHTML = `
    <label>
      <input type="checkbox" value="${city}">
      <span class="filter-item__name">${city}</span>
      <span class="filter-item__count">0</span>
    </label>`;
  li.addEventListener('change', () => {
    if (li.querySelector('input').checked) state.cities.add(city);
    else state.cities.delete(city);
    applyFilters();
  });
  return li;
}

function buildSalaryList() {
  els.salaryList.innerHTML = '';
  SALARY_OPTIONS.forEach((opt) => {
    const li = document.createElement('li');
    li.className = 'filter-item';
    li.dataset.salary = opt.value;
    li.innerHTML = `
      <label>
        <input type="radio" name="salary" value="${opt.value}" ${opt.value === 'any' ? 'checked' : ''}>
        <span class="filter-item__name">${opt.label}</span>
        <span class="filter-item__count">0</span>
      </label>`;
    li.addEventListener('change', () => {
      if (li.querySelector('input').checked) {
        state.salary = opt.value;
        applyFilters();
      }
    });
    els.salaryList.appendChild(li);
  });
}

function buildScheduleList() {
  const opts = ['any', '15/15', '30/30', '45/15', '60/30', 'other'];
  const labels = { any: 'Любой', other: 'Другой' };
  els.scheduleList.innerHTML = '';
  opts.forEach((val) => {
    const li = document.createElement('li');
    li.className = 'filter-item';
    li.dataset.schedule = val;
    li.innerHTML = `
      <label>
        <input type="radio" name="schedule" value="${val}" ${val === 'any' ? 'checked' : ''}>
        <span class="filter-item__name">${labels[val] || val}</span>
        <span class="filter-item__count">0</span>
      </label>`;
    li.addEventListener('change', () => {
      if (li.querySelector('input').checked) {
        state.schedule = val;
        applyFilters();
      }
    });
    els.scheduleList.appendChild(li);
  });
}

/* ------------------------------- Сброс ---------------------------------- */

function resetFilters() {
  state.query = '';
  state.cities.clear();
  state.salary = 'any';
  state.schedule = 'any';
  state.sort = 'date';

  els.headerSearch.value = '';
  els.citySearch.value = '';
  $$('#cityList input, #cityExtraList input').forEach((i) => { i.checked = false; });
  $$('input[name="salary"]').forEach((i) => { i.checked = i.value === 'any'; });
  $$('input[name="schedule"]').forEach((i) => { i.checked = i.value === 'any'; });
  filterCityItems('');
  setSort('date');
  applyFilters();
}

/* ---------------------------- Сортировка -------------------------------- */

const SORT_OPTIONS = {
  date: 'По дате',
  'salary-desc': 'По зарплате (сначала выше)',
  'salary-asc': 'По зарплате (сначала ниже)',
};

function setSort(value) {
  state.sort = value;
  els.sortLabel.textContent = SORT_OPTIONS[value];
  $$('.sort__option').forEach((o) => o.classList.toggle('is-active', o.dataset.sort === value));
  applyFilters();
}

/* --------------------------- Поиск города ------------------------------- */

function filterCityItems(query) {
  const q = query.trim().toLowerCase();
  let visible = 0;
  $$('.filter-item[data-city]').forEach((item) => {
    const match = !q || item.dataset.city.toLowerCase().includes(q);
    item.classList.toggle('hidden', !match);
    if (match) visible++;
  });
  return visible;
}

/* ------------------------------- Инициализация --------------------------- */

function init() {
  buildCityList();
  buildSalaryList();
  buildScheduleList();

  /* поиск по ключевому слову */
  let debounce;
  els.headerSearch.addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.query = e.target.value.trim();
      applyFilters();
    }, 180);
  });

  /* поиск по городу в сайдбаре */
  els.citySearch.addEventListener('input', (e) => {
    filterCityItems(e.target.value);
  });

  /* «Показать все» — дополнительные города */
  els.cityMoreBtn.addEventListener('click', () => {
    state.showAllCities = !state.showAllCities;
    els.cityMoreBtn.classList.toggle('is-open', state.showAllCities);
    els.cityExtraList.classList.toggle('hidden', !state.showAllCities);
    const label = $('#cityMoreLabel');
    label.textContent = state.showAllCities ? 'Свернуть' : 'Показать все';
  });

  /* сброс фильтров */
  els.resetBtn.addEventListener('click', resetFilters);

  /* сортировка */
  els.sortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    els.sortBtn.classList.toggle('is-open');
  });
  document.addEventListener('click', () => els.sortBtn.classList.remove('is-open'));
  els.sortMenu.addEventListener('click', (e) => {
    const opt = e.target.closest('.sort__option');
    if (opt) {
      setSort(opt.dataset.sort);
      els.sortBtn.classList.remove('is-open');
    }
  });

  /* отклик */
  els.vacancyList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-apply]');
    if (btn && !btn.classList.contains('is-applied')) {
      const v = VACANCIES.find((x) => String(x.id) === btn.dataset.apply);
      btn.classList.add('is-applied');
      btn.textContent = 'Откликнуться ✓';
      showToast(`Отклик отправлен! Компания <b>${v ? v.company : ''}</b> получила ваше резюме.`);
    }
  });

  applyFilters();
}

document.addEventListener('DOMContentLoaded', init);
