/* ============================================================
   CONFIGURACIÓN DE FIREBASE  ·  Quiniela Mundial 2026
   ------------------------------------------------------------
   Para activar el MODO COMPARTIDO (todos juegan online y la tabla
   se actualiza sola), sigue los pasos del archivo LÉEME.md y luego:

   1) Cambia  ENABLED  a  true
   2) Pega tu objeto  config  de Firebase (Project settings ▸ Tus apps)
   3) Cambia  ADMIN_PIN  por una clave secreta (la usa quien captura resultados)

   Si lo dejas en  false, la quiniela funciona igual pero los datos se
   guardan SOLO en el dispositivo de cada quien (sin tabla compartida).
   ============================================================ */
window.QM_FIREBASE = {
  ENABLED: false,

  config: {
    apiKey: "PEGA_TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "PEGA_TU_SENDER_ID",
    appId: "PEGA_TU_APP_ID",
  },

  // Clave del panel de administrador (quien captura los resultados reales).
  // Cámbiala por algo que solo tú sepas.
  ADMIN_PIN: "hogar2026",
};
