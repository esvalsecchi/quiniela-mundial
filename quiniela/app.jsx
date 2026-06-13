/* Quiniela Mundial 2026 — App principal (formato real 2026) */
const { useState, useEffect, useMemo, useRef } = React;
const QM = window.QM;
const ALL_CODES = Object.keys(QM.T);
const CAPS = QM.KO_CAPS;
const AUTO_SYNC_MS = 2 * 60 * 60 * 1000;

function initials(name) {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[1][0]).toUpperCase();
}
function blankKO() { return { r16: [], qf: [], sf: [], fin: [], champ: null, third: null }; }
function blankPred() { return { groups: {}, thirds: [], scores: {}, ko: blankKO(), ko2: blankKO(), koScores: {} }; }
function withDefaults(p) {
  p = p || {};
  return {
    ...p,
    groups: p.groups || {},
    thirds: p.thirds || [],
    scores: p.scores || {},
    ko: Object.assign(blankKO(), p.ko || {}),
    ko2: Object.assign(blankKO(), p.ko2 || {}),
    koScores: p.koScores || {},
  };
}
function dedup(a) { return a.filter((x, i) => x && a.indexOf(x) === i); }
function slugify(s) {
  return String(s || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
function titleFromSlug(s) {
  return String(s || "").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
function getInitialGroup() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = slugify(params.get("grupo"));
  if (fromUrl) return { id: fromUrl, name: titleFromSlug(fromUrl) };
  return null;
}
function rememberGroup(group) {
  try { localStorage.setItem("qm2026_last_group", JSON.stringify(group)); } catch (e) {}
  const url = new URL(window.location.href);
  url.searchParams.set("grupo", group.id);
  window.history.replaceState({}, "", url);
}
function clearRememberedGroup() {
  try { localStorage.removeItem("qm2026_last_group"); } catch (e) {}
  const url = new URL(window.location.href);
  url.searchParams.delete("grupo");
  window.history.replaceState({}, "", url);
}

function poolFrom(p) {
  const direct = [];
  QM.GROUPS.forEach((g) => { const v = (p.groups || {})[g.id] || {}; if (v.first) direct.push(v.first); if (v.second) direct.push(v.second); });
  return dedup(direct.concat(p.thirds || []));
}
function cleanKO(ko, pool) {
  ko = ko || {};
  const r16 = (ko.r16 || []).filter((c) => pool.includes(c)).slice(0, CAPS.r16);
  const qf = (ko.qf || []).filter((c) => r16.includes(c)).slice(0, CAPS.qf);
  const sf = (ko.sf || []).filter((c) => qf.includes(c)).slice(0, CAPS.sf);
  const fin = (ko.fin || []).filter((c) => sf.includes(c)).slice(0, CAPS.fin);
  const champ = fin.includes(ko.champ) ? ko.champ : null;
  const third = sf.filter((c) => !fin.includes(c)).includes(ko.third) ? ko.third : null;
  return { r16, qf, sf, fin, champ, third };
}
function normalize(p) {
  const validThirds = QM.GROUPS.map((g) => (p.groups[g.id] || {}).third).filter(Boolean);
  p.thirds = (p.thirds || []).filter((c) => validThirds.includes(c)).slice(0, 8);
  p.ko = cleanKO(p.ko, poolFrom(p));
  return p;
}
function toggleInSet(arr, code, cap) {
  arr = arr || [];
  if (arr.includes(code)) return arr.filter((x) => x !== code);
  if (arr.length >= cap) return arr;
  return [...arr, code];
}

function GroupGate({ onEnter }) {
  const [joinCode, setJoinCode] = useState("");
  const [newName, setNewName] = useState("");
  const [knownGroups, setKnownGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    let alive = true;
    async function loadGroups() {
      setLoadingGroups(true);
      try {
        QMCloud.init();
        const groups = await QMCloud.listGroups();
        if (alive) setKnownGroups(groups || []);
      } catch (e) {
        console.warn("No se pudieron cargar los grupos:", e);
        if (alive) setKnownGroups([]);
      }
      if (alive) setLoadingGroups(false);
    }
    loadGroups();
    return () => { alive = false; };
  }, []);

  function join(e) {
    e.preventDefault();
    const id = slugify(joinCode);
    if (!id) return;
    onEnter({ id, name: titleFromSlug(id) });
  }
  function create(e) {
    e.preventDefault();
    const name = newName.trim();
    const id = slugify(name);
    if (!id) return;
    onEnter({ id, name });
  }
  function enterDefault() {
    onEnter({ id: QM.DEFAULT_GROUP_ID, name: QM.META.brand });
  }

  return (
    <React.Fragment>
      <div className="colorbar">{QM.GROUPS.map((g) => <span key={g.id} style={{ background: g.color }}></span>)}</div>
      <main className="group-gate">
        <div className="gate-shell">
          <span className="brand-badge">Quiniela Mundial 2026</span>
          <h1>Elige tu grupo</h1>
          <p>Cada familia o grupo tiene su propio enlace, jugadores, pronósticos, resultados y tabla.</p>
          <div className="gate-grid">
            <form className="gate-panel" onSubmit={join}>
              <h2>Entrar a un grupo</h2>
              <label>Código del grupo</label>
              <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="familia-a" />
              <button className="btn solid" type="submit">Entrar</button>
            </form>
            <form className="gate-panel" onSubmit={create}>
              <h2>Crear grupo</h2>
              <label>Nombre del grupo</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Familia A" />
              <button className="btn solid" type="submit">Crear enlace</button>
            </form>
          </div>
          <div className="known-groups">
            <div className="known-head">
              <h2>Grupos creados</h2>
              <span>{loadingGroups ? "Cargando..." : knownGroups.length + " disponibles"}</span>
            </div>
            {loadingGroups ? (
              <div className="known-empty">Buscando grupos...</div>
            ) : knownGroups.length ? (
              <div className="known-list">
                {knownGroups.map((g) => (
                  <button key={g.id} className="known-group" onClick={() => onEnter({ id: g.id, name: g.name })}>
                    <span>
                      <b>{g.name}</b>
                      <small>Código {g.id}</small>
                    </span>
                    <em>{g.playersCount || 0} jugadores</em>
                  </button>
                ))}
              </div>
            ) : (
              <div className="known-empty">Todavía no hay grupos guardados. Crea uno y aparecerá aquí.</div>
            )}
          </div>
          <button className="gate-link" onClick={enterDefault}>Entrar al grupo Hogar</button>
        </div>
      </main>
    </React.Fragment>
  );
}

function PlayerCreator({ onCreate, compact }) {
  const [name, setName] = useState("");
  function submit(e) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    onCreate(clean);
    setName("");
  }
  return (
    <form className={"player-create" + (compact ? " compact" : "")} onSubmit={submit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del jugador" />
      <button className="btn solid" type="submit">Crear jugador</button>
    </form>
  );
}

function App() {
  const [group, setGroup] = useState(getInitialGroup());
  const [meta, setMeta] = useState(null);
  const [all, setAll] = useState({});
  const [official, setOfficial] = useState({});
  const [config, setConfig] = useState({});
  const [pid, setPid] = useState(null);
  const [tab, setTab] = useState("scores");
  const [isAdmin, setIsAdmin] = useState(false);
  const autoSyncingRef = useRef(false);

  useEffect(() => {
    if (!group) return undefined;
    rememberGroup(group);
    QMCloud.setGroup(group.id);
    QMCloud.init();
    setAll({});
    setOfficial({});
    setConfig({});
    setMeta(null);
    const unsub = QMCloud.subscribe({
      onPlayers: (p) => setAll(p || {}),
      onOfficial: (o) => setOfficial(o || {}),
      onConfig: (c) => setConfig(c || {}),
      onMeta: (m) => setMeta(m || {}),
    });
    const metaFallback = setTimeout(() => {
      setMeta((cur) => cur === null ? {} : cur);
    }, 1600);
    return () => { clearTimeout(metaFallback); if (unsub) unsub(); };
  }, [group && group.id]);

  useEffect(() => {
    if (!group || meta === null || meta.id) return;
    const isDefault = group.id === QM.DEFAULT_GROUP_ID;
    const next = {
      id: group.id,
      name: group.name || titleFromSlug(group.id),
      players: isDefault ? QM.DEFAULT_PLAYERS : [],
      createdAt: new Date().toISOString(),
    };
    setMeta(next);
    QMCloud.saveMeta(next);
  }, [group, meta]);

  const players = useMemo(() => {
    const list = meta && Array.isArray(meta.players) ? meta.players : [];
    return list.filter((p) => p && p.id && p.name);
  }, [meta]);

  useEffect(() => {
    if (!players.length) { setPid(null); return; }
    if (!pid || !players.some((p) => p.id === pid)) setPid(players[0].id);
  }, [players, pid]);

  const pred = pid ? withDefaults(all[pid]) : blankPred();
  const lockMode = config && config.locked !== undefined ? config.locked : QM.CONFIG.locked;
  const lockedNow = lockMode === true;
  const phase2Open = !!(config && config.phase2Open);
  const groupName = (meta && meta.name) || (group && group.name) || QM.META.brand;

  function hasOfficialScore(mid) {
    return QMScore.hasScore((official.scores || {})[mid]);
  }
  function matchClosed(mid) {
    const m = QM.MATCHES.find((x) => x.id === mid);
    const byKickoff = m && m.lockAt ? Date.now() >= Date.parse(m.lockAt) : false;
    return lockedNow || hasOfficialScore(mid) || byKickoff;
  }
  function groupClosed(gid) {
    return lockedNow;
  }
  function anyGroupMatchClosed() {
    return lockedNow;
  }
  function koMatchClosed(round, matchIdx) {
    if (!phase2Open) return true;
    const s = official.koScores || {};
    const v = (round === "fin" || round === "third")
      ? s[round]
      : (Array.isArray(s[round]) ? s[round][matchIdx] : null);
    return QMScore.hasScore(v);
  }

  // Auto-fill group positions whenever this player's data changes (covers Firebase load + score edits)
  useEffect(() => {
    if (!pid) return;
    const p = (all || {})[pid];
    if (!p || !p.scores) return;
    const updates = {};
    QM.GROUPS.forEach((g) => {
      const s = QMScore.calcGroupStandings(g.id, p.scores);
      if (!s) return;
      const c = (p.groups || {})[g.id] || {};
      if (c.first !== s.first || c.second !== s.second || c.third !== s.third) updates[g.id] = s;
    });
    if (!Object.keys(updates).length) return;
    const updated = { ...p, groups: { ...(p.groups || {}), ...updates } };
    setAll((prev) => ({ ...prev, [pid]: updated }));
    QMCloud.savePlayer(pid, updated);
  }, [pid, all]);

  /* ---------- mutaciones de jugador ---------- */
  function updatePlayer(mut) {
    if (!pid || lockedNow) return;
    setAll((prev) => {
      const cur = JSON.parse(JSON.stringify(withDefaults(prev[pid])));
      mut(cur); normalize(cur);
      QMCloud.savePlayer(pid, cur);
      return { ...prev, [pid]: cur };
    });
  }
  const pickGroup = (gid, slot, code) => updatePlayer((p) => {
    if (groupClosed(gid)) return;
    const g = p.groups[gid] || {};
    if (g[slot] === code) delete g[slot];
    else { ["first", "second", "third"].forEach((s) => { if (g[s] === code) delete g[s]; }); g[slot] = code; }
    p.groups[gid] = g;
  });
  const toggleThird = (code) => updatePlayer((p) => {
    if (anyGroupMatchClosed()) return;
    p.thirds = toggleInSet(p.thirds, code, 8);
  });
  const setScore = (mid, k, val) => updatePlayer((p) => {
    if (matchClosed(mid)) return;
    p.scores[mid] = p.scores[mid] || {}; p.scores[mid][k] = val;
    const groupId = QM.MATCHES.find((m) => m.id === mid)?.group;
    if (groupId) {
      const standings = QMScore.calcGroupStandings(groupId, p.scores);
      if (standings) { p.groups = p.groups || {}; p.groups[groupId] = standings; }
    }
  });
  const koToggle = (key, code) => updatePlayer((p) => { p.ko[key] = toggleInSet(p.ko[key], code, CAPS[key]); });
  const koSingle = (key, code) => updatePlayer((p) => { p.ko[key] = p.ko[key] === code ? null : code; });

  function updatePlayerKo2(mut) {
    if (!pid || !phase2Open) return;
    setAll((prev) => {
      const cur = JSON.parse(JSON.stringify(withDefaults(prev[pid])));
      if (!cur.ko2) cur.ko2 = blankKO();
      mut(cur);
      cur.ko2 = cleanKO(cur.ko2, offPool);
      QMCloud.savePlayer(pid, cur);
      return { ...prev, [pid]: cur };
    });
  }
  const ko2Toggle = (key, code) => updatePlayerKo2((p) => { p.ko2[key] = toggleInSet(p.ko2[key], code, CAPS[key]); });
  const ko2Single = (key, code) => updatePlayerKo2((p) => { p.ko2[key] = p.ko2[key] === code ? null : code; });

  function setBracketScore(round, matchIdx, k, val) {
    if (!phase2Open || koMatchClosed(round, matchIdx)) return;
    setAll((prev) => {
      const cur = JSON.parse(JSON.stringify(withDefaults(prev[pid])));
      if (!cur.koScores) cur.koScores = {};
      if (round === 'fin' || round === 'third') {
        if (!cur.koScores[round] || typeof cur.koScores[round] !== 'object' || Array.isArray(cur.koScores[round])) {
          cur.koScores[round] = {};
        }
        cur.koScores[round][k] = val;
      } else {
        if (!Array.isArray(cur.koScores[round])) cur.koScores[round] = [];
        if (!cur.koScores[round][matchIdx]) cur.koScores[round][matchIdx] = {};
        cur.koScores[round][matchIdx][k] = val;
      }
      // Derive ko2 from bracket
      const r16Pairs = (official.bracketPairs || {}).r16 || [];
      if (window.buildBracket && r16Pairs.length > 0) {
        const bracket = window.buildBracket(r16Pairs, cur.koScores);
        if (bracket) cur.ko2 = window.deriveKO(bracket);
      }
      QMCloud.savePlayer(pid, cur);
      return { ...prev, [pid]: cur };
    });
  }

  function setBracketScoreOff(round, matchIdx, k, val) {
    setOfficial((prev) => {
      const cur = JSON.parse(JSON.stringify(prev || {}));
      if (!cur.koScores) cur.koScores = {};
      if (round === 'fin' || round === 'third') {
        if (!cur.koScores[round] || typeof cur.koScores[round] !== 'object' || Array.isArray(cur.koScores[round])) {
          cur.koScores[round] = {};
        }
        cur.koScores[round][k] = val;
      } else {
        if (!Array.isArray(cur.koScores[round])) cur.koScores[round] = [];
        if (!cur.koScores[round][matchIdx]) cur.koScores[round][matchIdx] = {};
        cur.koScores[round][matchIdx][k] = val;
      }
      // Derive official ko from bracket
      const r16Pairs = (cur.bracketPairs || {}).r16 || [];
      if (window.buildBracket && r16Pairs.length > 0) {
        const bracket = window.buildBracket(r16Pairs, cur.koScores);
        if (bracket) cur.ko = window.deriveKO(bracket);
      }
      QMCloud.saveOfficial(cur);
      return cur;
    });
  }

  function resetPlayer() {
    if (!pid) return;
    if (lockedNow) { alert("Los pronósticos están cerrados."); return; }
    const player = players.find((x) => x.id === pid);
    if (!player) return;
    if (!confirm(`¿Borrar los pronósticos de ${player.name}?`)) return;
    const blank = blankPred();
    setAll((prev) => ({ ...prev, [pid]: blank }));
    QMCloud.savePlayer(pid, blank);
  }
  function addPlayer(name) {
    if (!name || !name.trim()) return;
    const base = slugify(name);
    let id = base || ("jugador-" + Date.now());
    let n = 2;
    while (players.some((p) => p.id === id)) id = base + "-" + n++;
    const color = QM.PLAYER_COLORS[players.length % QM.PLAYER_COLORS.length] || "oklch(0.58 0.17 152)";
    const player = { id, name: name.trim(), color, createdAt: new Date().toISOString() };
    const next = {
      ...(meta || {}),
      id: group.id,
      name: groupName,
      players: [...players, player],
      updatedAt: new Date().toISOString(),
    };
    setMeta(next);
    setAll((prev) => ({ ...prev, [id]: blankPred() }));
    setPid(id);
    QMCloud.saveMeta(next);
    QMCloud.savePlayer(id, blankPred());
  }
  function changeGroup() {
    clearRememberedGroup();
    setGroup(null);
    setMeta(null);
    setAll({});
    setOfficial({});
    setConfig({});
    setPid(null);
    setIsAdmin(false);
    setTab("scores");
  }

  /* ---------- mutaciones de resultados oficiales (admin) ---------- */
  function updateOfficial(mut) {
    setOfficial((prev) => {
      const cur = JSON.parse(JSON.stringify(withDefaults(prev)));
      mut(cur); normalize(cur);
      QMCloud.saveOfficial(cur);
      return cur;
    });
  }
  const pickGroupOff = (gid, slot, code) => updateOfficial((p) => {
    const g = p.groups[gid] || {};
    if (g[slot] === code) delete g[slot];
    else { ["first", "second", "third"].forEach((s) => { if (g[s] === code) delete g[s]; }); g[slot] = code; }
    p.groups[gid] = g;
  });
  const toggleThirdOff = (code) => updateOfficial((p) => { p.thirds = toggleInSet(p.thirds, code, 8); });
  const setScoreOff = (mid, k, val) => updateOfficial((p) => {
    p.scores[mid] = p.scores[mid] || {}; p.scores[mid][k] = val;
    const groupId = QM.MATCHES.find((m) => m.id === mid)?.group;
    if (groupId) {
      const standings = QMScore.calcGroupStandings(groupId, p.scores);
      if (standings) { p.groups = p.groups || {}; p.groups[groupId] = standings; }
    }
  });
  const koToggleOff = (key, code) => updateOfficial((p) => { p.ko[key] = toggleInSet(p.ko[key], code, CAPS[key]); });
  const koSingleOff = (key, code) => updateOfficial((p) => { p.ko[key] = p.ko[key] === code ? null : code; });
  function clearOfficial() {
    if (!confirm("¿Borrar TODOS los resultados oficiales? La tabla volverá a cero.")) return;
    const blank = blankPred();
    setOfficial(blank); QMCloud.saveOfficial(blank);
  }
  function setLock(val) { const next = { ...config, locked: val }; setConfig(next); QMCloud.saveConfig(next); }
  function setPhase2(val) { const next = { ...config, phase2Open: val }; setConfig(next); QMCloud.saveConfig(next); }
  function syncOfficialScores(newScores) {
    updateOfficial((p) => {
      Object.entries(newScores).forEach(([mid, score]) => {
        p.scores[mid] = score;
        const groupId = QM.MATCHES.find((m) => m.id === mid)?.group;
        if (groupId) {
          const standings = QMScore.calcGroupStandings(groupId, p.scores);
          if (standings) { p.groups = p.groups || {}; p.groups[groupId] = standings; }
        }
      });
    });
  }
  async function autoSyncOfficialScores() {
    if (!group || meta === null || !window.QMAPI || autoSyncingRef.current) return;
    const last = config && config.lastAutoSyncAt ? Date.parse(config.lastAutoSyncAt) : 0;
    if (last && Date.now() - last < AUTO_SYNC_MS) return;

    autoSyncingRef.current = true;
    const syncedAt = new Date().toISOString();
    try {
      const fixtures = await window.QMAPI.fetchGroupFixtures();
      const scores = window.QMAPI.parseScores(fixtures);
      let changed = 0;
      const cur = JSON.parse(JSON.stringify(withDefaults(official)));

      Object.entries(scores).forEach(([mid, score]) => {
        const prev = (cur.scores || {})[mid] || {};
        if (+prev.h === +score.h && +prev.a === +score.a) return;
        cur.scores[mid] = score;
        changed++;
        const groupId = QM.MATCHES.find((m) => m.id === mid)?.group;
        if (groupId) {
          const standings = QMScore.calcGroupStandings(groupId, cur.scores);
          if (standings) { cur.groups = cur.groups || {}; cur.groups[groupId] = standings; }
        }
      });

      if (changed) {
        normalize(cur);
        setOfficial(cur);
        QMCloud.saveOfficial(cur);
      }

      const nextConfig = {
        ...config,
        lastAutoSyncAt: syncedAt,
        lastAutoSyncSource: fixtures.source || "api",
        lastAutoSyncMatches: Object.keys(scores).length,
        lastAutoSyncChanged: changed,
        lastAutoSyncError: null,
      };
      setConfig(nextConfig);
      QMCloud.saveConfig(nextConfig);
    } catch (e) {
      const nextConfig = {
        ...config,
        lastAutoSyncAt: syncedAt,
        lastAutoSyncError: e.message || String(e),
      };
      setConfig(nextConfig);
      QMCloud.saveConfig(nextConfig);
      console.warn("Auto sync de resultados falló:", e);
    } finally {
      autoSyncingRef.current = false;
    }
  }

  useEffect(() => {
    if (!group || meta === null) return undefined;
    let alive = true;
    const run = () => { if (alive) autoSyncOfficialScores(); };
    const first = setTimeout(run, 2500);
    const interval = setInterval(run, AUTO_SYNC_MS);
    return () => {
      alive = false;
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [group && group.id, meta !== null, config && config.lastAutoSyncAt, official]);

  function loginAdmin() {
    const pin = prompt("PIN de administrador:");
    if (pin == null) return;
    const real = (window.QM_FIREBASE && window.QM_FIREBASE.ADMIN_PIN) || "hogar2026";
    if (pin === real) { setIsAdmin(true); setTab("admin"); }
    else alert("PIN incorrecto.");
  }

  /* ---------- derivados ---------- */
  const pool = useMemo(() => poolFrom(pred), [pred.groups, pred.thirds]);
  const offPool = useMemo(() => poolFrom(official), [official.groups, official.thirds]);

  const groupsDone = QM.GROUPS.filter((g) => { const v = pred.groups[g.id] || {}; return v.first && v.second && v.third; }).length;
  const thirdsDone = (pred.thirds || []).length;
  const scoresDone = QM.MATCHES.filter((m) => QMScore.hasScore((pred.scores || {})[m.id])).length;
  const closedScores = QM.MATCHES.filter((m) => matchClosed(m.id)).length;

  const standings = useMemo(() => QMScore.standings(all, official, players), [all, official, players]);
  const hasResults = QMScore.hasOfficialResults(official);
  const playerHasChamp = (id) => {
    const p = all[id];
    if (!p) return false;
    const fin = p.koScores && p.koScores.fin;
    return !!(fin && fin.h !== '' && fin.h != null && fin.a !== '' && fin.a != null);
  };
  const curPlayer = players.find((x) => x.id === pid);

  if (!group) {
    return <GroupGate onEnter={setGroup} />;
  }
  if (meta === null) {
    return (
      <React.Fragment>
        <div className="colorbar">{QM.GROUPS.map((g) => <span key={g.id} style={{ background: g.color }}></span>)}</div>
        <div className="wrap"><div className="section"><div className="lb-empty">Cargando grupo...</div></div></div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <div className="colorbar">{QM.GROUPS.map((g) => <span key={g.id} style={{ background: g.color }}></span>)}</div>

      <header className="masthead">
        <div className="wrap">
          <div className="mast-top">
            <span className="brand-badge">{groupName}</span>
            <span className="brand-sub">Grupo privado · Código {group.id}</span>
            <div className="mast-actions no-print">
              <button className="mast-btn" title="Cambiar grupo" onClick={changeGroup}>Cambiar grupo</button>
              <button className="mast-btn" title="Borrar pronósticos" onClick={resetPlayer}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
              <button className="mast-btn" title="Imprimir quiniela" onClick={() => window.print()}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              </button>
              {isAdmin
                ? <button className="mast-btn mast-admin" onClick={() => { setIsAdmin(false); if (tab === "admin") setTab("table"); }}>✕ Salir admin</button>
                : <button className="mast-btn mast-admin" onClick={loginAdmin}>🔐 Admin</button>}
            </div>
            <span className={"cloud-pill no-print " + (QMCloud.enabled ? "on" : "off")}>
              <span className="dot"></span>{QMCloud.enabled ? "En la nube" : "Este dispositivo"}
            </span>
          </div>
          <h1 className="mast-title">Quiniela<br /><em>Mundial</em> 2026</h1>
          <div className="mast-meta">
            <span><b>48</b> selecciones</span><span><b>12</b> grupos</span><span>{QM.META.sub}</span>
          </div>
          {curPlayer && <div className="print-only print-name" style={{ display: "none", marginTop: 14, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>Quiniela de: {curPlayer.name}</div>}
        </div>
      </header>

      <div className="playerbar no-print">
        <div className="wrap">
          <span className="pb-label">Jugador</span>
          <div className="players">
            {players.map((pl) => (
              <button key={pl.id} className={"chip" + (pl.id === pid ? " active" : "")} onClick={() => setPid(pl.id)}>
                <span className="av" style={{ background: pl.color }}>{initials(pl.name)}</span>
                {pl.name}
                {playerHasChamp(pl.id) && <span className="done-dot" title="Campeón elegido"></span>}
              </button>
            ))}
            <PlayerCreator onCreate={addPlayer} compact />
          </div>
        </div>
      </div>

      <div className="wrap">
        {!players.length && (
          <section className="section">
            <div className="empty-panel">
              <h2>Este grupo aún no tiene jugadores</h2>
              <p>Crea el primer jugador para empezar a llenar pronósticos. Después comparte este enlace con el resto del grupo.</p>
              <PlayerCreator onCreate={addPlayer} />
            </div>
          </section>
        )}
        {!!players.length && (
        <React.Fragment>
        <nav className="tabs no-print">
          <button className={"tab" + (tab === "scores" ? " active" : "")} onClick={() => setTab("scores")}>Marcadores <span className="tnum">{scoresDone}/72</span></button>
          <button className={"tab" + (tab === "groups" ? " active" : "")} onClick={() => setTab("groups")}>Fase de Grupos <span className="tnum">{groupsDone}/12</span></button>
          <button className={"tab" + (tab === "ko" ? " active" : "")} onClick={() => setTab("ko")}>Camino al Título <span className="tnum">{phase2Open ? ((pred.koScores && pred.koScores.fin && pred.koScores.fin.h !== '' && pred.koScores.fin.h != null) ? "🏆" : "—") : "⏳"}</span></button>
          <button className={"tab" + (tab === "table" ? " active" : "")} onClick={() => setTab("table")}>🏆 Tabla</button>
          <button className={"tab" + (tab === "rules" ? " active" : "")} onClick={() => setTab("rules")}>Reglas</button>
          {isAdmin && <button className={"tab" + (tab === "admin" ? " active" : "")} onClick={() => setTab("admin")}>⚙️ Admin</button>}
        </nav>

        {lockedNow && tab !== "table" && tab !== "rules" && tab !== "admin" && (
          <div className="lockbar no-print"><b>🔒 Pronósticos cerrados.</b><span>El admin cerró la quiniela completa. Revisa la <b>Tabla</b>.</span></div>
        )}
        {!lockedNow && closedScores > 0 && tab === "scores" && (
          <div className="lockbar live no-print"><b>Marcadores parcialmente cerrados.</b><span>{closedScores}/72 partidos ya no se pueden editar; el resto sigue abierto.</span></div>
        )}

        {/* GROUPS + THIRDS */}
        <section className="section print-section" style={{ display: tab === "groups" ? "block" : "none" }}>
          <div className="section-head">
            <h2>Fase de Grupos</h2>
            <p>Marca el <b>1.º</b>, <b>2.º</b> y <b>3.º</b> de cada grupo. El 1.º y 2.º clasifican directo; los 3.º compiten por ser <b>mejor tercero</b>.</p>
            <div className="prog" style={{ marginTop: 10 }}>
              <span>{groupsDone}/12 grupos</span>
              <span className="bar"><span className="fill" style={{ width: (groupsDone / 12 * 100) + "%" }}></span></span>
            </div>
          </div>
          <div className="group-grid">
            {QM.GROUPS.map((g) => (<GroupCard key={g.id} group={g} value={pred.groups[g.id]} onPick={pickGroup} locked={groupClosed(g.id)} />))}
          </div>
          <ThirdsSelector groups={pred.groups} selected={pred.thirds} onToggle={toggleThird} locked={anyGroupMatchClosed()} />
        </section>

        {/* SCORES (72) */}
        <section className="section print-section" style={{ display: tab === "scores" ? "block" : "none" }}>
          <div className="section-head">
            <h2>Marcadores · Fase de Grupos</h2>
            <p>Pronostica el <b>marcador</b> de los <b>72 partidos</b>. Acertar el resultado da puntos; el marcador exacto da más.</p>
            <div className="prog" style={{ marginTop: 10 }}>
              <span>{scoresDone}/72 partidos</span>
              <span className="bar"><span className="fill" style={{ width: (scoresDone / 72 * 100) + "%" }}></span></span>
            </div>
          </div>
          <div className="fx-grid">
            {QM.GROUPS.map((g) => (
              <GroupFixtures key={g.id} group={g} matches={QM.MATCHES.filter((m) => m.group === g.id)}
                scores={pred.scores} onChange={setScore} locked={false} isClosed={matchClosed} />
            ))}
          </div>
        </section>

        {/* KNOCKOUT */}
        <section className="section" style={{ display: tab === "ko" ? "block" : "none" }}>
          <div className="section-head">
            <h2>Camino al Título</h2>
            <p>Predice el <b>marcador</b> de cada partido. El ganador avanza automáticamente a la siguiente ronda. Los puntos se acumulan con la Fase de Grupos.</p>
          </div>
          {tab === "ko" && (
            <BracketView
              r16Pairs={(official.bracketPairs || {}).r16 || []}
              koScores={pred.koScores || {}}
              onScoreChange={phase2Open ? setBracketScore : null}
              locked={!phase2Open}
              phase2Open={phase2Open}
              isMatchClosed={koMatchClosed}
            />
          )}
        </section>

        {/* TABLE */}
        <section className="section" style={{ display: tab === "table" ? "block" : "none" }}>
          <div className="section-head">
            <h2>Tabla de Ganadores</h2>
            <p>Ranking en vivo de {groupName}. Se calcula solo con los resultados que captura el admin de este grupo.</p>
          </div>
          {tab === "table" && <Leaderboard standings={standings} hasResults={hasResults} />}
        </section>

        {/* RULES */}
        <section className="section print-section" style={{ display: tab === "rules" ? "block" : "none" }}>
          <div className="section-head">
            <h2>Reglas y Puntos</h2>
            <p>Sistema de puntuación para la porra. Gana quien sume más al final del torneo.</p>
          </div>
          <div className="rules-grid">
            <div>
              {QM.RULES.map((sec, i) => (
                <div className="panel" key={i} style={{ marginBottom: 16 }}>
                  <h3>{sec.section}</h3>
                  {sec.items.map((r, j) => (<div className="rule" key={j}><span className="pts">{r.pts}</span><span className="rl">{r.label}</span></div>))}
                </div>
              ))}
            </div>
            <div className="panel">
              <h3>Cómo jugar</h3>
              <ol className="howto">
                <li>Elige tu nombre arriba. Cada quien tiene su <b>propia quiniela</b>.</li>
                <li>En <b>Grupos</b>: marca 1.º, 2.º, 3.º y elige los 8 mejores terceros.</li>
                <li>En <b>Marcadores</b>: pronostica los 72 partidos de la fase de grupos.</li>
                <li>En <b>Camino al Título</b>: arma la eliminatoria hasta el campeón.</li>
                <li>Al arrancar el Mundial (<b>11 jun</b>) se cierran los pronósticos y la <b>Tabla</b> empieza a sumar.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ADMIN */}
        {isAdmin && (
          <section className="section" style={{ display: tab === "admin" ? "block" : "none" }}>
            {tab === "admin" && (
              <AdminPanel official={official} pickGroup={pickGroupOff} toggleThird={toggleThirdOff}
                setScore={setScoreOff} koToggle={koToggleOff} koSingle={koSingleOff} offPool={offPool}
                lockMode={lockMode} lockedNow={lockedNow} onSetLock={setLock}
                phase2Open={phase2Open} onSetPhase2={setPhase2}
                onSyncScores={syncOfficialScores}
                onClear={clearOfficial} onExit={() => { setIsAdmin(false); setTab("table"); }}
                bracketPairs={(official.bracketPairs || {}).r16 || []}
                onSetBracketPairs={(pairs) => {
                  const next = { ...official, bracketPairs: { ...(official.bracketPairs || {}), r16: pairs } };
                  setOfficial(next); QMCloud.saveOfficial(next);
                }}
                officialKoScores={official.koScores || {}}
                onSetBracketScoreOff={setBracketScoreOff}
              />
            )}
          </section>
        )}

        <footer className="foot">{QM.META.brand} · Quiniela Mundial 2026 — hecha en casa con <span className="heart">♥</span></footer>
        </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
