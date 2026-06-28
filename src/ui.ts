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

// ── Skeleton Loading Helpers ──

export function skeletonCard(count: number = 3): string {
  return `
    <div class="skeleton-list">
      ${Array(count).fill('').map(() => `
        <div class="skeleton-card">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line skeleton-text"></div>
          <div class="skeleton-line skeleton-text-short"></div>
          <div class="skeleton-actions">
            <div class="skeleton-btn"></div>
            <div class="skeleton-btn"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

export function skeletonStats(): string {
  return `
    <div class="skeleton-stats">
      <div class="skeleton-stat-card">
        <div class="skeleton-circle"></div>
        <div class="skeleton-line skeleton-text"></div>
      </div>
      <div class="skeleton-stat-card">
        <div class="skeleton-circle"></div>
        <div class="skeleton-line skeleton-text"></div>
      </div>
      <div class="skeleton-stat-card">
        <div class="skeleton-circle"></div>
        <div class="skeleton-line skeleton-text"></div>
      </div>
    </div>
  `;
}

export function skeletonRecent(): string {
  return `
    <div class="skeleton-recent">
      ${Array(2).fill('').map(() => `
        <div class="skeleton-recent-item">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-recent-info">
            <div class="skeleton-line skeleton-text"></div>
            <div class="skeleton-line skeleton-text-short"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Time Greeting ──

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

// ── Pull to Refresh ──

export interface PullToRefreshOptions {
  container: HTMLElement;
  onRefresh: () => Promise<void>;
  threshold?: number;
}

export function initPullToRefresh(options: PullToRefreshOptions): () => void {
  const { container, onRefresh, threshold = 80 } = options;
  let startY = 0;
  let pulling = false;
  let refreshing = false;

  const indicator = document.createElement('div');
  indicator.className = 'pull-indicator';
  indicator.innerHTML = '<div class="pull-spinner"></div><span>Tarik untuk segarkan</span>';
  container.prepend(indicator);

  const onTouchStart = (e: TouchEvent) => {
    if (refreshing || window.scrollY > 0) return;
    startY = e.touches[0].clientY;
    pulling = true;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!pulling || refreshing) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0 && diff < threshold * 1.5) {
      const progress = Math.min(diff / threshold, 1);
      indicator.style.transform = `translateY(${diff * 0.5}px)`;
      indicator.style.opacity = `${progress}`;
      indicator.classList.toggle('pull-ready', progress >= 1);
    }
  };

  const onTouchEnd = async () => {
    if (!pulling || refreshing) return;
    pulling = false;

    const currentTransform = indicator.style.transform;
    const match = currentTransform.match(/translateY\((\d+)px\)/);
    const distance = match ? parseInt(match[1]) : 0;

    if (distance >= threshold * 0.8) {
      refreshing = true;
      indicator.style.transform = 'translateY(40px)';
      indicator.innerHTML = '<div class="pull-spinner spinning"></div><span>Menyegarkan data...</span>';
      indicator.classList.add('pull-refreshing');

      try {
        await onRefresh();
        indicator.innerHTML = '<span>✓ Berhasil diperbarui</span>';
        indicator.classList.add('pull-success');
      } catch {
        indicator.innerHTML = '<span>✗ Gagal memperbarui</span>';
        indicator.classList.add('pull-error');
      }

      setTimeout(() => {
        indicator.style.transform = '';
        indicator.style.opacity = '';
        indicator.classList.remove('pull-ready', 'pull-refreshing', 'pull-success', 'pull-error');
        refreshing = false;
      }, 800);
    } else {
      indicator.style.transform = '';
      indicator.style.opacity = '';
      indicator.classList.remove('pull-ready');
    }
  };

  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: true });
  container.addEventListener('touchend', onTouchEnd);

  return () => {
    container.removeEventListener('touchstart', onTouchStart);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onTouchEnd);
    indicator.remove();
  };
}

// ── Unsaved Changes Guard ──

let _hasUnsavedChanges = false;
let _unsavedMessage = 'Data yang belum disimpan akan hilang. Yakin mau keluar?';

export function markDirty(dirty = true): void { _hasUnsavedChanges = dirty; }
export function isDirty(): boolean { return _hasUnsavedChanges; }

export function initUnsavedGuard(): void {
  window.addEventListener('beforeunload', (e) => {
    if (_hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
  });
}

export function clearDirty(): void { _hasUnsavedChanges = false; }

export async function confirmIfDirty(): Promise<boolean> {
  if (!_hasUnsavedChanges) return true;
  const ok = await confirmDialog({
    title: '⚠️ Belum Disimpan',
    message: _unsavedMessage,
    confirmText: 'Tinggalkan',
    cancelText: 'Batal'
  });
  if (ok) _hasUnsavedChanges = false;
  return ok;
}

// ── Offline Indicator ──

let offlineBanner: HTMLDivElement | null = null;

function showOfflineBanner(): void {
  if (offlineBanner) return;
  offlineBanner = document.createElement('div');
  offlineBanner.className = 'offline-banner';
  offlineBanner.innerHTML = '📡 Mode Offline — Data mungkin tidak terbaru';
  document.body.prepend(offlineBanner);
  requestAnimationFrame(() => offlineBanner!.classList.add('show'));
}

function hideOfflineBanner(): void {
  if (!offlineBanner) return;
  offlineBanner.classList.remove('show');
  setTimeout(() => { offlineBanner?.remove(); offlineBanner = null; }, 300);
}

export function initOfflineIndicator(): void {
  if (!navigator.onLine) showOfflineBanner();
  window.addEventListener('online', hideOfflineBanner);
  window.addEventListener('offline', showOfflineBanner);
}

// ── Badge Counter ──

let _invalidateBadge: (() => void) | null = null;

export function onBadgeInvalidate(fn: () => void): void { _invalidateBadge = fn; }
export function invalidateBadgeCache(): void { _invalidateBadge?.(); }

export function updateNavBadge(count: number, type: 'anggota' | 'kegiatan' = 'anggota'): void {
  const badge = document.querySelector<HTMLSpanElement>(`#nav-badge-${type}`);
  if (badge) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.classList.toggle('hidden', count === 0);
  }
}

export function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function shortText(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}...` : s;
}

export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return esc(text);
  const escaped = esc(text);
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>');
}

export function formatDate(dateStr: string, style: 'short' | 'long' = 'short'): string {
  try {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateStr;
  }
}
