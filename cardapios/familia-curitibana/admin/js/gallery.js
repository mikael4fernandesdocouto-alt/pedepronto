/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   gallery.js
   ------------------------------------------------------------
   Galeria deimagens: upload múltiplo, exclusão e reordenação.
   ============================================================ */
import { firestore }   from './firestore.js';
import { storageApi }  from './storage.js';
import { toast, confirmAction, skeleton, uploadProgress, escapeHTML } from './ui.js';

let items = [];

export async function renderGallery(root) {
  root.innerHTML = headerHTML();
  const grid = root.querySelector('#galGrid');
  skeleton(grid, 4);

  firestore.watchGallery(list => { items = list || []; renderGrid(grid); });

  const input = root.querySelector('#galInput');
  input.addEventListener('change', () => handleUpload(input.files, grid));
  root.querySelector('#uploadBtn').addEventListener('click', () => input.click());

  /* drag/drop area */
  const drop = root.querySelector('#dropArea');
  ['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag-over'); }));
  ['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag-over'); }));
  drop.addEventListener('drop', e => handleUpload(e.dataTransfer.files, grid));
}

function headerHTML() {
  return `
    <div class="section-head">
      <div>
        <h2>Galeria</h2>
        <div class="sub">Imagens do seu restaurante. Arraste para reordenar.</div>
      </div>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-sm" id="uploadBtn">＋ Enviar imagens</button>
      <input type="file" id="galInput" accept="image/*" multiple style="display:none" />
    </div>
    <div id="dropArea" style="border:2px dashed var(--line);border-radius:var(--radius);padding:32px;text-align:center;color:var(--muted);margin-bottom:20px">
      Arraste imagens aqui ou clique em <strong>Enviar imagens</strong>
    </div>
    <div class="gallery-grid" id="galGrid"></div>`;
}

async function handleUpload(files, grid) {
  if (!files || !files.length) return;
  const arr = [...files];
  for (const f of arr) {
    try {
      const url = await storageApi.upload(f, 'gallery');
      await firestore.addGallery({ url, alt: f.name.replace(/\.[^.]+$/, ''), order: items.length });
    } catch (e) { toast('Falha no upload: ' + f.name, 'error'); }
  }
  toast('Imagens adicionadas', 'success');
  document.getElementById('galInput').value = '';
}

function renderGrid(grid) {
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="icon">🖼️</div><h3>Galeria vazia</h3><p>Envie imagens para mostrar no cardápio.</p></div>`;
    return;
  }
  grid.innerHTML = items.map(it => `
    <div class="gallery-item" draggable="true" data-id="${it.id}" data-order="${it.order||0}" style="background-image:url('${escapeHTML(it.url)}')">
      <span class="drag" title="Arrastar">⋮⋮</span>
      <div class="tools">
        <button class="del" data-del="${it.id}" title="Excluir">🗑️</button>
      </div>
    </div>`).join('');
  grid.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    const it = items.find(x => x.id === b.dataset.del);
    if (await confirmAction('Excluir esta imagem?', { title: 'Excluir', button: 'Excluir', icon: '🗑️' })) {
      await firestore.deleteGallery(it.id);
      if (it.url) storageApi.remove(it.url).catch(()=>{});
      toast('Imagem removida', 'success');
    }
  });
  /* sort */
  let dragEl = null;
  grid.querySelectorAll('.gallery-item').forEach(el => {
    el.addEventListener('dragstart', e => { dragEl = el; el.style.opacity = '.6'; e.dataTransfer.effectAllowed = 'move'; });
    el.addEventListener('dragend',   () => { el.style.opacity = ''; dragEl = null; });
    el.addEventListener('dragover',  e => { e.preventDefault(); if (dragEl && dragEl !== el) el.classList.add('drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', async e => {
      e.preventDefault(); el.classList.remove('drag-over');
      if (!dragEl || dragEl === el) return;
      const kids = [...grid.querySelectorAll('.gallery-item')];
      const fromIdx = kids.indexOf(dragEl), toIdx = kids.indexOf(el);
      kids.splice(toIdx, 0, kids.splice(fromIdx, 1)[0]);
      const order = kids.map(k => ({ id: k.dataset.id, order: k.dataset.order }));
      await firestore.batchOrderGallery(order);
      toast('Ordem atualizada', 'success');
    });
  });
}
