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
    meta: "qm2026_meta",
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
  let groupId = (window.QM && window.QM.DEFAULT_GROUP_ID) || "hogar";

  function cleanId(id) {
    return String(id || "").trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "grupo";
  }
  function setGroup(id) {
    groupId = cleanId(id);
    QMCloud.groupId = groupId;
  }
  function isLegacyGroup(id) {
    return cleanId(id || groupId) === ((window.QM && window.QM.DEFAULT_GROUP_ID) || "hogar");
  }
  function key(base) {
    if (isLegacyGroup()) return base;
    return base + "::" + groupId;
  }
  function prefix() {
    return "g_" + groupId + "__";
  }
  function docName(kind, id) {
    if (isLegacyGroup()) {
      if (kind === "player") return "player_" + cleanId(id);
      return kind;
    }
    if (kind === "player") return prefix() + "player_" + cleanId(id);
    return prefix() + kind;
  }
  function groupFromMetaDoc(id, data) {
    const m = /^g_(.+)___meta$/.exec(id) || /^g_(.+)__meta$/.exec(id);
    if (!m) return null;
    const gid = m[1];
    return {
      id: (data && data.id) || gid,
      name: (data && data.name) || gid.replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()),
      playersCount: data && Array.isArray(data.players) ? data.players.length : 0,
      updatedAt: data && (data.updatedAt || data.createdAt),
    };
  }

  function init() {
    if (FB.ENABLED && window.firebase && FB.config && FB.config.projectId && FB.config.projectId !== "TU_PROYECTO") {
      try {
        if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FB.config);
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

  // subscribe({ onPlayers, onOfficial, onConfig, onMeta }) -> unsubscribe()
  function subscribe(cbs) {
    cbs = cbs || {};
    if (mode === "cloud") {
      if (isLegacyGroup()) {
        const unsubLegacy = col.onSnapshot((snap) => {
          const players = {};
          let official = null, config = null, meta = null;
          snap.forEach((doc) => {
            const id = doc.id;
            if (id === "_official") official = doc.data();
            else if (id === "_config") config = doc.data();
            else if (id === "_meta") meta = doc.data();
            else if (id.indexOf("player_") === 0) players[id.slice(7)] = doc.data();
          });
          cbs.onPlayers && cbs.onPlayers(players);
          cbs.onOfficial && cbs.onOfficial(official || {});
          cbs.onConfig && cbs.onConfig(config || {});
          cbs.onMeta && cbs.onMeta(meta || {});
        }, (err) => {
          console.warn("onSnapshot legacy error, usando modo local:", err);
          mode = "local";
          QMCloud.enabled = false;
          QMCloud.mode = mode;
          deliverLocal(cbs);
        });
        return unsubLegacy;
      }
      const pfx = prefix();
      const q = col
        .where(firebase.firestore.FieldPath.documentId(), ">=", pfx)
        .where(firebase.firestore.FieldPath.documentId(), "<=", pfx + "\uf8ff");
      const unsub = q.onSnapshot((snap) => {
        const players = {};
        let official = null, config = null, meta = null;
        snap.forEach((doc) => {
          const id = doc.id.slice(pfx.length);
          if (id === "_official") official = doc.data();
          else if (id === "_config") config = doc.data();
          else if (id === "_meta") meta = doc.data();
          else if (id.indexOf("player_") === 0) players[id.slice(7)] = doc.data();
        });
        cbs.onPlayers && cbs.onPlayers(players);
        cbs.onOfficial && cbs.onOfficial(official || {});
        cbs.onConfig && cbs.onConfig(config || {});
        cbs.onMeta && cbs.onMeta(meta || {});
      }, (err) => {
        console.warn("onSnapshot error, usando modo local:", err);
        mode = "local";
        QMCloud.enabled = false;
        QMCloud.mode = mode;
        deliverLocal(cbs);
      });
      return unsub;
    }

    // modo local
    const deliver = () => {
      deliverLocal(cbs);
    };
    deliver();
    const validKeys = [key(LS.players), key(LS.official), key(LS.config), key(LS.meta)];
    const handler = (e) => { if (validKeys.includes(e.key)) deliver(); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }

  function savePlayer(id, data) {
    if (mode === "cloud") return col.doc(docName("player", id)).set(data);
    const all = lsGet(key(LS.players), {});
    all[cleanId(id)] = data;
    lsSet(key(LS.players), all);
  }
  function deletePlayer(id) {
    if (mode === "cloud") return col.doc(docName("player", id)).delete();
    const all = lsGet(key(LS.players), {});
    delete all[cleanId(id)];
    lsSet(key(LS.players), all);
  }
  function saveOfficial(data) {
    if (mode === "cloud") return col.doc(docName("_official")).set(data);
    lsSet(key(LS.official), data);
  }
  function saveConfig(data) {
    if (mode === "cloud") return col.doc(docName("_config")).set(data);
    lsSet(key(LS.config), data);
  }
  function saveMeta(data) {
    if (mode === "cloud") return col.doc(docName("_meta")).set(data);
    lsSet(key(LS.meta), data);
  }
  async function listGroups() {
    if (mode === "cloud") {
      const snap = await col.get();
      const groups = [];
      let legacyPlayers = 0;
      let hasLegacy = false;
      let legacyMeta = null;
      snap.forEach((doc) => {
        const group = groupFromMetaDoc(doc.id, doc.data());
        if (group) groups.push(group);
        if (doc.id === "_meta") { legacyMeta = doc.data(); hasLegacy = true; }
        else if (doc.id === "_official" || doc.id === "_config" || doc.id.indexOf("player_") === 0) hasLegacy = true;
        if (doc.id.indexOf("player_") === 0) legacyPlayers++;
      });
      if (hasLegacy && !groups.some((g) => g.id === ((window.QM && window.QM.DEFAULT_GROUP_ID) || "hogar"))) {
        groups.push({
          id: (window.QM && window.QM.DEFAULT_GROUP_ID) || "hogar",
          name: (legacyMeta && legacyMeta.name) || (window.QM && window.QM.META && window.QM.META.brand) || "Grupo Hogar",
          playersCount: legacyMeta && Array.isArray(legacyMeta.players) ? legacyMeta.players.length : legacyPlayers,
          updatedAt: legacyMeta && (legacyMeta.updatedAt || legacyMeta.createdAt),
          legacy: true,
        });
      }
      groups.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "") || a.name.localeCompare(b.name));
      return groups;
    }

    const groups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (!storageKey || storageKey.indexOf(LS.meta + "::") !== 0) continue;
      const gid = storageKey.slice((LS.meta + "::").length);
      const data = lsGet(storageKey, {});
      groups.push({
        id: data.id || gid,
        name: data.name || gid.replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()),
        playersCount: Array.isArray(data.players) ? data.players.length : 0,
        updatedAt: data.updatedAt || data.createdAt,
      });
    }
    groups.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "") || a.name.localeCompare(b.name));
    return groups;
  }
  async function deleteGroup(id) {
    const gid = cleanId(id);
    if (isLegacyGroup(gid)) {
      throw new Error("El grupo Hogar usa la data histórica de Firebase y no se elimina desde la app.");
    }
    if (mode === "cloud") {
      const pfx = "g_" + gid + "__";
      const snap = await col
        .where(firebase.firestore.FieldPath.documentId(), ">=", pfx)
        .where(firebase.firestore.FieldPath.documentId(), "<=", pfx + "\uf8ff")
        .get();
      const batch = db.batch();
      snap.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      return snap.size;
    }

    const suffix = "::" + gid;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.endsWith(suffix)) keys.push(storageKey);
    }
    keys.forEach((storageKey) => localStorage.removeItem(storageKey));
    return keys.length;
  }
  function deliverLocal(cbs) {
    cbs.onPlayers && cbs.onPlayers(lsGet(key(LS.players), {}));
    cbs.onOfficial && cbs.onOfficial(lsGet(key(LS.official), {}));
    cbs.onConfig && cbs.onConfig(lsGet(key(LS.config), {}));
    cbs.onMeta && cbs.onMeta(lsGet(key(LS.meta), {}));
  }

  const QMCloud = {
    enabled: false, mode: "local", groupId,
    init, setGroup, cleanId, subscribe, savePlayer, deletePlayer, saveOfficial, saveConfig, saveMeta, listGroups, deleteGroup,
  };
  window.QMCloud = QMCloud;
})();
