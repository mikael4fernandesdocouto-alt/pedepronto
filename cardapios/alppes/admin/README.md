# Painel Administrativo — Alppes Sabor

Painel SaaS para gestão completa do cardápio digital, sem necessidade de editar código.

## Arquivos importantes

- `firebase-config.js` — edite com as credenciais do seu projeto Firebase
- `firestore.rules`     — regras de segurança (raiz `cardapios/`)
- `storage.rules`       — regras do Storage
- `login.html`           — tela de login
- `index.html`           — painel principal

## Setup (uma única vez)

### 1. Criar projeto Firebase
1. Acesse https://console.firebase.google.com
2. Crie um novo projeto (ex.: `cardapios-digitais`)
3. Em **Authentication → Sign-in method**, ative **E-mail/senha**
4. Em **Authentication → Users**, clique em **Add user** e crie o login do dono
   (ex.: `dona@alppes-sabor.com`)

### 2. Pegar a configuração SDK
1. Em **Project Settings → General → SDK setup and configuration**
2. Copie os valores e preencha em `firebase-config.js`:
   ```js
   export const firebaseConfig = {
     apiKey:           "...",
     authDomain:        "...",
     projectId:         "...",
     storageBucket:     "...",
     messagingSenderId: "...",
     appId:             "..."
   };
   ```
3. O `RESTAURANT_ID = "alppes-sabor"` já está configurado. **Não altere**.

### 3. Configurar regras de segurança
1. No Firestore Database → **Rules**, cole o conteúdo de `../firestore.rules` e publique.
2. No Storage → **Rules**, cole o conteúdo de `../storage.rules` e publique.

### 4. Autorizar o administrador
No documento `restaurants/alppes-sabor/settings/info`, crie/adicione:
```json
{
  "admins": ["UID_DO_USUARIO_CRIADO"]
}
```
Substitua `UID_DO_USUARIO_CRIADO` pelo UID exibido na aba Authentication → Users.

### 5. Publicar o painel
Publique toda a pasta `admin/` em qualquer host estático (Netlify, Vercel, GitHub Pages,
Firebase Hosting). O cardápio público (`../index.html`) também precisa consumir o mesmo Firebase.

## Estrutura
```
admin/
├── index.html           (painel principal, com sidebar e áreas)
├── login.html           (tela de login com Firebase Auth)
├── firebase-config.js   (credenciais + RESTAURANT_ID)
├── css/
│   ├── style.css        (estilo do painel, paleta vermelho profundo + dourado)
│   └── login.css        (estilo do login)
├── js/
│   ├── auth.js          (Firebase Authentication + guard)
│   ├── firestore.js     (CRUD + realtime listeners)
│   ├── storage.js       (upload de imagens)
│   ├── ui.js            (toast, modal, skeleton, barra de progresso)
│   ├── app.js           (roteador SPA)
│   ├── dashboard.js     (métricas + atalhos)
│   ├── products.js      (CRUD produtos + upload + drag/drop + disponibilidade)
│   ├── categories.js   (CRUD categorias + reordenar + excluir c/ destino)
│   ├── promotions.js    (CRUD promoções + período + ativar/desativar)
│   ├── gallery.js       (upload múltiplo + excluir + reordenar)
│   └── settings.js      (banner, logo, info, configurações de aparência)
└── assets/
```

## Estrutura de dados no Firestore
```
restaurants/alppes-sabor/
  settings/
    info        → { name, phone, whatsapp, address, hours, instagram, facebook, website, admins:[] }
    banner      → { image, title, subtitle, text, buttonText }
    logo        → { url }
    appearance  → { primary, accent, buttonColor, bg, font, favicon }
  categories/{catId}    → { name, tag, order }
  products/{prodId}     → { name, categoryId, description, price, order, promotion, promoPrice, highlight, available, image }
  promotions/{promoId}  → { title, description, productId, startsAt, endsAt, active }
  gallery/{imgId}       → { url, alt, order }
```

## Funcionalidades do painel
- ✅ Login com Firebase Auth (redireciona quando deslogado)
- ✅ Dashboard com métricas e atalhos
- ✅ CRUD completo de produtos + upload de imagem + preview
- ✅ Busca em tempo real por nome e categoria
- ✅ Reordenação por arrastar-e-soltar (drag and drop)
- ✅ Marcar produto como disponível/indisponível
- ✅ CRUD de categorias + reordenar + excluir com destino dos produtos
- ✅ CRUD de promoções + período + ativar/desativar
- ✅ Galeria com upload múltiplo
- ✅ Edição de banner, logo, dados do restaurante
- ✅ Personalização de cores, fonte e favicon
- ✅ Atualização em tempo real no cardápio público
- ✅ Toasts, modais, confirmações, skeleton loading, barra de progresso
- ✅ Responsivo (desktop, tablet, celular)
- ✅ Isolamento entre restaurantes via regras do Firestore

Como o painel usa `onSnapshot` do Firestore, qualquer alteração feita
aqui aparece automaticamente no cardápio público — sem precisar publicar.
