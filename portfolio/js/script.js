/* ============================================================
   @pedepronto — Cardápios Digitais Premium
   ============================================================ */

/* ===== CONFIG =====
   AQUI VOCÊ CONTROLA TODOS OS LINKS DE CONTATO.
   O site foi feito para levar o visitante direto ao seu
   Instagram (@pedepronto) e finalizar a venda por lá.
   Substitua os valores abaixo pelos seus dados reais. */
const CONTACT = {
  instagramProfile: "https://www.instagram.com/pedepronto/",
  instagramDM:      "https://ig.me/m/pedepronto",     // abre o "Direto" (DM) já na conversa
  whatsapp:         "https://wa.me/5551999999999",    // <-- substituir pelo número real
  whatsappMsg:      encodeURIComponent("Olá! Vi o site do @pedepronto e quero um cardápio digital para o meu restaurante."),
  email:            "contato@pedepronto.com"
};

/* ===== PORTFÓLIO =====
   `real:true` abre o cardápio verdadeiro (iframe apontando para
   os arquivos em ../cardapios). `real:false` mostra um exemplo
   visual com placeholder (capa em gradiente). */
const PORTFOLIO = [
  {
    name: "Dona Ambrosina",
    cat: "Cozinha de família",
    city: "Centro",
    desc: "Cardápio & reservas com cara de casa de vó: quente, acolhedor e fácil de navegar no celular.",
    img: "assets/portfolio/dona-ambrosina.jpg",
    demo: "../cardapios/dona-ambrosina/index.html",
    real: true
  },
  {
    name: "Alppes Sabor à La Carte",
    cat: "À la carte",
    city: "Centro",
    desc: "Cardápio à la carte sofisticado, com carrinho e finalização direto pelo WhatsApp.",
    img: "assets/portfolio/alppes.jpg",
    demo: "../cardapios/alppes/index.html",
    real: true
  },
  {
    name: "Família Curitibana",
    cat: "Comida caseira",
    city: "Centro",
    desc: "Comida da roça com opção de retirada ou entrega no mesmo cardápio digital.",
    img: "assets/portfolio/familia-curitibana.jpg",
    demo: "../cardapios/familia-curitibana/index.html",
    real: true
  },
  {
    name: "Burger House",
    cat: "Hamburgueria",
    city: "São Paulo",
    desc: "Projeto de exemplo. O seu hambúrguer pode ganhar um cardápio assim, com a cara da sua marca.",
    real: false,
    grad: "grad-1",
    letter: "B"
  },
  {
    name: "La Fornaia",
    cat: "Pizzaria",
    city: "Curitiba",
    desc: "Projeto de exemplo. Visual quente e convidativo, perfeito para uma pizzaria.",
    real: false,
    grad: "grad-2",
    letter: "L"
  },
  {
    name: "Sushi Nami",
    cat: "Sushi",
    city: "Florianópolis",
    desc: "Projeto de exemplo. Clean e elegante, ideal para quem vende delivery e balcão.",
    real: false,
    grad: "grad-3",
    letter: "S"
  }
];

/* ===== util ===== */
const $  = s => document.querySelector(s);
const $$ = (s, ctx) => [...(ctx || document).querySelectorAll(s)];

/* ===== loader + pré-carregamento ===== */
window.addEventListener('load', () => {
  const loader = $('#loader');
  if (loader) loader.classList.add('done');
  requestAnimationFrame(() => document.body.classList.remove('preload'));
});

/* ===== ano no rodapé ===== */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ===== links de contato ===== */
function dmUrl() {
  return CONTACT.instagramDM;
}
function waUrl() {
  return CONTACT.whatsapp + '?text=' + CONTACT.whatsappMsg;
}
function handleAction(el) {
  const a = el.dataset.action;
  if (a === 'cta')   window.open(dmUrl(), '_blank', 'noopener');
  if (a === 'ig')    window.open(CONTACT.instagramProfile, '_blank', 'noopener');
  if (a === 'wa')    window.open(waUrl(), '_blank', 'noopener');
  if (a === 'mail')  window.location.href = 'mailto:' + CONTACT.email;
}
$$('[data-action]').forEach(el => el.addEventListener('click', e => {
  if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
  handleAction(el);
}));

/* ===== navegação: mobile menu ===== */
const navBurger = $('#navBurger');
const menu = $('#menu');
function closeMenu() {
  menu.classList.remove('open');
  navBurger.classList.remove('open');
  navBurger.setAttribute('aria-expanded', 'false');
}
navBurger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  navBurger.classList.toggle('open', open);
  navBurger.setAttribute('aria-expanded', String(open));
});
$$('.menu a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('click', e => {
  if (!menu.classList.contains('open')) return;
  if (!e.target.closest('.menu') && !e.target.closest('.nav-burger')) closeMenu();
});

/* ===== navbar ao rolar ===== */
const nav = $('#nav');
const navScrolled = () => nav.classList.toggle('scrolled', window.scrollY > 30);

/* ===== scrollspy: seção ativa ===== */
const navLinks = $$('.menu a:not(.menu-cta)');
const spy = () => {
  const y = window.scrollY + 110;
  let current = '';
  $$('main > section').forEach(sec => {
    if (sec.offsetTop <= y) current = sec.id;
  });
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  navScrolled();
};

/* ===== voltar ao topo ===== */
const toTop = $('#toTop');
const toggleTop = () => toTop.classList.toggle('show', window.scrollY > 600);
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

window.addEventListener('scroll', () => { spy(); toggleTop(); }, { passive: true });
window.addEventListener('resize', closeMenu, { passive: true });

/* ===== reveal on scroll ===== */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function initReveal() {
  if (reduceMotion) return;
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in-view');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
}

/* ===== render portfólio ===== */
const grid = $('#portfolioGrid');
function coverHTML(p) {
  if (p.img) {
    return `<div class="p-cover"><img src="${p.img}" alt="Capa do cardápio ${p.name}" loading="lazy"><span class="p-tag">${p.cat}</span></div>`;
  }
  return `<div class="p-cover"><span class="p-grad ${p.grad}">${p.letter}</span><span class="p-tag">${p.cat}</span></div>`;
}
function renderPortfolio() {
  grid.innerHTML = PORTFOLIO.map((p, i) => `
    <button type="button" class="p-card reveal" data-idx="${i}" aria-label="Ver demonstração de ${p.name}">
      ${coverHTML(p)}
      <div class="p-overlay"><span>Ver demonstração</span></div>
      <div class="p-body">
        <h3>${p.name}</h3>
        <div class="p-meta">
          <span>${p.city}</span><span class="dot"></span><span>${p.cat}</span>
          ${p.real ? '<span class="demo">Demo ao vivo →</span>' : '<span class="p-badge-exemplo">Exemplo</span>'}
        </div>
      </div>
    </button>`).join('');
  grid.querySelectorAll('.p-card').forEach(card => card.addEventListener('click', () => openModal(Number(card.dataset.idx))));
}

/* ===== modal de demonstração ===== */
const modal = $('#modal');
const modalScreen = $('#modalScreen');
const modalInfo = $('#modalInfo');
let current = 0;

function screenHTML(p) {
  if (p.real) {
    return `<iframe src="${p.demo}" title="Demonstração — ${p.name}" loading="lazy"></iframe>`;
  }
  return `
    <div class="m-placeholder">
      <div class="ph-logo">${p.letter}</div>
      <h3>${p.name}</h3>
      <p>Cardápio em desenvolvimento para este projeto de demonstração.</p>
      <span class="ph-note">Imagem ilustrativa — cada projeto é único</span>
    </div>`;
}
function infoHTML(p) {
  return `
    <span class="kicker">${p.real ? 'Cardápio real' : 'Projeto de exemplo'}</span>
    <div class="m-cat">${p.cat} · ${p.city}</div>
    <h2>${p.name}</h2>
    <p>${p.desc}</p>
    <div class="m-actions">
      <a class="btn btn-primary" href="#" data-action="cta"><svg class="ic"><use href="#i-ig"/></svg> Quero um cardápio assim</a>
      <a class="btn btn-ghost" href="#" data-action="wa"><svg class="ic"><use href="#i-wa"/></svg> WhatsApp</a>
    </div>
    <div class="m-demo-note">${p.real
      ? 'Esta é uma demonstração navegável do cardápio real que criamos.'
      : 'Este é um placeholder. Você escolhe fotos, cores e textos do seu próprio cardápio.'}</div>`;
}
function openModal(i) {
  current = (i + PORTFOLIO.length) % PORTFOLIO.length;
  const p = PORTFOLIO[current];
  modalScreen.innerHTML = screenHTML(p);
  modalInfo.innerHTML = infoHTML(p);
  $$('[data-action]', modalInfo).forEach(el => el.addEventListener('click', e => {
    e.preventDefault(); handleAction(el);
  }));
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lock');
}
function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  modalScreen.innerHTML = '';
  document.body.classList.remove('lock');
}
function navModal(dir) {
  const n = PORTFOLIO.length;
  const idx = ((current + dir) % n + n) % n;
  openModal(idx);
}
$('#modalClose').addEventListener('click', closeModal);
$('#modalPrev').addEventListener('click', () => navModal(-1));
$('#modalNext').addEventListener('click', () => navModal(1));
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => {
  if (!modal.classList.contains('open')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowRight') navModal(1);
  if (e.key === 'ArrowLeft') navModal(-1);
});

/* ===== FAQ: um item aberto por vez (opcional, progressivo) ===== */
$$('.faq-item').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) $$('.faq-item').forEach(o => { if (o !== item) o.open = false; });
  });
});

/* ===== init ===== */
renderPortfolio();
initReveal();
spy();
toggleTop();
