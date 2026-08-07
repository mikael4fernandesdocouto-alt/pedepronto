/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   categories.js
   ------------------------------------------------------------
   CRUD de categorias, reordenação por drag-and-drop e exclusão
   com escolha do destino dos produtos vinculados.
   ============================================================ */
import { firestore }   from './firestore.js';
import { toast, openModal, confirmAction, skeleton, escapeHTML } from './ui.js';

let cats = [];
let productsCount = {};

export async function renderCategories(root) {
  root.innerHTML = headerHTML();
  const list = root.querySelector('#catList');
  skeleton(list, 4);

  /* Carregar produtos para mostrar contagem em cada categoria */
  firestore.watchProducts(list => {
    productsCount = list.reduce((acc, p) => {
      acc[p.categoryId] = (acc[p.categoryId] || 0) + 1; return acc;
    }, {});
  });

  firestore.watchCategories(items => {
    cats = items || [];
    renderList(list);
  });

  root.querySelector('#addCat').addEventListener('click', () => openCatModal());
}

function headerHTML() {
  return `
    <div class="section-head">
      <div>
        <h2>Categorias</h2>
        <div class="sub">Organize seu cardápio. Arraste para reordenar.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-sm" id="addCat">＋ Nova categoria</button>
    </div>
    <div class="cat-list" id="catList"></div>`;
}

function renderList(list) {
  if (!cats.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">📚</div><h3>Nenhuma categoria ainda</h3><p>Crie seções para organizar seus produtos — Entradas, Pratos, Bebidas...</p><button class="btn btn-primary" onclick="document.getElementById('addCat').click()">＋ Criar categoria</button></div>`;
    return;
  }
  list.innerHTML = cats.map((c, i) => `
    <div class="cat-row" draggable="true" data-id="${c.id}" data-order="${c.order||i}">
      <div class="drag" style="cursor:grab;color:var(--muted);font-size:1.1rem;">⋮⋮</div>
      <div class="order-num">${(i+1).toString().padStart(2,'0')}</div>
      <div>
        <div><span class="name">${escapeHTML(c.name)}</span>${c.tag ? `<span class="tag">${escapeHTML(c.tag)}</span>` : ''}</div>
        <div class="count">${productsCount[c.id] || 0} produtos</div>
      </div>
      <div class="spacer"></div>
      <div class="actions">
        <button class="btn btn-sm btn-ghost" data-edit="${c.id}">Editar</button>
        <button class="btn btn-sm btn-danger" data-del="${c.id}">Excluir</button>
      </div>
    </div>`).join('');
  attachRowEvents(list);
}

function attachRowEvents(list) {
  list.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openCatModal(b.dataset.edit));
  list.querySelectorAll('[data-del]').forEach(b => b.onclick = () => deleteCat(b.dataset.del));

  /* Drag and drop */
  let dragEl = null;
  list.querySelectorAll('.cat-row').forEach(row => {
    row.addEventListener('dragstart', e => { dragEl = row; row.style.opacity = '.5'; e.dataTransfer.effectAllowed = 'move'; });
    row.addEventListener('dragend',   () => { row.style.opacity = ''; dragEl = null; });
    row.addEventListener('dragover',  e => { e.preventDefault(); if (dragEl && dragEl !== row) row.classList.add('drag-over'); });
    row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
    row.addEventListener('drop', async e => {
      e.preventDefault(); row.classList.remove('drag-over');
      if (!dragEl || dragEl === row) return;
      const kids = [...list.querySelectorAll('.cat-row')];
      const fromIdx = kids.indexOf(dragEl), toIdx = kids.indexOf(row);
      kids.splice(toIdx, 0, kids.splice(fromIdx, 1)[0]);
      const order = kids.map(k => ({ id: k.dataset.id, order: k.dataset.order }));
      await firestore.batchOrderCategories(order);
      toast('Ordem atualizada', 'success');
    });
  });
}

async function openCatModal(id) {
  const c = id ? cats.find(x => x.id === id) : { order: cats.length };
  const html = `
    <div class="modal-head"><h3>${id ? 'Editar categoria' : 'Nova categoria'}</h3><button class="close" data-close>×</button></div>
    <div class="modal-body">
      <div class="form-row"><label>Nome *</label><input id="c_name" value="${escapeHTML(c.name||'')}" placeholder="Ex: Entradas" required /></div>
      <div class="form-row"><label>Tag (subtítulo opcional)</label><input id="c_tag" value="${escapeHTML(c.tag||'')}" placeholder="Ex: Para começar" /></div>
      <div class="form-row"><label>Ordem de exibição</label><input id="c_order" type="number" min="0" value="${c.order != null ? c.order : cats.length}" /></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-close>Cancelar</button>
      <button class="btn btn-primary" id="c_save">${id ? 'Salvar' : 'Criar'}</button>
    </div>`;
  const { overlay, close } = await openModal(html);
  overlay.querySelector('#c_save').addEventListener('click', async () => {
    const name = overlay.querySelector('#c_name').value.trim();
    if (!name) { toast('Informe o nome.', 'error'); return; }
    const data = { name, tag: overlay.querySelector('#c_tag').value.trim(), order: parseInt(overlay.querySelector('#c_order').value) || 0 };
    try {
      if (id) await firestore.updateCategory(id, data);
      else await firestore.addCategory(data);
      toast(id ? 'Categoria atualizada' : 'Categoria criada', 'success');
      close();
    } catch (e) { toast('Erro: ' + (e.message||''), 'error'); }
  });
}

async function deleteCat(id) {
  const c = cats.find(x => x.id === id);
  const count = await firestore.productsByCategory(id).then(items => items.length);
  let choice = 'move';
  let destId = '';
  if (count > 0) {
    const ok = await confirmAction(`A categoria <strong>${escapeHTML(c.name)}</strong> possui <strong>${count} produto(s)</strong>. O que deseja fazer com eles?`,
      { title: 'Excluir categoria', button: 'Continuar', icon: '🗑️' });
    if (!ok) return;
    const others = cats.filter(o => o.id !== id);
    const html = `
      <div class="modal-head"><h3>Destino dos produtos</h3><button class="close" data-close>×</button></div>
      <div class="modal-body">
        <p style="margin-bottom:14px">O que fazer com os <strong>${count} produto(s)</strong> da categoria <strong>${escapeHTML(c.name)}</strong>?</p>
        <div class="form-row">
          <label><input type="radio" name="dest" value="move" checked /> Mover para outra categoria</label>
          <select id="dest_cat" style="margin-top:8px">
            ${others.map(o => `<option value="${o.id}">${escapeHTML(o.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <label><input type="radio" name="dest" value="delete" /> Excluir junto com a categoria</label>
        </div>
      </div>
      <div class="modal-actions"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-danger" id="confirm_del">Excluir categoria</button></div>`;
    const { overlay, close } = await openModal(html);
    const confirmed = await new Promise(res => {
      overlay.querySelector('[data-close]').onclick = () => { close(); res(false); };
      overlay.querySelector('#confirm_del').onclick  = () => { close(); res(true); };
    });
    if (!confirmed) return;
    choice = overlay.querySelector('input[name="dest"]:checked')?.value || 'move';
    destId = overlay.querySelector('#dest_cat')?.value;
  } else {
    if (!await confirmAction(`Excluir a categoria <strong>${escapeHTML(c.name)}</strong>?`, { title: 'Excluir', button: 'Excluir', icon: '🗑️' })) return;
  }

  try {
    if (choice === 'delete' || count === 0) {
      await firestore.deleteCategoryWithProducts(id);
    } else if (choice === 'move' && destId) {
      await firestore.moveProductsToCategory(id, destId);
      await firestore.deleteCategory(id);
    }
    toast('Categoria excluída', 'success');
  } catch (e) { toast('Erro: ' + (e.message||''), 'error'); }
}
