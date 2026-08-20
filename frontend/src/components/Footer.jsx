import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <Link className="footer__logo" to="/" aria-label="Вахта.ру">
          <img src="/img/logo.svg" alt="Вахта.ру" />
        </Link>
        <nav className="footer__nav" aria-label="Разделы">
          <a href="/">Вакансии</a>
        </nav>
        <p className="footer__copy">© 2026 Вахта.ру — работа вахтой по всей России</p>
      </div>
    </footer>
  );
}
