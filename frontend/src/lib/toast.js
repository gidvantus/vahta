/* Простой глобальный тост на CustomEvent (аналог toast из ванильного скрипта). */

const TOAST_EVENT = 'vahta:toast';

export function showToast(html) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { html } }));
}

export { TOAST_EVENT };
