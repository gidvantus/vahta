import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import CompanyCabinetNav from '../components/CompanyCabinetNav';
import CompanyPublishedVacancies from '../components/CompanyPublishedVacancies';
import JobSeekerCabinetNav from '../components/JobSeekerCabinetNav';
import { loadSession } from '../lib/auth.js';
import '../../css/account.css';

/* Личный кабинет. У компании слева меню и в центре опубликованные
   вакансии. У вахтовика слева фото/ФИО и ссылка на профиль,
   центр пока пустой. Без авторизации — редирект на /login. */
export default function AccountPage() {
  const data = loadSession();

  if (data === null) {
    return <Navigate to="/login" replace />;
  }

  const isJobseeker = data.user_type === 'jobseeker';
  const company = data.companies?.[0] || null;

  return (
    <>
      <Header />
      <main className="acc-page">
        <div className="acc-container acc-container--wide">
          <h1 className="visually-hidden">Личный кабинет</h1>
          <div className="acc-layout">
            {isJobseeker ? (
              <>
                <JobSeekerCabinetNav person={data.jobseeker} />
                <div className="acc-layout__main" />
              </>
            ) : (
              <>
                <CompanyCabinetNav company={company} />
                <div className="acc-layout__main">
                  <CompanyPublishedVacancies company={company} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
