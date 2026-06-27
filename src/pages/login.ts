import { login } from '../auth';
import { navigate } from '../router';

export function loginPage(): string {
  return `
    <div class="login-container">
      <div class="login-card">
        <h1>Aplikasi Kegiatan PKK</h1>
        <p class="login-sub">Login untuk melanjutkan</p>
        <form id="login-form">
          <label>
            Username
            <input type="text" id="username" value="admin" autocomplete="username" />
          </label>
          <label>
            Password
            <input type="password" id="password" autocomplete="current-password" />
          </label>
          <p id="login-error" class="error hidden"></p>
          <button type="submit">Masuk</button>
        </form>
      </div>
    </div>
  `;
}

export function mountLogin(): void {
  const form = document.querySelector<HTMLFormElement>('#login-form');
  const errorEl = document.querySelector<HTMLParagraphElement>('#login-error');
  const passInput = document.querySelector<HTMLInputElement>('#password');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = (document.querySelector<HTMLInputElement>('#username')?.value ?? '').trim();
    const password = passInput?.value ?? '';

    if (!username || !password) {
      errorEl!.textContent = 'Isi username dan password';
      errorEl!.classList.remove('hidden');
      return;
    }

    if (login(username, password)) {
      errorEl!.classList.add('hidden');
      navigate('/dashboard');
    } else {
      errorEl!.textContent = 'Username atau password tidak sesuai';
      errorEl!.classList.remove('hidden');
    }
  });

  // focus password on load
  setTimeout(() => passInput?.focus(), 100);
}
