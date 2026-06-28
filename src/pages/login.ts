import { login } from '../auth';
import { navigate } from '../router';

export function loginPage(): string {
  return `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <span class="login-emoji">🏡</span>
          <p class="header-kicker">PKK Sembungharjo</p>
          <h1>Aplikasi Kegiatan PKK</h1>
          <p class="login-sub">Masuk untuk mengelola data anggota dengan mudah.</p>
        </div>
        <form id="login-form">
          <label>
            👤 Username
            <input type="text" id="username" value="admin" autocomplete="username" inputmode="text" placeholder="Masukkan username" />
          </label>
          <label>
            🔒 Password
            <input type="password" id="password" autocomplete="current-password" placeholder="Masukkan password" />
          </label>
          <p id="login-error" class="error hidden"></p>
          <button type="submit" id="login-btn">🔐 Masuk</button>
        </form>
        <p class="login-footer">Hubungi admin jika lupa password</p>
      </div>
    </div>
  `;
}

export function mountLogin(): void {
  const form = document.querySelector<HTMLFormElement>('#login-form');
  const errorEl = document.querySelector<HTMLParagraphElement>('#login-error');
  const passInput = document.querySelector<HTMLInputElement>('#password');
  const submitBtn = document.querySelector<HTMLButtonElement>('#login-btn');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = (document.querySelector<HTMLInputElement>('#username')?.value ?? '').trim();
    const password = passInput?.value ?? '';

    if (!username || !password) {
      errorEl!.textContent = '⚠️ Mohon isi username dan password.';
      errorEl!.classList.remove('hidden');
      return;
    }

    // Disable button during check
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Memeriksa...';
    }

    // Simulate brief delay for UX
    setTimeout(async () => {
      const success = await login(username, password);
      if (success) {
        errorEl!.classList.add('hidden');
        navigate('/dashboard');
      } else {
        errorEl!.textContent = '❌ Username atau password belum sesuai.';
        errorEl!.classList.remove('hidden');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '🔐 Masuk';
        }
      }
    }, 300);
  });

  // focus password on load
  setTimeout(() => passInput?.focus(), 100);
}
