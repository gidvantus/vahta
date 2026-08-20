import { useEffect, useState } from 'react';
import { TOAST_EVENT } from '../lib/toast.js';

export default function Toast() {
  const [html, setHtml] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;
    function onToast(e) {
      setHtml(e.detail.html);
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 3200);
    }
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      clearTimeout(timer);
    };
  }, []);

  if (!visible && !html) return null;
  return (
    <div className={visible ? 'toast is-visible' : 'toast'} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
