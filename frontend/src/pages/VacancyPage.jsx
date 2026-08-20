import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Carousel from '../components/Carousel';
import { showToast } from '../lib/toast.js';
import '../../css/vacancy.css';

const WORK_PHOTOS = ['/img/work-1.svg', '/img/work-2.svg', '/img/work-3.svg'];
const DORM_PHOTOS = ['/img/dorm-1.svg', '/img/dorm-2.svg', '/img/dorm-3.svg'];
const SCHEDULES = ['1/1', '2/2', '3/3', '5/2', '6/1'];
const SHIFT_LENGTHS = ['15 дней', '20 дней', '30 дней'];

const IconPin = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const IconCalendar = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
const IconClock = (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
);
const IconVerified = (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#056FF1" /><path d="M6 10.3l2.6 2.6L14.2 7.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const IconYes = (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#128a4f" /><path d="M6 10.3l2.6 2.6L14.2 7.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

function OptionChips({ options, defaultIndex = 0 }) {
  /* Отображение вариантов без интерактива (не кликабельны). */
  return (
    <div className="option-chips">
      {options.map((label, i) => (
        <span key={label} className={i === defaultIndex ? 'option-chip is-active' : 'option-chip'}>
          {label}
        </span>
      ))}
    </div>
  );
}

export default function VacancyPage() {
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    document.title = 'Машинист буровой установки — Вахта.ру';
  }, []);

  function handleApply() {
    if (applied) return;
    setApplied(true);
    showToast('Отклик отправлен! Работодатель получил ваше резюме.');
  }

  return (
    <>
      <Header />

      <main className="vacancy-page container">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span className="sep">/</span>
          <a href="/">Каталог вакансий</a>
          <span className="sep">/</span>
          <span className="current">Машинист буровой установки</span>
        </nav>

        {/* Шапка вакансии */}
        <section className="vacancy-hero">
          <div className="vacancy-hero__info">
            <h1 className="vacancy-hero__title">1111Машинист буровой установки</h1>
            <p className="vacancy-hero__company">
              Газпром нефть
              <span className="vacancy-hero__verified">{IconVerified}проверенная компания</span>
            </p>
            <div className="chips">
              <span className="chip">{IconPin}Новый Уренгой, ЯНАО</span>
              <span className="chip">{IconCalendar}Вахта 30/30</span>
              <span className="chip">{IconClock}11 часов в смену</span>
            </div>
          </div>

          <div className="vacancy-hero__actions">
            <p className="vacancy-hero__salary">
              180 000 – 220 000 ₽
              <small>в месяц, на руки</small>
            </p>
            <button
              className={applied ? 'btn btn--apply is-applied' : 'btn btn--apply'}
              id="applyBtn"
              type="button"
              onClick={handleApply}
            >
              {applied ? 'Откликнуться ✓' : 'Откликнуться'}
            </button>
          </div>
        </section>

        <div className="vacancy-layout">
          <div className="vacancy-main">

            {/* 7) Фото места работы */}
            <section className="vsection">
              <h2 className="vsection__title">Фото места работы</h2>
              <Carousel items={WORK_PHOTOS} altPrefix="Фото места работы" />
            </section>

            {/* 5) Описание вакансии */}
            <section className="vsection">
              <h2 className="vsection__title">Описание вакансии</h2>
              <p>На производственную площадку в Новом Уренгое требуется машинист буровой установки. Компания «Газпром нефть» — проверенный работодатель с прозрачными условиями и своевременными выплатами.</p>
              <p>Работа вахтовым методом 30/30. Проживание в благоустроенном общежитии и трёхразовое питание предоставляются за счёт компании. Спецодежда выдаётся при трудоустройстве.</p>
            </section>

            {/* 12) Обязанности */}
            <section className="vsection">
              <h2 className="vsection__title">Обязанности</h2>
              <ul className="vlist">
                <li>Управление буровой установкой при выполнении буровых работ</li>
                <li>Контроль технического состояния оборудования, своевременный ремонт</li>
                <li>Соблюдение техники безопасности и технологических регламентов</li>
                <li>Ведение документации по эксплуатации установки</li>
              </ul>
            </section>

            {/* 11) Акции клиента */}
            <section className="vsection">
              <h2 className="vsection__title">Акции клиента</h2>
              <div className="promo">
                <div className="promo__item">
                  <span className="promo__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12l2.5 2.5L16 9" /></svg>
                  </span>
                  <div>
                    <b className="promo__title">Приведи друга — получи 5 000 ₽</b>
                    <span className="promo__text">Премия за каждого приведённого вахтовика после первой вахты.</span>
                  </div>
                </div>
                <div className="promo__item">
                  <span className="promo__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5z" /></svg>
                  </span>
                  <div>
                    <b className="promo__title">Бонус за вахту 60 дней</b>
                    <span className="promo__text">+10 000 ₽ к зарплате при отработке вахты 60 дней без перерыва.</span>
                  </div>
                </div>
                <div className="promo__item">
                  <span className="promo__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l8 3.5v5.5c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5.5z" /></svg>
                  </span>
                  <div>
                    <b className="promo__title">Бесплатная спецодежда</b>
                    <span className="promo__text">Полный комплект спецодежды и средств защиты при трудоустройстве.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 8) Фото места проживания */}
            <section className="vsection">
              <h2 className="vsection__title">Фото места проживания</h2>
              <Carousel items={DORM_PHOTOS} altPrefix="Фото общежития" />
            </section>

            {/* 13) Условия проживания */}
            <section className="vsection">
              <h2 className="vsection__title">Условия проживания</h2>
              <ul className="vlist">
                <li>Бесплатное благоустроенное общежитие (2–3 человека в комнате)</li>
                <li>Трёхразовое питание в столовой за счёт компании</li>
                <li>Душевые, прачечная, комната отдыха, Wi-Fi в общежитии</li>
                <li>Доставка до места работы служебным транспортом</li>
              </ul>
            </section>

            {/* 6) Адрес общежития */}
            <section className="vsection">
              <h2 className="vsection__title">Общежитие</h2>
              <p className="route-address">
                {IconPin}
                <span>Адрес общежития: <b>г. Новый Уренгой, ул. Промысловая, д. 12</b></span>
              </p>
            </section>

          </div>

          {/* Сайдбар */}
          <aside className="vacancy-side">

            <div className="side-card">
              <h3 className="side-card__title">О вакансии</h3>
              <dl className="side-list">
                <div>
                  <dt>Зарплата</dt>
                  <dd>от 180 000 до 220 000 ₽</dd>
                </div>
                <div>
                  <dt>Рабочих часов</dt>
                  <dd>11 часов в смену</dd>
                </div>
              </dl>

              <p className="side-card__label">График работы</p>
              <OptionChips options={SCHEDULES} defaultIndex={1} />

              <p className="side-card__label">Продолжительность вахты</p>
              <OptionChips options={SHIFT_LENGTHS} defaultIndex={1} />
            </div>

            <div className="side-card">
              <h3 className="side-card__title">Требования</h3>
              <div className="req-item">
                <span>Опыт работы</span>
                <span className="req-item__value req-item__value--yes">{IconYes}Да</span>
              </div>
              <div className="req-item">
                <span>Медкнижка</span>
                <span className="req-item__value req-item__value--yes">{IconYes}Да</span>
              </div>
              <div className="req-item">
                <span>Спецодежда</span>
                <span className="req-item__value req-item__value--yes">{IconYes}Да</span>
              </div>
            </div>

            <div className="side-card side-employer">
              <h3 className="side-card__title">Работодатель</h3>
              <img src="/img/gazprom.svg" alt="Газпром нефть" />
              <button
                className={applied ? 'btn btn--apply is-applied' : 'btn btn--apply'}
                id="applyBtnSide"
                type="button"
                onClick={handleApply}
              >
                {applied ? 'Откликнуться ✓' : 'Откликнуться'}
              </button>
            </div>

          </aside>
        </div>
      </main>
    </>
  );
}
