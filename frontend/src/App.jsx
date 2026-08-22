import { Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ScrollToTop from './components/ScrollToTop';
import CatalogPage from './pages/CatalogPage';
import VacancyPage from './pages/VacancyPage';
import CreateVacancyPage from './pages/CreateVacancyPage';
import LegalRegistrationPage from './pages/LegalRegistrationPage';
import JobSeekerRegistrationPage from './pages/JobSeekerRegistrationPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import JobSeekerProfilePage from './pages/JobSeekerProfilePage';
import JobSeekerVacanciesPage from './pages/JobSeekerVacanciesPage';
import JobSeekerFavoritesPage from './pages/JobSeekerFavoritesPage';
import JobSeekerApplicationsPage from './pages/JobSeekerApplicationsPage';
import VacancyListPage from './pages/VacancyListPage';
import CompanyApplicationsPage from './pages/CompanyApplicationsPage';
import CompanyJobSeekerProfilePage from './pages/CompanyJobSeekerProfilePage';
import OfferPage from './pages/OfferPage';
import PrivacyPage from './pages/PrivacyPage';
import { JobSeekerFiltersProvider } from './lib/jobseekerFilters.jsx';

export default function App() {
  return (
    <JobSeekerFiltersProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/vacancy/new" element={<CreateVacancyPage />} />
        <Route path="/vacancy/:slug" element={<VacancyPage />} />
        <Route path="/vacancy" element={<Navigate to="/" replace />} />
        {/* Отдельная страница регистрации юрлица — ссылок на неё пока нет */}
        <Route path="/register-company" element={<LegalRegistrationPage />} />
        {/* Отдельная страница «Регистрация для поиска работы» (физлицо) */}
        <Route path="/register-jobseeker" element={<JobSeekerRegistrationPage />} />
        {/* Отдельная страница входа: телефон + пароль, сверка с базой */}
        <Route path="/login" element={<LoginPage />} />
        {/* Личный кабинет: у компании — вакансии и левое меню;
            у вахтовика — левая колонка, данные в профиле */}
        <Route path="/account" element={<AccountPage />} />
        {/* Профиль компании: данные регистрации юрлица */}
        <Route path="/company/profile" element={<CompanyProfilePage />} />
        {/* Профиль вахтовика: данные пользователя */}
        <Route path="/jobseeker/profile" element={<JobSeekerProfilePage />} />
        {/* Список всех опубликованных вакансий в кабинете вахтовика */}
        <Route path="/jobseeker/vacancies" element={<JobSeekerVacanciesPage />} />
        <Route path="/jobseeker/favorites" element={<JobSeekerFavoritesPage />} />
        {/* Мои отклики вахтовика */}
        <Route path="/jobseeker/applications" element={<JobSeekerApplicationsPage />} />
        {/* Список вакансий компании (страница изолирована; API — у личного кабинета) */}
        <Route path="/company/vacancies" element={<VacancyListPage />} />
        {/* Отклики вахтовиков на вакансии компании */}
        <Route path="/company/applications/jobseeker/:jobseekerId" element={<CompanyJobSeekerProfilePage />} />
        <Route path="/company/applications" element={<CompanyApplicationsPage />} />
        {/* Правовые страницы */}
        <Route path="/offer" element={<OfferPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
      <Footer />
      <Toast />
    </JobSeekerFiltersProvider>
  );
}
