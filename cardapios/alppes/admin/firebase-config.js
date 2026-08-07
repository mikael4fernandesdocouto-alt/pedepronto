/* ============================================================
   FAMÍLIA CURITIBANA — Painel Administrativo
   firebase-config.js
   ------------------------------------------------------------
   Configuração do Firebase. Substitua os valores abaixo pelos
   do seu projeto Firebase (Project Settings → SDK setup).
   ============================================================ */
export const firebaseConfig = {
  apiKey:           "COLOQUE_API_KEY",
  authDomain:        "COLOQUE_AUTH_DOMAIN",
  projectId:         "COLOQUE_PROJECT_ID",
  storageBucket:     "COLOQUE_STORAGE_BUCKET",
  messagingSenderId: "COLOQUE_SENDER_ID",
  appId:             "COLOQUE_APP_ID"
};

/* Identificador único deste restaurante dentro do Firestore.
   Define qual subcoleção o painel enxergará (isolamento). */
export const RESTAURANT_ID = "alppes-sabor";

/* Número do WhatsApp exibido no cardápio (formato: 55 + DDD + número). */
export const RESTAURANT_WHATSAPP = "5551999999999";
