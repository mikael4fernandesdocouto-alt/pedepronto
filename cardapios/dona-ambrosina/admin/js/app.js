/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   app.js
   ------------------------------------------------------------
   Roteador SPA, inicialização e shell do painel.
   Importa os módulos de seção e renderiza na #view conforme hash.
   ============================================================ */
import { authApi }       from './auth.js';
import { toast }         from './ui.js';
import { renderDashboard } from './dashboard.js';
import { renderProducts }   from './products.js';
import { renderCategories } from './categories.js';
import { renderPromotions } from './promotions.js';
import { renderGallery }    from './gallery.js';
import { renderBanner,
         renderLogo,
         renderInfo,
         renderAppearance } from './settings.js';

const view      = document.getElementById('view');
const pageTitle = document.getElementById('pageTitle');
const titles = {
  dashboard: 'Dashboard', products: 'Produtos', categories: 'Categorias',
  promotions: 'Promoções', gallery: 'Galeria', banner: 'Banner Principal',
  logo: 'Logo', info: 'Informações do Restaurante', appearance: 'Configurações'
};

let currentUser = null;

authApi.onReady(user => {
  if (!user) { window.location.href = 'login.html'; return; }
  currentUser = user;
  const name = user.email.split('@')[0];
  document.getElementById('userName').textContent   = user.email;
  document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
  route();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await authApi.signOut();
  window.location.href = 'login.html';
});

/* ----- router ----- */
window.addEventListener('hashchange', route);

const routes = {
  'dashboard': renderDashboard,
  'products':  renderProducts,
  'categories':renderCategories,
  'promotions':renderPromotions,
  'gallery':   renderGallery,
  'banner':    renderBanner,
  'logo':      renderLogo,
  'info':      renderInfo,
  'appearance':renderAppearance
};

function currentRoute() {
  const h = (location.hash || '#/dashboard').replace(/^#\//, '');
  return routes[h] ? h : 'dashboard';
}

async function route() {
  if (!currentUser) return;
  const h = currentRoute();
  pageTitle.textContent = titles[h] || 'Painel';
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === h));
  document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('open'));
  document.querySelectorAll('.sidebar-backdrop').forEach(b => b.classList.remove('open'));
  view.innerHTML = '';
  try {
    await routes[h](view);
  } catch (e) {
    console.error('Erro ao renderizar', h, e);
    view.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar</h3><p>${e.message || 'Falha desconhecida'}</p></div>`;
  }
}

/* ----- sidebar mobile ----- */
const sidebar  = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
document.getElementById('menuToggle').addEventListener('click', () => {
  sidebar.classList.add('open'); backdrop.classList.add('open');
});
backdrop.addEventListener('click', () => {
  sidebar.classList.remove('open'); backdrop.classList.remove('open');
});

/* ----- busca global ----- */
const search = document.getElementById('globalSearch');
search.addEventListener('input', () => {
  const h = currentRoute();
  if (h === 'products') {
    const ev = new CustomEvent('admin:search', { detail: search.value });
    document.dispatchEvent(ev);
  } else if (search.value) {
    location.hash = '#/products';
    setTimeout(() => document.dispatchEvent(new CustomEvent('admin:search', { detail: search.value })), 350);
  }
});
