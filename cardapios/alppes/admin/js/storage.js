/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   storage.js
   ------------------------------------------------------------
   Camada de upload para o Firebase Storage.
   Caminho: restaurants/{RESTAURANT_ID}/images/{tipo}/{timestamp}_{filename}
   ============================================================ */
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { firebaseConfig, RESTAURANT_ID } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export const storageApi = {
  /**
   * Faz upload com callback de progresso.
   * @param {File} file
   * @param {'products'|'logo'|'banner'|'gallery'|'favicon'} type
   * @param {(pct:number)=>void} [onProgress]
   * @returns {Promise<string>} URL pública
   */
  upload(file, type, onProgress) {
    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
      const path = `restaurants/${RESTAURANT_ID}/images/${type}/${filename}`;
      const r = ref(storage, path);
      const task = uploadBytesResumable(r, file, { contentType: file.type });
      task.on('state_changed',
        snap => { if (onProgress) onProgress((snap.bytesTransferred / snap.totalBytes) * 100); },
        err => reject(err),
        () => getDownloadURL(r).then(resolve).catch(reject));
    });
  },

  /**
   * Remove um arquivo do Storage pela URL.
   * @param {string} url
   */
  remove(url) {
    try {
      const r = ref(storage, url);
      return deleteObject(r);
    } catch (e) { return Promise.resolve(); }
  }
};
