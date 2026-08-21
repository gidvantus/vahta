import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchVacancy } from '../api.js';
import Header from '../components/Header';
import VacancyView from '../components/VacancyView';
import '../../css/vacancy.css';

export default function VacancyPage() {
  const { id } = useParams();
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [vacancy, setVacancy] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setVacancy(null);
    fetchVacancy(id)
      .then((v) => {
        if (!alive) return;
        setVacancy(v);
        setStatus('ready');
        document.title = `${v.title} — Вахта.ру`;
      })
      .catch((e) => {
        if (!alive) return;
        setError(e.message);
        setStatus('error');
        document.title = 'Вакансия — Вахта.ру';
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const notFound = /не найдена/i.test(error);
  const netError = /failed to fetch|networkerror|load failed/i.test(error);
  const errorText = netError ? 'Проверьте соединение с сервером и попробуйте ещё раз.' : error;

  return (
    <>
      <Header />

      <main className="vacancy-page container">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span className="sep">/</span>
          <a href="/">Каталог вакансий</a>
          <span className="sep">/</span>
          <span className="current">{status === 'ready' ? vacancy.title : 'Вакансия'}</span>
        </nav>

        {status === 'loading' && (
          <div className="empty-state">
            <h3>Загружаем вакансию…</h3>
          </div>
        )}

        {status === 'error' && (
          <div className="empty-state">
            <h3>{notFound ? 'Вакансия не найдена' : 'Не удалось загрузить вакансию'}</h3>
            <p>{errorText}</p>
            <a className="btn btn--ghost" href="/">К каталогу вакансий</a>
          </div>
        )}

        {status === 'ready' && <VacancyView vacancy={vacancy} />}
      </main>
    </>
  );
}
