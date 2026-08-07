/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   products.js
   ------------------------------------------------------------
   CRUD completo de produtos, upload de imagem, busca em tempo
   real, ordenação por drag-and-drop e disponibilidade.
   ============================================================ */
import { firestore }   from './firestore.js';
import { storageApi }  from './storage.js';
import { toast, openModal, confirmAction, skeleton, uploadProgress,
         fmtMoney, escapeHTML, fmtDate, debounce } from './ui.js';

let products = [];
let categories = [];
let searchTerm = '';

function applySearch() {
  if (!searchTerm) return products;
  const t = searchTerm.toLowerCase();
  return products.filter(p =>
    (p.name||'').toLowerCase().includes(t) ||
    (categories.find(c => c.id === p.categoryId)?.name || '').toLowerCase().includes(t));
}

export async function renderProducts(root) {
  /* header */
  root.innerHTML = headerHTML();
  const grid = root.querySelector('#prodGrid');
  skeleton(grid, 6);

  /* listeners para carregar categorias também */
  try {
    categories = await firestore.listCategories();
  } catch (e) {}

  /* listener de busca global */
  document.addEventListener('admin:search', onSearch);
  /* cleanup quando trocar de seção: dispara um evento especial */
  window.addEventListener('hashchange', function clean(){ document.removeEventListener('admin:search', onSearch); window.removeEventListener('hashchange', clean); });

  /* carregar produtos em tempo real */
  firestore.watchProducts(list => {
    products = list || [];
    renderGrid(grid);
  });

  root.querySelector('#addProduct').addEventListener('click', () => openProductModal());
}

function onSearch(e) { searchTerm = e.detail || ''; const grid = document.getElementById('prodGrid'); if (grid) renderGrid(grid); }

function headerHTML() {
  return `
    <div class="section-head">
      <div>
        <h2>Produtos do cardápio</h2>
        <div class="sub">Gerencie os itens do seu cardápio. Arraste cards para reordenar.</div>
      </div>
      <div class="spacer"></div>
      <div class="actions">
        <button class="btn btn-ghost btn-sm" id="quickSearch" title="Filtrar">🔍</button>
        <button class="btn btn-primary btn-sm" id="addProduct">＋ Novo produto</button>
      </div>
    </div>
    <div id="prodGrid" class="list"></div>`;
}

function renderGrid(grid) {
  const filtered = applySearch();
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="icon">🍽️</div>
      <h3>${searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto ainda'}</h3>
      <p>${searchTerm ? 'Tente outro termo de busca.' : 'Comece adicionando o primeiro item do cardápio.'}</p>
      ${searchTerm ? '' : '<button class="btn btn-primary" onclick="document.getElementById(\'addProduct\').click()">＋ Adicionar produto</button>'}
    </div>`;
    return;
  }
  grid.innerHTML = filtered.map(p => {
    const cat = categories.find(c => c.id === p.categoryId);
    return `
    <article class="item-card" draggable="true" data-id="${p.id}" data-order="${p.order||0}">
      <div class="thumb ${p.image ? '' : 'empty'}" ${p.image ? `style="background-image:url('${escapeHTML(p.image)}')"` : ''}>
        ${p.image ? '' : '🍽️'}
        <div class="badges">
          ${p.highlight ? `<span class="badge hot">⭐ Destaque</span>` : ''}
          ${p.promotion ? `<span class="badge promo">🏷️ Promo</span>` : ''}
        </div>
        ${p.available === false ? `<div class="unavail">INDISPONÍVEL</div>` : ''}
      </div>
      <span class="drag" title="Arrastar">⋮⋮</span>
      <div class="body">
        <div class="name">${escapeHTML(p.name)}</div>
        <div class="desc">${escapeHTML(p.description || p.desc || '')}</div>
        <div class="price-row">
          <div class="price">${fmtMoney(p.price)}</div>
          ${p.promotion && p.promoPrice ? `<div class="price old">${fmtMoney(p.promoPrice)}</div>` : ''}
        </div>
        <div class="cat-tag">📂 ${cat ? escapeHTML(cat.name) : '— sem categoria'}</div>
        <div class="actions">
          <button class="btn btn-sm btn-ghost" data-edit="${p.id}">Editar</button>
          <button class="btn btn-sm btn-ghost" data-toggle="${p.id}">${p.available === false ? 'Ativar' : 'Desativar'}</button>
          <button class="btn btn-sm btn-danger" data-del="${p.id}">Excluir</button>
        </div>
      </div>
    </article>`;
  }).join('');
  attachGridEvents(grid);
}

function attachGridEvents(grid) {
  grid.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openProductModal(grid.querySelector(`[data-id="${b.dataset.edit}"]`).dataset.id));
  grid.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const id = b.dataset.del;
    const p = products.find(x => x.id === id);
    if (await confirmAction(`Tem certeza que deseja excluir <strong>${escapeHTML(p.name)}</strong>?`, {
      title: 'Excluir produto', button: 'Excluir produto', icon: '🗑️'
    })) {
      await firestore.deleteProduct(id);
      if (p.image) storageApi.remove(p.image).catch(()=>{});
      toast('Produto excluído', 'success');
    }
  });
  grid.querySelectorAll('[data-toggle]').forEach(b => b.onclick = async () => {
    const p = products.find(x => x.id === b.dataset.toggle);
    await firestore.updateProduct(p.id, { available: !(p.available === false) });
    toast(p.available === false ? 'Produto liberado' : 'Produto indisponível', 'success');
  });

  /* Drag and drop */
  let dragEl = null;
  grid.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('dragstart', e => { dragEl = card; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    card.addEventListener('dragend',   () => { card.classList.remove('dragging'); dragEl = null; });
    card.addEventListener('dragover',  e => { e.preventDefault(); if (dragEl && dragEl !== card) card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', async e => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (!dragEl || dragEl === card) return;
      const kids = [...grid.querySelectorAll('.item-card')];
      const fromIdx = kids.indexOf(dragEl);
      const toIdx = kids.indexOf(card);
      kids.splice(toIdx, 0, kids.splice(fromIdx, 1)[0]);
      const order = kids.map(k => ({ id: k.dataset.id, order: k.dataset.order }));
      await firestore.batchOrderProducts(order);
      toast('Ordem atualizada', 'success');
    });
  });
}

async function openProductModal(id) {
  const p = id ? products.find(x => x.id === id) : { available: true, promotion: false, highlight: false, order: products.length };
  if (categories.length === 0) { toast('Crie categorias antes.', 'error'); location.hash = '#/categories'; return; }
  const html = `
    <div class="modal-head">
      <h3>${id ? 'Editar produto' : 'Novo produto'}</h3>
      <button class="close" data-close>×</button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-row">
          <label>Nome *</label>
          <input id="p_name" value="${escapeHTML(p.name||'')}" required />
        </div>
        <div class="form-row">
          <label>Categoria *</label>
          <select id="p_cat">
            ${categories.map(c => `<option value="${c.id}" ${c.id === p.categoryId ? 'selected' : ''}>${escapeHTML(c.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <label>Descrição</label>
        <textarea id="p_desc" placeholder="Ingredientes e detalhes">${escapeHTML(p.description || p.desc || '')}</textarea>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>Preço (R$) *</label>
          <input id="p_price" type="number" step="0.01" min="0" value="${p.price != null ? p.price : ''}" required />
        </div>
        <div class="form-row">
          <label>Ordem de exibição</label>
          <input id="p_order" type="number" min="0" value="${p.order != null ? p.order : products.length}" />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>Promoção?</label>
          <label class="switch"><input type="checkbox" id="p_promo" ${p.promotion ? 'checked' : ''} /><span class="track"></span><span class="label">Ativar promoção</span></label>
        </div>
        <div class="form-row">
          <label>Preço promocional (R$)</label>
          <input id="p_promoprice" type="number" step="0.01" min="0" value="${p.promoPrice != null ? p.promoPrice : ''}" />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label>Destaque?</label>
          <label class="switch"><input type="checkbox" id="p_high" ${p.highlight ? 'checked' : ''} /><span class="track"></span><span class="label">Produto em destaque</span></label>
        </div>
        <div class="form-row">
          <label>Disponibilidade</label>
          <label class="switch"><input type="checkbox" id="p_avail" ${p.available !== false ? 'checked' : ''} /><span class="track"></span><span class="label">Disponível</span></label>
        </div>
      </div>
      <div class="form-row">
        <label>Imagem</label>
        <input type="file" id="p_file" accept="image/*" />
        <div class="image-preview ${p.image ? '' : 'empty'}" id="p_prev" ${p.image ? `style="background-image:url('${escapeHTML(p.image)}')"` : ''}>
          ${p.image ? `<button class="remove" id="p_removeimg" title="Remover">×</button>` : 'Preview da imagem'}
        </div>
        <div id="p_progress" style="display:none"></div>
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" id="p_save">${id ? 'Salvar alterações' : 'Criar produto'}</button>
    </div>`;
  const { overlay, close } = await openModal(html);

  /* estado local */
  let imageUrl = p.image || null;

  /* preview tempo real */
  const fileInput = overlay.querySelector('#p_file');
  const prevEl = overlay.querySelector('#p_prev');
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (!f) return;
    prevEl.classList.remove('empty');
    prevEl.style.backgroundImage = `url('${URL.createObjectURL(f)}')`;
    prevEl.innerHTML = '';
  });
  if (p.image) {
    overlay.querySelector('#p_removeimg')?.addEventListener('click', () => {
      imageUrl = null;
      prevEl.classList.add('empty');
      prevEl.style.backgroundImage = '';
      prevEl.innerHTML = 'Imagem removida';
    });
  }

  /* salvar */
  overlay.querySelector('#p_save').addEventListener('click', async () => {
    const name = overlay.querySelector('#p_name').value.trim();
    const price = parseFloat(overlay.querySelector('#p_price').value) || 0;
    const categoryId = overlay.querySelector('#p_cat').value;
    if (!name) { toast('Digite o nome do produto.', 'error'); return; }
    if (!categoryId) { toast('Selecione uma categoria.', 'error'); return; }

    const data = {
      name,
      categoryId,
      description: overlay.querySelector('#p_desc').value.trim(),
      price,
      order: parseInt(overlay.querySelector('#p_order').value) || 0,
      promotion: overlay.querySelector('#p_promo').checked,
      promoPrice: parseFloat(overlay.querySelector('#p_promoprice').value) || null,
      highlight: overlay.querySelector('#p_high').checked,
      available: overlay.querySelector('#p_avail').checked
    };

    /* Upload, se houver arquivo novo */
    if (fileInput.files[0]) {
      const progWrap = overlay.querySelector('#p_progress');
      progWrap.style.display = 'block';
      const prog = uploadProgress(progWrap);
      try {
        const url = await storageApi.upload(fileInput.files[0], 'products', pct => prog.set(pct));
        data.image = url;
        imageUrl = url;
        prog.done();
      } catch (e) {
        toast('Falha no upload da imagem', 'error');
        prog.clear(); return;
      }
    } else if (!imageUrl) {
      data.image = null;
    } else {
      data.image = imageUrl;
    }

    try {
      if (id) await firestore.updateProduct(id, data);
      else await firestore.addProduct(data);
      toast(id ? 'Produto atualizado' : 'Produto criado', 'success');
      close();
    } catch (e) {
      toast('Erro ao salvar: ' + (e.message||''), 'error');
    }
  });
}
