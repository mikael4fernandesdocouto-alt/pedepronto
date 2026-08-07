/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   firestore.js
   ------------------------------------------------------------
   Camada de acesso ao Firestore. Toda consulta é feita dentro
   de `restaurants/{RESTAURANT_ID}/...`, garantindo isolamento
   entre restaurantes. As regras de segurança reforçam isso.
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc,
  addDoc, updateDoc, deleteDoc, onSnapshot, query, where,
  orderBy, writeBatch, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig, RESTAURANT_ID } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

const base = `restaurants/${RESTAURANT_ID}`;

/* ---------- Subcoleções ---------- */
const colPaths = {
  categories: `${base}/categories`,
  products:   `${base}/products`,
  gallery:   `${base}/gallery`,
  promotions:`${base}/promotions`,
};

/* ---------- Documentos únicos ---------- */
const docPaths = {
  settings: `${base}/settings/info`,
  banner:   `${base}/settings/banner`,
  logo:     `${base}/settings/logo`,
  configs:  `${base}/settings/appearance`,
};

export const firestore = {
  db, serverTimestamp, Timestamp,

  /* ----- Settings ----- */
  getSettings()   { return getDoc(doc(db, docPaths.settings)).then(s => s.data() || {}); },
  saveSettings(d) { return setDoc(doc(db, docPaths.settings), { ...d, updatedAt: serverTimestamp() }, { merge: true }); },
  watchSettings(cb) { return onSnapshot(doc(db, docPaths.settings), d => cb(d.data() || {})); },

  getBanner()     { return getDoc(doc(db, docPaths.banner)).then(s => s.data() || {}); },
  saveBanner(d)   { return setDoc(doc(db, docPaths.banner), { ...d, updatedAt: serverTimestamp() }, { merge: true }); },

  getLogo()       { return getDoc(doc(db, docPaths.logo)).then(s => s.data() || {}); },
  saveLogo(d)     { return setDoc(doc(db, docPaths.logo), { ...d, updatedAt: serverTimestamp() }, { merge: true }); },

  getAppearance() { return getDoc(doc(db, docPaths.configs)).then(s => s.data() || {}); },
  saveAppearance(d) { return setDoc(doc(db, docPaths.configs), { ...d, updatedAt: serverTimestamp() }, { merge: true }); },

  /* ----- Categorias ----- */
  listCategories() {
    return getDocs(query(collection(db, colPaths.categories), orderBy('order', 'asc')))
      .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
  },
  watchCategories(cb) {
    return onSnapshot(query(collection(db, colPaths.categories), orderBy('order', 'asc')), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  },
  addCategory(d)    { return addDoc(collection(db, colPaths.categories), { ...d, createdAt: serverTimestamp() }); },
  updateCategory(id, d) { return updateDoc(doc(db, colPaths.categories, id), { ...d, updatedAt: serverTimestamp() }); },
  deleteCategory(id)     { return deleteDoc(doc(db, colPaths.categories, id)); },
  batchOrderCategories(items) {
    const b = writeBatch(db);
    items.forEach((it, i) => b.update(doc(db, colPaths.categories, it.id), { order: i }));
    return b.commit();
  },

  /* ----- Produtos ----- */
  listProducts() {
    return getDocs(query(collection(db, colPaths.products), orderBy('order', 'asc')))
      .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
  },
  watchProducts(cb) {
    return onSnapshot(query(collection(db, colPaths.products), orderBy('order', 'asc')), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  },
  addProduct(d)    { return addDoc(collection(db, colPaths.products), { ...d, createdAt: serverTimestamp() }); },
  updateProduct(id, d) { return updateDoc(doc(db, colPaths.products, id), { ...d, updatedAt: serverTimestamp() }); },
  deleteProduct(id)    { return deleteDoc(doc(db, colPaths.products, id)); },
  batchOrderProducts(items) {
    const b = writeBatch(db);
    items.forEach((it, i) => b.update(doc(db, colPaths.products, it.id), { order: i }));
    return b.commit();
  },

  /* ----- Galeria ----- */
  listGallery() {
    return getDocs(query(collection(db, colPaths.gallery), orderBy('order', 'asc')))
      .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
  },
  watchGallery(cb) {
    return onSnapshot(query(collection(db, colPaths.gallery), orderBy('order', 'asc')), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  },
  addGallery(d)    { return addDoc(collection(db, colPaths.gallery), { ...d, createdAt: serverTimestamp() }); },
  deleteGallery(id){ return deleteDoc(doc(db, colPaths.gallery, id)); },
  batchOrderGallery(items) {
    const b = writeBatch(db);
    items.forEach((it, i) => b.update(doc(db, colPaths.gallery, it.id), { order: i }));
    return b.commit();
  },

  /* ----- Promoções ----- */
  listPromotions() {
    return getDocs(query(collection(db, colPaths.promotions), orderBy('createdAt', 'desc')))
      .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
  },
  watchPromotions(cb) {
    return onSnapshot(query(collection(db, colPaths.promotions), orderBy('createdAt', 'desc')), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  },
  addPromotion(d)      { return addDoc(collection(db, colPaths.promotions), { ...d, createdAt: serverTimestamp() }); },
  updatePromotion(id, d)   { return updateDoc(doc(db, colPaths.promotions, id), { ...d, updatedAt: serverTimestamp() }); },
  deletePromotion(id)      { return deleteDoc(doc(db, colPaths.promotions, id)); },

  /* ----- Filtro de produtos por categoria (para exclusão com destino) ----- */
  productsByCategory(catId) {
    return getDocs(query(collection(db, colPaths.products), where('categoryId', '==', catId)))
      .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })));
  },
  moveProductsToCategory(oldCatId, newCatId) {
    return this.productsByCategory(oldCatId).then(items => {
      const b = writeBatch(db);
      items.forEach(it => b.update(doc(db, colPaths.products, it.id), { categoryId: newCatId }));
      return b.commit();
    });
  },
  async deleteCategoryWithProducts(oldCatId) {
    const items = await this.productsByCategory(oldCatId);
    const b = writeBatch(db);
    items.forEach(it => b.delete(doc(db, colPaths.products, it.id)));
    b.delete(doc(db, colPaths.categories, oldCatId));
    return b.commit();
  },

  /* ----- Estatísticas ----- */
  async stats() {
    const [cats, prods, promos] = await Promise.all([
      this.listCategories(),
      this.listProducts(),
      this.listPromotions()
    ]);
    const unavailable = prods.filter(p => p.available === false).length;
    const onPromotion  = prods.filter(p => p.promotion === true).length;
    const highlighted  = prods.filter(p => p.highlight === true).length;
    const maxPrice     = prods.length ? Math.max(...prods.map(p => Number(p.price)||0)) : 0;
    const top          = prods.filter(p => Number(p.price) === maxPrice).slice(0, 3);
    return { cats: cats.length, prods: prods.length, unavailable, onPromotion, highlighted, maxPrice, top, promos: promos.length };
  }
};
