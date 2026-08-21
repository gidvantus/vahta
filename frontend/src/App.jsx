import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ScrollToTop from './components/ScrollToTop';
import CatalogPage from './pages/CatalogPage';
import VacancyPage from './pages/VacancyPage';
import LegalRegistrationPage from './pages/LegalRegistrationPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';
import OfferPage from './pages/OfferPage';
import PrivacyPage from './pages/PrivacyPage';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/vacancy/:slug" element={<VacancyPage />} />
        {/* Отдельная страница регистрации юрлица — ссылок на неё пока нет */}
        <Route path="/register-company" element={<LegalRegistrationPage />} />
        {/* Отдельная страница входа: телефон + пароль, сверка с базой */}
        <Route path="/login" element={<LoginPage />} />
        {/* Личный кабинет: данные авторизованного пользователя из сессии */}
        <Route path="/account" element={<AccountPage />} />
        {/* Правовые страницы */}
        <Route path="/offer" element={<OfferPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
      <Footer />
      <Toast />
    </>
  );
}
