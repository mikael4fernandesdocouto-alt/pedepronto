/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   dashboard.js
   ------------------------------------------------------------
   Painel inicial com métricas e atalhos rápidos.
   ============================================================ */
import { firestore } from './firestore.js';
import { skeleton, fmtMoney, escapeHTML, fmtDate, toast } from './ui.js';

export async function renderDashboard(root) {
  skeleton(root, 4);
  let s;
  try { s = await firestore.stats(); }
  catch (e) { root.innerHTML = emptyStats(); return; }

  root.innerHTML = `
    <div class="grid-stats">
      <div class="stat-card accent">
        <span class="ico">📚</span>
        <div class="label">Categorias</div>
        <div class="value">${s.cats}</div>
        <div class="sub">categorias cadastradas</div>
      </div>
      <div class="stat-card">
        <span class="ico">🍽️</span>
        <div class="label">Produtos</div>
        <div class="value">${s.prods}</div>
        <div class="sub">${s.highlighted} em destaque</div>
      </div>
      <div class="stat-card">
        <span class="ico">⏰</span>
        <div class="label">Indisponíveis</div>
        <div class="value">${s.unavailable}</div>
        <div class="sub">produtos fora de oferta</div>
      </div>
      <div class="stat-card">
        <span class="ico">🏷️</span>
        <div class="label">Em promoção</div>
        <div class="value">${s.onPromotion}</div>
        <div class="sub">${s.promos} campanhas ativas</div>
      </div>
    </div>

    <div class="section-head">
      <div>
        <h2>Produtos mais caros</h2>
        <div class="sub">Maiores valores do cardápio</div>
      </div>
      <div class="spacer"></div>
      <a href="#/products" class="btn btn-ghost btn-sm">Ver todos →</a>
    </div>
    <div class="list">
      ${(s.top.length ? s.top : []).slice(0,3).map(p => `
        <article class="item-card">
          <div class="thumb ${p.image ? '' : 'empty'}" ${p.image ? `style="background-image:url('${escapeHTML(p.image)}')"` : ''}>
            <span style="font-size:2rem;${p.image ? 'display:none' : ''}">🍽️</span>
          </div>
          <div class="body">
            <div class="name">${escapeHTML(p.name)}</div>
            <div class="desc">${escapeHTML(p.description || p.desc || '')}</div>
            <div class="price-row">
              <div class="price">${fmtMoney(p.price)}</div>
              ${p.promotion && p.promoPrice ? `<div class="price old">${fmtMoney(p.promoPrice)}</div>` : ''}
            </div>
          </div>
        </article>`).join('') || emptyState('Nenhum produto ainda')}
    </div>

    <div class="section-head" style="margin-top:36px">
      <div>
        <h2>Atalhos rápidos</h2>
        <div class="sub">Ações frequentes</div>
      </div>
    </div>
    <div class="grid-stats">
      <a href="#/products" class="stat-card" style="text-decoration:none;color:inherit">
        <div class="label" style="color:var(--primary)">＋</div>
        <div class="value" style="font-size:1.4rem;margin-top:8px">Novo produto</div>
        <div class="sub">Adicionar item ao cardápio</div>
      </a>
      <a href="#/categories" class="stat-card" style="text-decoration:none;color:inherit">
        <div class="label" style="color:var(--primary)">📚</div>
        <div class="value" style="font-size:1.4rem;margin-top:8px">Nova categoria</div>
        <div class="sub">Organizar seções do cardápio</div>
      </a>
      <a href="#/promotions" class="stat-card" style="text-decoration:none;color:inherit">
        <div class="label" style="color:var(--accent)">🏷️</div>
        <div class="value" style="font-size:1.4rem;margin-top:8px">Nova promoção</div>
        <div class="sub">Criar campanha de destaque</div>
      </a>
      <a href="#/appearance" class="stat-card" style="text-decoration:none;color:inherit">
        <div class="label" style="color:var(--primary)">🎨</div>
        <div class="value" style="font-size:1.4rem;margin-top:8px">Aparência</div>
        <div class="sub">Personalizar cores e fonte</div>
      </a>
    </div>
  `;
}

function emptyState(msg) {
  return `<div class="empty-state" style="grid-column:1/-1"><div class="icon">📭</div><h3>${msg}</h3><p>Comece adicionando itens para que apareçam aqui.</p></div>`;
}
function emptyStats() {
  return `<div class="empty-state"><div class="icon">⚠️</div><h3>Não foi possível carregar</h3><p>Verifique sua conexão e a configuração do Firebase.</p></div>`;
}
