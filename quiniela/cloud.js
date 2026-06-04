/* ============================================================
   Quiniela Mundial 2026 — capa de sincronización
   Usa Firebase si está configurado; si no, guarda en este dispositivo.
   API uniforme para la app (no cambia según el modo).
   ============================================================ */
(function () {
  const FB = window.QM_FIREBASE || { ENABLED: false };
  const LS = {
    players: "qm2026_grupohogar",
    official: "qm2026_official",
    config: "qm2026_config",
  };

  function lsGet(key, def) {
    try { return JSON.parse(localStorage.getItem(key)) ?? def; }
    catch (e) { return def; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  let mode = "local";
  let db = null;
  let col = null;

  function init() {
    if (FB.ENABLED && window.firebase && FB.config && FB.config.projectId && FB.config.projectId !== "TU_PROYECTO") {
      try {
        firebase.initializeApp(FB.config);
        db = firebase.firestore();
        col = db.collection("quiniela");
        mode = "cloud";
      } catch (e) {
        console.warn("Firebase no se pudo iniciar, usando modo local:", e);
        mode = "local";
      }
    }
    QMCloud.enabled = mode === "cloud";
    QMCloud.mode = mode;
    return QMCloud.enabled;
  }

  // subscribe({ onPlayers, onOfficial, onConfig }) -> unsubscribe()
  function subscribe(cbs) {
    cbs = cbs || {};
    if (mode === "cloud") {
      const unsub = col.onSnapshot((snap) => {
        const players = {};
        let official = null, config = null;
        snap.forEach((doc) => {
          const id = doc.id;
          if (id === "_official") official = doc.data();
          else if (id === "_config") config = doc.data();
          else if (id.indexOf("player_") === 0) players[id.slice(7)] = doc.data();
        });
        cbs.onPlayers && cbs.onPlayers(players);
        cbs.onOfficial && cbs.onOfficial(official || {});
        cbs.onConfig && cbs.onConfig(config || {});
      }, (err) => console.warn("onSnapshot error:", err));
      return unsub;
    }

    // modo local
    const deliver = () => {
      cbs.onPlayers && cbs.onPlayers(lsGet(LS.players, {}));
      cbs.onOfficial && cbs.onOfficial(lsGet(LS.official, {}));
      cbs.onConfig && cbs.onConfig(lsGet(LS.config, {}));
    };
    deliver();
    const handler = (e) => { if ([LS.players, LS.official, LS.config].includes(e.key)) deliver(); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }

  function savePlayer(id, data) {
    if (mode === "cloud") return col.doc("player_" + id).set(data);
    const all = lsGet(LS.players, {});
    all[id] = data;
    lsSet(LS.players, all);
  }
  function saveOfficial(data) {
    if (mode === "cloud") return col.doc("_official").set(data);
    lsSet(LS.official, data);
  }
  function saveConfig(data) {
    if (mode === "cloud") return col.doc("_config").set(data);
    lsSet(LS.config, data);
  }

  const QMCloud = { enabled: false, mode: "local", init, subscribe, savePlayer, saveOfficial, saveConfig };
  window.QMCloud = QMCloud;
})();
