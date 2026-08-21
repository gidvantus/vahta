import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// При смене маршрута прокручиваем страницу вверх,
// чтобы пользователь видел начало новой страницы.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
