import { Navigate, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Toast from './components/Toast';
import CatalogPage from './pages/CatalogPage';
import VacancyPage from './pages/VacancyPage';
import CreateVacancyPage from './pages/CreateVacancyPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/vacancy/new" element={<CreateVacancyPage />} />
        <Route path="/vacancy/:id" element={<VacancyPage />} />
        <Route path="/vacancy" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <Toast />
    </>
  );
}
