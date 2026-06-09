/* ============================================================
   CONFIGURACIÓN DE FIREBASE  ·  Quiniela Mundial 2026 · Grupo Hogar
   Proyecto: quiniela-hogar
   ============================================================ */
window.QM_FIREBASE = {
  ENABLED: true,

  config: {
    apiKey: "AIzaSyCzWH7jpmum3uIotEn0pwzu-LbVUfFgiI8",
    authDomain: "quiniela-hogar.firebaseapp.com",
    projectId: "quiniela-hogar",
    storageBucket: "quiniela-hogar.firebasestorage.app",
    messagingSenderId: "349998331708",
    appId: "1:349998331708:web:8bded3731262657f70d039",
  },

  // Clave del panel de administrador (quien captura los resultados reales).
  ADMIN_PIN: "hogar2026",
};

/* ────────────────────────────────────────────────────────────
   API de resultados en tiempo real · api-sports.io (gratis)
   1. Regístrate en https://dashboard.api-football.com/register
   2. Copia tu API key y pégala abajo en KEY.
   Con el plan gratuito tienes 100 peticiones/día (más que suficiente).
   ──────────────────────────────────────────────────────────── */
window.QM_API = {
  KEY: "bc7de03f47e5ae1d36de7d55e0d0dc4d",
};
