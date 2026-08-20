import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import Toast from './components/Toast';
import CatalogPage from './pages/CatalogPage';
import VacancyPage from './pages/VacancyPage';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/vacancy" element={<VacancyPage />} />
      </Routes>
      <Footer />
      <Toast />
    </>
  );
}
