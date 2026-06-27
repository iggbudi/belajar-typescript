import './style.css';
import { route, initRouter, navigate } from './router';
import { isAuthenticated } from './auth';
import { loginPage, mountLogin } from './pages/login';
import { dashboardPage, mountDashboard } from './pages/dashboard';

// ── Guard ──
route('/login', () => {
  if (isAuthenticated()) {
    navigate('/dashboard');
    return '';
  }
  return loginPage();
});

route('/dashboard', () => {
  if (!isAuthenticated()) {
    navigate('/login');
    return '';
  }
  return dashboardPage();
});

// ── Init ──
initRouter();

// ── Mount hooks after first render ──
const observer = new MutationObserver(() => {
  const hash = location.hash.slice(1) || '/dashboard';

  if (hash === '/login' && document.querySelector('#login-form')) {
    mountLogin();
    observer.disconnect();
  }

  if (hash === '/dashboard' && document.querySelector('#greeting')) {
    mountDashboard();
    observer.disconnect();
  }
});

observer.observe(document.querySelector<HTMLDivElement>('#app')!, { childList: true, subtree: true });
