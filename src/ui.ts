const FLASH_TOAST_KEY = 'pkk_flash_toast';

export function setFlashToast(message: string, type: 'success' | 'error' = 'success'): void {
  sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify({ message, type }));
}

export function consumeFlashToast(): void {
  const raw = sessionStorage.getItem(FLASH_TOAST_KEY);
  if (!raw) return;
  sessionStorage.removeItem(FLASH_TOAST_KEY);
  try {
    const data = JSON.parse(raw) as { message: string; type?: 'success' | 'error' };
    if (data.message) showToast(data.message, data.type ?? 'success');
  } catch {
    // Ignore malformed flash data
  }
}

export function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  window.setTimeout(() => el.classList.add('show'), 10);
  window.setTimeout(() => {
    el.classList.remove('show');
    window.setTimeout(() => el.remove(), 220);
  }, 2600);
}

export function confirmDialog(options: { title: string; message: string; confirmText?: string; cancelText?: string }): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';
    overlay.innerHTML = `
      <div class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">${esc(options.title)}</h2>
        <p>${esc(options.message)}</p>
        <div class="confirm-actions">
          <button class="btn-secondary" data-action="cancel">${esc(options.cancelText ?? 'Batal')}</button>
          <button class="btn-danger" data-action="confirm">${esc(options.confirmText ?? 'Ya, Hapus')}</button>
        </div>
      </div>
    `;

    const close = (value: boolean) => {
      overlay.remove();
      resolve(value);
    };

    overlay.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target === overlay || target.dataset.action === 'cancel') close(false);
      if (target.dataset.action === 'confirm') close(true);
    });

    document.body.appendChild(overlay);
    overlay.querySelector<HTMLButtonElement>('[data-action="cancel"]')?.focus();
  });
}

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
