import { useState } from 'react';
import Carousel from './Carousel';
import { fmtHourlySalary, fmtSalary, normalizeLogo } from '../lib/format.js';
import { showToast } from '../lib/toast.js';

/* Иконки (те же, что на странице карточки). */
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
const IconNo = (
  <svg className="icon" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#c03d3d" /><path d="M6.5 6.5l7 7M13.5 6.5l-7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
);

/* Подписи значений карточки. */
const MEALS_LABEL = { no: 'Нет', '1': 'Да, 1-разовое', '2': 'Да, 2-разовое', '3': 'Да, 3-разовое' };
const MED_BOOK_LABEL = { yes: 'Да', no: 'Нет', help: 'Да, помогаем сделать' };
const CLOTHING_LABEL = { yes: 'Да', no: 'Нет', provided: 'Да, предоставляем' };

function lines(text) {
  return (text || '')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function RequirementItem({ label, value, yes }) {
  const icon = yes ? IconYes : IconNo;
  return (
    <div className="req-item">
      <span>{label}</span>
      <span className={yes ? 'req-item__value req-item__value--yes' : 'req-item__value req-item__value--no'}>
        {icon}{value}
      </span>
    </div>
  );
}

/* Рендер полной карточки вакансии из данных (API или предосмотр формы).
   preview — скрывает кнопки «Откликнуться» (предосмотр перед публикацией). */
export default function VacancyView({ vacancy, preview = false }) {
  const [applied, setApplied] = useState(false);
  const v = vacancy || {};

  const workPhotos = (v.work_photos || []).map(normalizeLogo);
  const dormPhotos = (v.dorm_photos || []).map(normalizeLogo);
  const logo = normalizeLogo(v.logo);

  const shiftLength = v.shift_length || [];
  const workSchedule = v.work_schedule || [];
  const hoursPerShift = v.hours_per_shift || [];

  const shiftChip = shiftLength.length ? `Вахта ${shiftLength.join('/')} дней` : '';
  const scheduleChip = v.schedule ? `Вахта ${v.schedule}` : shiftChip;
  const hoursChip = hoursPerShift.length ? `${hoursPerShift.join('/')} часов в смену` : '';

  const salaryMain = fmtSalary(v.salary_from, v.salary_to);
  const hourly = fmtHourlySalary(v.salary_hourly_from, v.salary_hourly_to);

  function handleApply() {
    if (applied || preview) return;
    setApplied(true);
    showToast(`Отклик отправлен! Компания <b>${v.company}</b> получила ваше резюме.`);
  }

  const applyButton = (id) => (
    <button
      className={applied ? 'btn btn--apply is-applied' : 'btn btn--apply'}
      id={id}
      type="button"
      onClick={handleApply}
      disabled={preview}
    >
      {applied ? 'Откликнуться ✓' : 'Откликнуться'}
    </button>
  );

  const requirements = [];
  if (v.experience_required != null) {
    requirements.push(
      <RequirementItem
        key="exp"
        label="Опыт работы"
        value={v.experience_required ? 'Да' : 'Нет'}
        yes={!!v.experience_required}
      />,
    );
  }
  if (v.med_book) {
    requirements.push(
      <RequirementItem key="med" label="Медкнижка" value={MED_BOOK_LABEL[v.med_book] || v.med_book} yes={v.med_book !== 'no'} />,
    );
  }
  if (v.clothing) {
    requirements.push(
      <RequirementItem key="cloth" label="Спецодежда" value={CLOTHING_LABEL[v.clothing] || v.clothing} yes={v.clothing !== 'no'} />,
    );
  }
  if (v.meals) {
    requirements.push(
      <RequirementItem key="meals" label="Питание" value={MEALS_LABEL[v.meals] || v.meals} yes={v.meals !== 'no'} />,
    );
  }
  if (v.travel_paid != null) {
    requirements.push(
      <RequirementItem key="travel" label="Оплачиваем проезд" value={v.travel_paid ? 'Да' : 'Нет'} yes={!!v.travel_paid} />,
    );
  }

  return (
    <div className="vacancy-view">
      {/* Шапка вакансии */}
      <section className="vacancy-hero">
        <div className="vacancy-hero__info">
          <h1 className="vacancy-hero__title">{v.title || 'Без названия'}</h1>
          {v.company && (
            <p className="vacancy-hero__company">
              {v.company}
              {v.verified && <span className="vacancy-hero__verified">{IconVerified}проверенная компания</span>}
            </p>
          )}
          {(v.city || scheduleChip || hoursChip) && (
            <div className="chips">
              {v.city && <span className="chip">{IconPin}{v.city}</span>}
              {scheduleChip && <span className="chip">{IconCalendar}{scheduleChip}</span>}
              {hoursChip && <span className="chip">{IconClock}{hoursChip}</span>}
            </div>
          )}
        </div>

        <div className="vacancy-hero__actions">
          {(salaryMain !== 'Зарплата не указана' || hourly) && (
            <p className="vacancy-hero__salary">
              {salaryMain !== 'Зарплата не указана' ? salaryMain : hourly}
              <small>
                {salaryMain !== 'Зарплата не указана' && 'в месяц'}
                {salaryMain !== 'Зарплата не указана' && hourly && ' · '}
                {hourly && 'в час'}
              </small>
            </p>
          )}
          {!preview && applyButton('applyBtn')}
        </div>
      </section>

      <div className="vacancy-layout">
        <div className="vacancy-main">
          {workPhotos.length > 0 && (
            <section className="vsection">
              <h2 className="vsection__title">Фото места работы</h2>
              <Carousel items={workPhotos} altPrefix="Фото места работы" />
            </section>
          )}

          {v.description && (
            <section className="vsection">
              <h2 className="vsection__title">Описание вакансии</h2>
              {lines(v.description).map((p, i) => <p key={i}>{p}</p>)}
            </section>
          )}

          {v.duties && (
            <section className="vsection">
              <h2 className="vsection__title">Обязанности</h2>
              <ul className="vlist">{lines(v.duties).map((d, i) => <li key={i}>{d}</li>)}</ul>
            </section>
          )}

          {v.promos && v.promos.length > 0 && (
            <section className="vsection">
              <h2 className="vsection__title">Акции клиента</h2>
              <div className="promo">
                {v.promos.map((p, i) => (
                  <div className="promo__item" key={i}>
                    <span className="promo__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5z" /></svg>
                    </span>
                    <div>
                      <b className="promo__title">{p.title || 'Акция'}</b>
                      {p.text && <span className="promo__text">{p.text}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {dormPhotos.length > 0 && (
            <section className="vsection">
              <h2 className="vsection__title">Фото места проживания</h2>
              <Carousel items={dormPhotos} altPrefix="Фото общежития" />
            </section>
          )}

          {v.living_conditions && (
            <section className="vsection">
              <h2 className="vsection__title">Условия проживания</h2>
              <ul className="vlist">{lines(v.living_conditions).map((d, i) => <li key={i}>{d}</li>)}</ul>
            </section>
          )}

          {(v.dorm_address || v.dorm_route || v.dorm_route_photo) && (
            <section className="vsection">
              <h2 className="vsection__title">
                {v.dorm_route || v.dorm_route_photo ? 'Схема проезда' : 'Общежитие'}
              </h2>
              {v.dorm_address && (
                <p className="route-address">
                  {IconPin}
                  <span>Адрес общежития: <b>{v.dorm_address}</b></span>
                </p>
              )}
              {v.dorm_route && lines(v.dorm_route).map((p, i) => <p key={i}>{p}</p>)}
              {v.dorm_route_photo && (
                <figure className="route-map">
                  <img src={normalizeLogo(v.dorm_route_photo)} alt="Схема проезда к общежитию" />
                </figure>
              )}
            </section>
          )}
        </div>

        {/* Сайдбар */}
        <aside className="vacancy-side">
          {(salaryMain !== 'Зарплата не указана' || hourly || hoursPerShift.length > 0) && (
            <div className="side-card">
              <h3 className="side-card__title">О вакансии</h3>
              <dl className="side-list">
                {salaryMain !== 'Зарплата не указана' && (
                  <div>
                    <dt>Зарплата</dt>
                    <dd>{salaryMain}</dd>
                  </div>
                )}
                {hourly && (
                  <div>
                    <dt>Зарплата в час</dt>
                    <dd>{hourly}</dd>
                  </div>
                )}
                {hoursPerShift.length > 0 && (
                  <div>
                    <dt>Рабочих часов</dt>
                    <dd>{hoursPerShift.join(' / ')} в смену</dd>
                  </div>
                )}
              </dl>

              {workSchedule.length > 0 && (
                <>
                  <p className="side-card__label">График работы</p>
                  <div className="option-chips">
                    {workSchedule.map((s) => (
                      <span className="option-chip is-active" key={s}>{s}</span>
                    ))}
                  </div>
                </>
              )}

              {shiftLength.length > 0 && (
                <>
                  <p className="side-card__label">Продолжительность вахты</p>
                  <div className="option-chips">
                    {shiftLength.map((d) => (
                      <span className="option-chip is-active" key={d}>{d} дней</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {requirements.length > 0 && (
            <div className="side-card">
              <h3 className="side-card__title">Требования</h3>
              {requirements}
              {v.experience_required && v.experience_requirements && (
                <p className="req-note">{v.experience_requirements}</p>
              )}
            </div>
          )}

          {v.company && (
            <div className="side-card side-employer">
              <h3 className="side-card__title">Работодатель</h3>
              {logo ? (
                <img src={logo} alt={v.company} />
              ) : (
                <span className="vacancy-card__logo-fallback" aria-hidden="true">
                  {(v.company || '?').trim().charAt(0).toUpperCase()}
                </span>
              )}
              {!preview && applyButton('applyBtnSide')}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
