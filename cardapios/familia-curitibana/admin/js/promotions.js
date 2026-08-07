/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   promotions.js
   ------------------------------------------------------------
   CRUD de promoções com período (início / fim), ativar e
   desativar. Produtos marcados como promoção pelo painel de
   produtos aparecem automaticamente destacados no cardápio.
   ============================================================ */
import { firestore }   from './firestore.js';
import { toast, openModal, confirmAction, skeleton, escapeHTML, fmtDate } from './ui.js';

let promotions = [];
let products = [];

const today = () => new Date().toISOString().slice(0,10);

function isWithin(promo) {
  if (!promo.startsAt && !promo.endsAt) return true;
  const now = new Date();
  const start = promo.startsAt ? (promo.startsAt.toDate ? promo.startsAt.toDate() : new Date(promo.startsAt)) : null;
  const end   = promo.endsAt   ? (promo.endsAt.toDate   ? promo.endsAt.toDate()   : new Date(promo.endsAt))   : null;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

export async function renderPromotions(root) {
  root.innerHTML = headerHTML();
  const list = root.querySelector('#promosList');
  skeleton(list, 3);

  /* carregar nomes de produtos disponíveis */
  firestore.watchProducts(items => { products = items || []; });

  firestore.watchPromotions(items => {
    promotions = items || [];
    renderList(list);
  });

  root.querySelector('#addPromo').addEventListener('click', () => openPromoModal());
}

function headerHTML() {
  return `
    <div class="section-head">
      <div>
        <h2>Promoções</h2>
        <div class="sub">Crie campanhas promocionais com período de validade.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-sm" id="addPromo">＋ Nova promoção</button>
    </div>
    <div id="promosList" class="list"></div>`;
}

function renderList(list) {
  if (!promotions.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">🏷️</div><h3>Nenhuma promoção ainda</h3><p>Crie campanhas para destacar produtos no cardápio automaticamente.</p><button class="btn btn-primary" onclick="document.getElementById('addPromo').click()">＋ Criar promoção</button></div>`;
    return;
  }
  list.innerHTML = promotions.map(p => {
    const within = isWithin(p);
    const active = p.active && within;
    const prod = products.find(x => x.id === p.productId);
    return `
    <article class="item-card">
      <div class="body" style="padding-top:18px">
        <div class="name">${escapeHTML(p.title)}</div>
        <div class="desc">${escapeHTML(p.description || '')}</div>
        ${prod ? `<div class="cat-tag">🔗 ${escapeHTML(prod.name)}</div>` : ''}
        <div class="cat-tag">📅 ${fmtDate(p.startsAt)} → ${fmtDate(p.endsAt)}</div>
        <div style="margin-top:10px">
          <span class="badge ${active?'veg':'unavail'}">${active ? 'Ativa' : (p.active ? 'Fora do período' : 'Inativa')}</span>
        </div>
        <div class="actions">
          <button class="btn btn-sm btn-ghost" data-edit="${p.id}">Editar</button>
          <button class="btn btn-sm btn-${active?'ghost':'primary'}" data-toggle="${p.id}">${p.active ? 'Desativar' : 'Ativar'}</button>
          <button class="btn btn-sm btn-danger" data-del="${p.id}">Excluir</button>
        </div>
      </div>
    </article>`;
  }).join('');
  attachEvents(list);
}

function attachEvents(list) {
  list.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openPromoModal(b.dataset.edit));
  list.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const p = promotions.find(x => x.id === b.dataset.del);
    if (await confirmAction(`Excluir a promoção <strong>${escapeHTML(p.title)}</strong>?`, { title: 'Excluir', button: 'Excluir', icon: '🗑️' })) {
      await firestore.deletePromotion(p.id); toast('Promoção excluída', 'success');
    }
  });
  list.querySelectorAll('[data-toggle]').forEach(b => b.onclick = async () => {
    const p = promotions.find(x => x.id === b.dataset.toggle);
    await firestore.updatePromotion(p.id, { active: !p.active });
    toast(p.active ? 'Promoção desativada' : 'Promoção ativada', 'success');
  });
}

async function openPromoModal(id) {
  const p = id ? promotions.find(x => x.id === id) : { active: true, startsAt: today(), endsAt: '' };
  const startsVal = p.startsAt ? (p.startsAt.toDate ? p.startsAt.toDate() : new Date(p.startsAt)).toISOString().slice(0,10) : '';
  const endsVal   = p.endsAt   ? (p.endsAt.toDate   ? p.endsAt.toDate()   : new Date(p.endsAt)).toISOString().slice(0,10)   : '';
  const html = `
    <div class="modal-head"><h3>${id ? 'Editar promoção' : 'Nova promoção'}</h3><button class="close" data-close>×</button></div>
    <div class="modal-body">
      <div class="form-row"><label>Título *</label><input id="pr_title" value="${escapeHTML(p.title||'')}" placeholder="Ex: Terça da Feijoada" required /></div>
      <div class="form-row"><label>Descrição</label><textarea id="pr_desc" placeholder="Detalhes da promoção">${escapeHTML(p.description||'')}</textarea></div>
      <div class="form-row">
        <label>Produto vinculado</label>
        <select id="pr_prod">
          <option value="">— Nenhum (apenas destaque) —</option>
          ${products.map(x => `<option value="${x.id}" ${x.id === p.productId ? 'selected' : ''}>${escapeHTML(x.name)}</option>`).join('')}
        </select>
      </div>
      <div class="period-grid">
        <div><label>Início</label><input id="pr_start" type="date" value="${startsVal}" /></div>
        <div><label>Fim</label><input id="pr_end" type="date" value="${endsVal}" /></div>
      </div>
      <div class="form-row" style="margin-top:16px">
        <label class="switch"><input type="checkbox" id="pr_active" ${p.active !== false ? 'checked' : ''} /><span class="track"></span><span class="label">Ativa</span></label>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" id="pr_save">${id ? 'Salvar' : 'Criar promoção'}</button>
    </div>`;
  const { overlay, close } = await openModal(html);
  overlay.querySelector('#pr_save').addEventListener('click', async () => {
    const title = overlay.querySelector('#pr_title').value.trim();
    if (!title) { toast('Informe o título.', 'error'); return; }
    const data = {
      title,
      description: overlay.querySelector('#pr_desc').value.trim(),
      productId: overlay.querySelector('#pr_prod').value || null,
      startsAt: overlay.querySelector('#pr_start').value || null,
      endsAt:   overlay.querySelector('#pr_end').value || null,
      active:   overlay.querySelector('#pr_active').checked
    };
    /* Marcar produto como promoção se vinculado */
    if (data.productId) {
      firestore.updateProduct(data.productId, { promotion: data.active }).catch(()=>{});
    }
    try {
      if (id) await firestore.updatePromotion(id, data);
      else await firestore.addPromotion(data);
      toast(id ? 'Promoção atualizada' : 'Promoção criada', 'success');
      close();
    } catch (e) { toast('Erro: ' + (e.message||''), 'error'); }
  });
}
