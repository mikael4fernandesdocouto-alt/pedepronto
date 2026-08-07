/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   ui.js
   ------------------------------------------------------------
   Utilitários de UI compartilhados:
   - toast(msg, tipo)
   - modal abrir/fechar
   - confirmDelete (modal de confirmação com opções)
   - skeleton loading
   - barra de progresso de upload
   - formatadores (moeda, data, escape HTML)
   ============================================================ */

const TB = (window.ToastBuffer = window.ToastBuffer || []);
let toastTimer;

export function toast(msg, type = 'success') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.className = 'toast ' + type;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* -------- Modal genérico -------- */
export function openModal(html) {
  return new Promise(resolve => {
    let overlay = document.getElementById('modalOverlay');
    if (!overlay) { overlay = document.createElement('div'); overlay.id = 'modalOverlay'; overlay.className = 'modal-overlay'; document.body.appendChild(overlay); }
    overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    overlay.classList.add('open');
    // fechar clicando fora ou ESC
    const close = () => { overlay.classList.remove('open'); overlay.innerHTML=''; document.removeEventListener('keydown', escH); };
    const escH = e => { if (e.key === 'Escape') close(); };
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', escH);
    // Retorna funções utilitárias para o caller usar
    overlay.querySelector('[data-close]')?.addEventListener('click', close);
    resolve({ overlay, close });
  });
}

/* -------- Confirmação de exclusão -------- */
export function confirmAction(message, opts = {}) {
  return new Promise(resolve => {
    const btnLabel = opts.button || 'Excluir';
    const tone = opts.tone || 'danger';
    const html = `
      <div class="modal-body">
        <div class="modal-icon">${opts.icon || '⚠️'}</div>
        <h3>${opts.title || 'Confirmar ação'}</h3>
        <p>${message}</p>
      </div>
      <div class="modal-actions">
        <button class="btn-ghost" data-cancel>Cancelar</button>
        <button class="btn-${tone}" data-confirm>${btnLabel}</button>
      </div>`;
    openModal(html).then(({ overlay, close }) => {
      overlay.querySelector('[data-cancel]').addEventListener('click', () => { close(); resolve(false); });
      overlay.querySelector('[data-confirm]').addEventListener('click', () => { close(); resolve(true); });
    });
  });
}

/* -------- Skeleton loading -------- */
export function skeleton(target, count = 6) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  el.innerHTML = Array.from({ length: count }).map(() => '<div class="skeleton-card"><div class="skeleton-line w-70"></div><div class="skeleton-line"></div><div class="skeleton-line w-40"></div></div>').join('');
}

/* -------- Barra de progresso de upload -------- */
export function uploadProgress(container, maxWidth = 240) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  el.innerHTML = `
    <div class="upload-bar"><div class="upload-fill" style="width:0%"></div></div>
    <span class="upload-text">0%</span>`;
  return {
    set(pct) { el.querySelector('.upload-fill').style.width = pct + '%'; el.querySelector('.upload-text').textContent = Math.round(pct) + '%'; },
    done() { el.querySelector('.upload-fill').style.width = '100%'; el.querySelector('.upload-text').textContent = 'Concluído'; },
    clear() { el.innerHTML = ''; }
  };
}

/* -------- Formatadores -------- */
export function fmtMoney(n) { return 'R$ ' + Number(n||0).toFixed(2).replace('.', ','); }
export function fmtDate(ts) { if (!ts) return '—'; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}); }
export function escapeHTML(str) {
  return String(str||'').replace(/[&<>"']/g, m => ({ '&':'&','<':'<','>':'>','"':'"',"'":'&#39;' }[m]));
}

/* -------- Debounce (para busca em tempo real) -------- */
export function debounce(fn, wait = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}
