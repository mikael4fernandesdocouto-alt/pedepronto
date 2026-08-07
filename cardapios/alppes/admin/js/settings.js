/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   settings.js
   ------------------------------------------------------------
   Abriga quatro seções:
   - renderBanner:     imagem, título, subtítulo, texto e botão
   - renderLogo:       trocar a logo (upload + preview)
   - renderInfo:       dados do restaurante (endereço, etc.)
   - renderAppearance: cores, fonte e favicon
   ============================================================ */
import { firestore }  from './firestore.js';
import { storageApi } from './storage.js';
import { toast, openModal, uploadProgress, skeleton, escapeHTML, debounce } from './ui.js';

/* ===================== BANNER ===================== */
export async function renderBanner(root) {
  root.innerHTML = headerHTML('Banner Principal', 'Edite o banner do topo do cardápio', '🌄');
  const body = root.querySelector('#settingsBody');
  skeleton(body, 1);
  let banner = {};
  try { banner = await firestore.getBanner(); } catch(e){}
  body.innerHTML = bannerForm(banner);
  attachBannerEvents(body);
}
function bannerForm(b) {
  return `
  <div class="panel">
    <h3>Conteúdo do banner</h3>
    <p class="sub">Estas informações aparecem no topo do cardápio público.</p>
    <div class="image-preview ${b.image ? '' : 'empty'}" id="ban_prev" ${b.image ? `style="background-image:url('${escapeHTML(b.image)}')"` : ''}>${b.image ? '' : 'Imagem do banner'}</div>
    <div class="form-row" style="margin-top:14px">
      <label>Imagem de fundo</label>
      <input type="file" id="ban_file" accept="image/*" />
      <div id="ban_progress" style="display:none"></div>
    </div>
    <div class="form-row"><label>Título</label><input id="ban_title" value="${escapeHTML(b.title||'')}" placeholder="Título principal" /></div>
    <div class="form-row"><label>Subtítulo</label><input id="ban_sub" value="${escapeHTML(b.subtitle||'')}" placeholder="Subtítulo" /></div>
    <div class="form-row"><label>Texto</label><textarea id="ban_text" placeholder="Descrição">${escapeHTML(b.text||'')}</textarea></div>
    <div class="form-row"><label>Texto do botão principal</label><input id="ban_btn" value="${escapeHTML(b.buttonText||'')}" placeholder="Ex: Peça pelo WhatsApp" /></div>
    <button class="btn btn-primary" id="ban_save">Salvar banner</button>
  </div>`;
}
function attachBannerEvents(body) {
  let img = null;
  const fileInput = body.querySelector('#ban_file');
  const prev = body.querySelector('#ban_prev');
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0]; if (!f) return;
    prev.classList.remove('empty'); prev.style.backgroundImage = `url('${URL.createObjectURL(f)}')`; prev.innerHTML = '';
  });
  body.querySelector('#ban_save').addEventListener('click', async () => {
    const data = {
      title:    body.querySelector('#ban_title').value.trim(),
      subtitle: body.querySelector('#ban_sub').value.trim(),
      text:     body.querySelector('#ban_text').value.trim(),
      buttonText: body.querySelector('#ban_btn').value.trim(),
    };
    if (fileInput.files[0]) {
      const prog = uploadProgress(body.querySelector('#ban_progress').style.display='block');
      body.querySelector('#ban_progress').style.display = 'block';
      const up = uploadProgress(body.querySelector('#ban_progress'));
      try { data.image = await storageApi.upload(fileInput.files[0], 'banner', pct => up.set(pct)); up.done(); }
      catch (e) { toast('Falha no upload', 'error'); up.clear(); return; }
    }
    await firestore.saveBanner(data);
    toast('Banner salvo', 'success');
  });
}

/* ===================== LOGO ===================== */
export async function renderLogo(root) {
  root.innerHTML = headerHTML('Logo do restaurante', 'Troque a logo — recorte automático', '⭐');
  const body = root.querySelector('#settingsBody');
  skeleton(body, 1);
  let logo = {};
  try { logo = await firestore.getLogo(); } catch(e){}
  body.innerHTML = `
  <div class="panel">
    <h3>Logo</h3>
    <p class="sub">A logo aparece na barra de navegação e no rodapé do cardápio. Será cortada automaticamente em quadrado.</p>
    <div style="display:flex;align-items:center;gap:22px;margin-bottom:18px">
      <div id="logo_prev" style="width:120px;height:120px;border-radius:18px;background:var(--soft) center/cover;border:1px solid var(--line)">${logo.url ? '' : '<div style="display:grid;place-items:center;height:100%;color:var(--muted);font-size:.8rem">Prévia</div>'}</div>
      <div>
        <input type="file" id="logo_file" accept="image/*" style="display:none" />
        <button class="btn btn-primary" id="logo_pick">＋ Escolher imagem</button>
        <p style="margin-top:8px;color:var(--muted);font-size:.82rem">Recortamos para 120×120 automaticamente.</p>
        <div id="logo_progress" style="display:none;margin-top:10px"></div>
      </div>
    </div>
    <button class="btn btn-primary" id="logo_save">Salvar logo</button>
  </div>`;
  const prev = body.querySelector('#logo_prev');
  if (logo.url) prev.style.backgroundImage = `url('${escapeHTML(logo.url)}')`;
  const fileInput = body.querySelector('#logo_file');
  let picked = null;
  body.querySelector('#logo_pick').onclick = () => fileInput.click();
  fileInput.addEventListener('change', () => {
    picked = fileInput.files[0]; if (!picked) return;
    /* Pré-visualização com "corte" automático (object-fit:cover) */
    prev.style.backgroundSize = 'cover'; prev.style.backgroundPosition = 'center';
    prev.style.backgroundImage = `url('${URL.createObjectURL(picked)}')`;
    prev.innerHTML = '';
  });
  body.querySelector('#logo_save').onclick = async () => {
    if (!picked && !logo.url) { toast('Selecione uma imagem.', 'error'); return; }
    let url = logo.url;
    if (picked) {
      body.querySelector('#logo_progress').style.display = 'block';
      const up = uploadProgress(body.querySelector('#logo_progress'));
      try { url = await storageApi.upload(picked, 'logo', pct => up.set(pct)); up.done(); }
      catch(e) { toast('Falha no upload', 'error'); up.clear(); return; }
    }
    await firestore.saveLogo({ url });
    toast('Logo atualizada', 'success');
  };
}

/* ===================== INFO ===================== */
export async function renderInfo(root) {
  root.innerHTML = headerHTML('Informações do restaurante', 'Dados de contato e horário', 'ℹ️');
  const body = root.querySelector('#settingsBody');
  skeleton(body, 1);
  let info = {};
  try { info = await firestore.getSettings(); } catch(e){}
  body.innerHTML = `
  <div class="panel">
    <h3>Contato</h3>
    <p class="sub">Estas informações aparecem no rodapé do cardápio e nos pedidos via WhatsApp.</p>
    <div class="form-grid">
      <div class="form-row"><label>Nome do restaurante</label><input id="i_name"  value="${escapeHTML(info.name||'')}" /></div>
      <div class="form-row"><label>Telefone</label><input id="i_phone" value="${escapeHTML(info.phone||'')}" /></div>
      <div class="form-row"><label>WhatsApp (55+DDD+número)</label><input id="i_wpp" value="${escapeHTML(info.whatsapp||'')}" placeholder="5551999999999" /></div>
      <div class="form-row"><label>Endereço</label><input id="i_addr" value="${escapeHTML(info.address||'')}" /></div>
      <div class="form-row"><label>Instagram</label><input id="i_ig"  value="${escapeHTML(info.instagram||'')}" placeholder="@usuario" /></div>
      <div class="form-row"><label>Facebook</label><input id="i_fb"  value="${escapeHTML(info.facebook||'')}" /></div>
      <div class="form-row"><label>Site</label><input id="i_site" value="${escapeHTML(info.website||'')}" /></div>
      <div class="form-row"><label>Horário de funcionamento</label><input id="i_hours" value="${escapeHTML(info.hours||'')}" placeholder="Ter–Dom · 11h–22h" /></div>
    </div>
    <button class="btn btn-primary" id="i_save">Salvar informações</button>
  </div>`;
  body.querySelector('#i_save').onclick = async () => {
    const data = {
      name: body.querySelector('#i_name').value.trim(),
      phone: body.querySelector('#i_phone').value.trim(),
      whatsapp: body.querySelector('#i_wpp').value.trim(),
      address: body.querySelector('#i_addr').value.trim(),
      instagram: body.querySelector('#i_ig').value.trim(),
      facebook: body.querySelector('#i_fb').value.trim(),
      website: body.querySelector('#i_site').value.trim(),
      hours: body.querySelector('#i_hours').value.trim(),
    };
    await firestore.saveSettings(data);
    toast('Informações salvas', 'success');
  };
}

/* ===================== APPEARANCE ===================== */
export async function renderAppearance(root) {
  root.innerHTML = headerHTML('Configurações de aparência', 'Personalize as cores, a fonte e o favicon', '🎨');
  const body = root.querySelector('#settingsBody');
  skeleton(body, 1);
  let cfg = {};
  try { cfg = await firestore.getAppearance(); } catch(e){}
  body.innerHTML = `
  <div class="panel">
    <h3>Cores</h3>
    <p class="sub">Defina a identidade visual do cardápio. As alterações refletem automaticamente.</p>
    <div class="form-grid">
      <div class="form-row"><label>Cor principal</label><div class="color-input"><input type="color" id="c_primary" value="${cfg.primary||'#8a1f2b'}" /><input type="text" id="c_primary_t" value="${cfg.primary||'#8a1f2b'}" /></div></div>
      <div class="form-row"><label>Cor secundária (destaque)</label><div class="color-input"><input type="color" id="c_accent" value="${cfg.accent||'#c89b3c'}" /><input type="text" id="c_accent_t" value="${cfg.accent||'#c89b3c'}" /></div></div>
      <div class="form-row"><label>Cor dos botões</label><div class="color-input"><input type="color" id="c_button" value="${cfg.buttonColor||'#8a1f2b'}" /><input type="text" id="c_button_t" value="${cfg.buttonColor||'#8a1f2b'}" /></div></div>
      <div class="form-row"><label>Cor de fundo</label><div class="color-input"><input type="color" id="c_bg" value="${cfg.bg||'#f7f3ec'}" /><input type="text" id="c_bg_t" value="${cfg.bg||'#f7f3ec'}" /></div></div>
    </div>
    <div class="form-row" style="margin-top:18px">
      <label>Fonte do título</label>
      <select id="c_font">
        <option value="Fraunces" ${(cfg.font||'')==='Fraunces' ? 'selected' : ''}>Fraunces (serif clássica)</option>
        <option value="Playfair Display" ${cfg.font==='Playfair Display' ? 'selected' : ''}>Playfair Display</option>
        <option value="Lora" ${cfg.font==='Lora' ? 'selected' : ''}>Lora</option>
        <option value="Inter" ${cfg.font==='Inter' ? 'selected' : ''}>Inter (sans-serif)</option>
        <option value="Poppins" ${cfg.font==='Poppins' ? 'selected' : ''}>Poppins</option>
        <option value="Montserrat" ${cfg.font==='Montserrat' ? 'selected' : ''}>Montserrat</option>
      </select>
    </div>
    <div class="form-row">
      <label>Favicon (ícone do site)</label>
      <input type="file" id="c_fav" accept="image/png,image/x-icon,image/svg+xml" />
      ${cfg.favicon ? `<div style="margin-top:6px"><img src="${escapeHTML(cfg.favicon)}" style="height:32px;border-radius:6px" alt="favicon atual" /></div>` : ''}
      <div id="fav_progress" style="display:none;margin-top:8px"></div>
    </div>
    <button class="btn btn-primary" id="c_save">Salvar aparência</button>
  </div>`;

  /* keep text/color inputs in sync */
  body.querySelectorAll('input[type=color]').forEach(col => {
    col.addEventListener('input', () => col.parentElement.querySelector('input[type=text]').value = col.value);
  });
  body.querySelectorAll('input[type=text]').forEach(t => {
    if (t.id.endsWith('_t')) t.addEventListener('input', () => t.parentElement.querySelector('input[type=color]').value = t.value);
  });

  body.querySelector('#c_save').onclick = async () => {
    const data = {
      primary: body.querySelector('#c_primary').value,
      accent:  body.querySelector('#c_accent').value,
      buttonColor: body.querySelector('#c_button').value,
      bg:      body.querySelector('#c_bg').value,
      font:    body.querySelector('#c_font').value,
    };
    const favInput = body.querySelector('#c_fav');
    if (favInput.files[0]) {
      body.querySelector('#fav_progress').style.display = 'block';
      const up = uploadProgress(body.querySelector('#fav_progress'));
      try { data.favicon = await storageApi.upload(favInput.files[0], 'favicon', pct => up.set(pct)); up.done(); }
      catch (e) { toast('Falha no upload do favicon', 'error'); up.clear(); }
    }
    await firestore.saveAppearance(data);
    toast('Aparência salva', 'success');
  };
}

/* ===================== helper ===================== */
function headerHTML(title, sub, icon) {
  return `
    <div class="section-head">
      <div><h2>${title}</h2><div class="sub">${sub}</div></div>
    </div>
    <div id="settingsBody"></div>`;
}
