import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import JobSeekerCabinetNav from '../components/JobSeekerCabinetNav';
import AllPublishedVacancies from '../components/AllPublishedVacancies';
import { loadSession } from '../lib/auth.js';
import '../../css/account.css';

/* Кабинет вахтовика: слева меню, в центре все опубликованные
   вакансии всех компаний. */
export default function JobSeekerVacanciesPage() {
  const data = loadSession();

  if (data === null) {
    return <Navigate to="/login" replace />;
  }
  if (data.user_type !== 'jobseeker') {
    return <Navigate to="/account" replace />;
  }

  return (
    <>
      <Header />
      <main className="acc-page">
        <div className="acc-container acc-container--wide">
          <h1 className="visually-hidden">Список вакансий</h1>
          <div className="acc-layout">
            <JobSeekerCabinetNav person={data.jobseeker} />
            <div className="acc-layout__main">
              <AllPublishedVacancies />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
