import './style.css';
import { route, initRouter, navigate } from './router';
import { isAuthenticated } from './auth';
import { loginPage, mountLogin } from './pages/login';
import { dashboardPage, mountDashboard } from './pages/dashboard';
import { anggotaListPage, mountAnggotaList } from './pages/anggota/list';
import { anggotaFormPage, mountAnggotaForm } from './pages/anggota/form';

function guard(page: () => string, mount?: () => void): () => string {
  return () => {
    if (!isAuthenticated()) { navigate('/login'); return ''; }
    const html = page();
    setTimeout(() => mount?.(), 0);
    return html;
  };
}

// ── Routes (guarded) ──
route('/login', () => {
  if (isAuthenticated()) { navigate('/dashboard'); return ''; }
  setTimeout(() => mountLogin(), 0);
  return loginPage();
});

route('/dashboard', guard(dashboardPage, mountDashboard));
route('/anggota', guard(anggotaListPage, mountAnggotaList));
route('/anggota/tambah', guard(() => anggotaFormPage(false), mountAnggotaForm));

route('/anggota/edit', guard(
  () => anggotaFormPage(true),
  mountAnggotaForm
));

// ── Init ──
initRouter();
