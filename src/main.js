import { setupAuthForms } from './js/auth.js';

setupAuthForms();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('[SW] Registrado:', reg.scope))
      .catch(err => console.error('[SW] Error:', err));
  });
}

