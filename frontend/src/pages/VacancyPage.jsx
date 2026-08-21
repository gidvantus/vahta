import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchVacancyBySlug } from '../api.js';
import Header from '../components/Header';
import VacancyView from '../components/VacancyView';
import { loadSession } from '../lib/auth.js';
import '../../css/vacancy.css';

export default function VacancyPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isJobseeker = loadSession()?.user_type === 'jobseeker';
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [vacancy, setVacancy] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setVacancy(null);
    const jobseekerId = loadSession()?.jobseeker?.id;
    fetchVacancyBySlug(slug, { jobseekerId })
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
  }, [slug]);

  const notFound = /не найдена/i.test(error);
  const netError = /failed to fetch|networkerror|load failed/i.test(error);
  const errorText = netError ? 'Проверьте соединение с сервером и попробуйте ещё раз.' : error;

  function handleBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate('/jobseeker/vacancies');
  }

  return (
    <>
      <Header />
      <main className="vacancy-page container">
        {isJobseeker && (
          <button className="btn btn--ghost vacancy-back" type="button" onClick={handleBack}>
            ← Назад
          </button>
        )}
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <a href="/">Главная</a>
          <span className="sep">/</span>
          <a href="/">Каталог вакансий</a>
          <span className="sep">/</span>
          <span className="current">{status === 'ready' ? vacancy?.title : 'Вакансия'}</span>
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

        {status === 'ready' && vacancy && <VacancyView vacancy={vacancy} />}
      </main>
    </>
  );
}
