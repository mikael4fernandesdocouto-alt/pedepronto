/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   auth.js
   ------------------------------------------------------------
   - Inicializa Firebase Auth
   - Redireciona para login.html caso não autenticado
   - Expõe funções signIn / signOut / currentUser
   - Guarda o listener de estado
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut as fbSignOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let currentUser = null;
let onReady = null;

onAuthStateChanged(auth, user => {
  currentUser = user;
  if (onReady) onReady(user);
});

export const authApi = {
  auth,
  onReady(cb) {
    /* Se já houver um usuário, chama imediatamente. */
    if (currentUser) cb(currentUser);
    onReady = cb;
  },

  currentUser() { return currentUser; },
  isLoggedIn()  { return !!currentUser; },

  signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
      .then(cred => cred.user);
  },

  signOut() { return fbSignOut(auth); },

  /**
   * Guarda a página atual. Se não estiver autenticado,
   * redireciona para login.html.
   */
  guard() {
    if (!currentUser) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};
