/* Quiniela Mundial 2026 — App principal (formato real 2026) */
const { useState, useEffect, useMemo } = React;
const QM = window.QM;
const ALL_CODES = Object.keys(QM.T);
const CAPS = QM.KO_CAPS;

function initials(name) {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[1][0]).toUpperCase();
}
function blankKO() { return { r16: [], qf: [], sf: [], fin: [], champ: null, third: null }; }
function blankPred() { return { groups: {}, thirds: [], scores: {}, ko: blankKO() }; }
function withDefaults(p) {
  p = p || {};
  return {
    groups: p.groups || {},
    thirds: p.thirds || [],
    scores: p.scores || {},
    ko: Object.assign(blankKO(), p.ko || {}),
  };
}
function dedup(a) { return a.filter((x, i) => x && a.indexOf(x) === i); }

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

function App() {
  const [all, setAll] = useState({});
  const [official, setOfficial] = useState({});
  const [config, setConfig] = useState({});
  const [pid, setPid] = useState(QM.PLAYERS[0].id);
  const [tab, setTab] = useState("groups");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    QMCloud.init();
    const unsub = QMCloud.subscribe({
      onPlayers: (p) => setAll(p || {}),
      onOfficial: (o) => setOfficial(o || {}),
      onConfig: (c) => setConfig(c || {}),
    });
    return () => { if (unsub) unsub(); };
  }, []);

  const pred = withDefaults(all[pid]);
  const lockMode = config && config.locked !== undefined ? config.locked : QM.CONFIG.locked;
  const lockedNow = lockMode != null ? lockMode : (Date.now() >= Date.parse(QM.CONFIG.lockAt));
  const phase2Open = !!(config && config.phase2Open);

  // Auto-fill group positions when scores are already complete (e.g. data loaded from Firebase)
  const predScoresKey = useMemo(() => JSON.stringify(pred.scores), [pred.scores]);
  useEffect(() => {
    const scores = pred.scores || {};
    const groups = pred.groups || {};
    const updates = {};
    QM.GROUPS.forEach((g) => {
      const standings = QMScore.calcGroupStandings(g.id, scores);
      if (!standings) return;
      const cur = groups[g.id] || {};
      if (cur.first !== standings.first || cur.second !== standings.second || cur.third !== standings.third) {
        updates[g.id] = standings;
      }
    });
    if (!Object.keys(updates).length) return;
    setAll((prev) => {
      const cur = JSON.parse(JSON.stringify(withDefaults(prev[pid])));
      cur.groups = { ...cur.groups, ...updates };
      normalize(cur);
      QMCloud.savePlayer(pid, cur);
      return { ...prev, [pid]: cur };
    });
  }, [pid, predScoresKey]);

  /* ---------- mutaciones de jugador ---------- */
  function updatePlayer(mut) {
    if (lockedNow) return;
    setAll((prev) => {
      const cur = JSON.parse(JSON.stringify(withDefaults(prev[pid])));
      mut(cur); normalize(cur);
      QMCloud.savePlayer(pid, cur);
      return { ...prev, [pid]: cur };
    });
  }
  const pickGroup = (gid, slot, code) => updatePlayer((p) => {
    const g = p.groups[gid] || {};
    if (g[slot] === code) delete g[slot];
    else { ["first", "second", "third"].forEach((s) => { if (g[s] === code) delete g[s]; }); g[slot] = code; }
    p.groups[gid] = g;
  });
  const toggleThird = (code) => updatePlayer((p) => { p.thirds = toggleInSet(p.thirds, code, 8); });
  const setScore = (mid, k, val) => updatePlayer((p) => {
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
    if (!phase2Open) return;
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

  function resetPlayer() {
    if (lockedNow) { alert("Los pronósticos están cerrados."); return; }
    if (!confirm(`¿Borrar los pronósticos de ${QM.PLAYERS.find((x) => x.id === pid).name}?`)) return;
    const blank = blankPred();
    setAll((prev) => ({ ...prev, [pid]: blank }));
    QMCloud.savePlayer(pid, blank);
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

  const standings = useMemo(() => QMScore.standings(all, official), [all, official]);
  const hasResults = QMScore.hasOfficialResults(official);
  const playerHasChamp = (id) => { const p = all[id]; return !!(p && p.ko && p.ko.champ); };
  const curPlayer = QM.PLAYERS.find((x) => x.id === pid);

  return (
    <React.Fragment>
      <div className="colorbar">{QM.GROUPS.map((g) => <span key={g.id} style={{ background: g.color }}></span>)}</div>

      <header className="masthead">
        <div className="wrap">
          <div className="mast-top">
            <span className="brand-badge">{QM.META.brand}</span>
            <span className="brand-sub">Porra familiar · Edición 2026</span>
            <span style={{ marginLeft: "auto" }} className={"cloud-pill no-print " + (QMCloud.enabled ? "on" : "off")}>
              <span className="dot"></span>{QMCloud.enabled ? "En la nube" : "Este dispositivo"}
            </span>
          </div>
          <h1 className="mast-title">Quiniela<br /><em>Mundial</em> 2026</h1>
          <div className="mast-meta">
            <span><b>48</b> selecciones</span><span><b>12</b> grupos</span><span>{QM.META.sub}</span>
          </div>
          <div className="print-only print-name" style={{ display: "none", marginTop: 14, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>Quiniela de: {curPlayer.name}</div>
        </div>
      </header>

      <div className="playerbar no-print">
        <div className="wrap">
          <span className="pb-label">Jugador</span>
          <div className="players">
            {QM.PLAYERS.map((pl) => (
              <button key={pl.id} className={"chip" + (pl.id === pid ? " active" : "")} onClick={() => setPid(pl.id)}>
                <span className="av" style={{ background: pl.color }}>{initials(pl.name)}</span>
                {pl.name}
                {playerHasChamp(pl.id) && <span className="done-dot" title="Campeón elegido"></span>}
              </button>
            ))}
          </div>
          <div className="pb-actions">
            <button className="btn" onClick={resetPlayer}>Borrar</button>
            <button className="btn" onClick={() => window.print()}>Imprimir</button>
            {isAdmin
              ? <button className="btn solid" onClick={() => { setIsAdmin(false); if (tab === "admin") setTab("table"); }}>Salir admin</button>
              : <button className="btn" onClick={loginAdmin}>🔐 Admin</button>}
          </div>
        </div>
      </div>

      <div className="wrap">
        <nav className="tabs no-print">
          <button className={"tab" + (tab === "groups" ? " active" : "")} onClick={() => setTab("groups")}>Fase de Grupos <span className="tnum">{groupsDone}/12</span></button>
          <button className={"tab" + (tab === "scores" ? " active" : "")} onClick={() => setTab("scores")}>Marcadores <span className="tnum">{scoresDone}/72</span></button>
          <button className={"tab" + (tab === "ko" ? " active" : "")} onClick={() => setTab("ko")}>Camino al Título <span className="tnum">{pred.ko.champ ? "🏆" : "—"}</span></button>
          <button className={"tab" + (tab === "table" ? " active" : "")} onClick={() => setTab("table")}>🏆 Tabla</button>
          <button className={"tab" + (tab === "rules" ? " active" : "")} onClick={() => setTab("rules")}>Reglas</button>
          {isAdmin && <button className={"tab" + (tab === "admin" ? " active" : "")} onClick={() => setTab("admin")}>⚙️ Admin</button>}
        </nav>

        {lockedNow && tab !== "table" && tab !== "rules" && tab !== "admin" && (
          <div className="lockbar no-print"><b>🔒 Pronósticos cerrados.</b><span>Ya arrancó el Mundial — tus picks quedaron registrados. Revisa la <b>Tabla</b>.</span></div>
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
            {QM.GROUPS.map((g) => (<GroupCard key={g.id} group={g} value={pred.groups[g.id]} onPick={pickGroup} locked={lockedNow} />))}
          </div>
          <ThirdsSelector groups={pred.groups} selected={pred.thirds} onToggle={toggleThird} locked={lockedNow} />
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
                scores={pred.scores} onChange={setScore} locked={lockedNow} />
            ))}
          </div>
        </section>

        {/* KNOCKOUT */}
        <section className="section print-section" style={{ display: tab === "ko" ? "block" : "none" }}>
          <div className="section-head">
            <h2>{phase2Open ? "Fase 1 — Pronóstico pre-torneo" : "Camino al Título"}</h2>
            <p>Avanza a los 32 clasificados por las rondas: <b>Dieciseisavos → Octavos → Cuartos → Semifinales → Final</b>. Toca un equipo para pasarlo a la siguiente ronda.</p>
          </div>
          <KnockoutFlow pool={pool} ko={pred.ko} onToggle={koToggle} onSetSingle={koSingle} locked={lockedNow} />

          {phase2Open && (
            <div style={{ marginTop: 32 }}>
              <div className="section-head">
                <h2>Fase 2 — Eliminatoria real 🏆</h2>
                <p>Los <b>32 equipos que realmente clasificaron</b>. Arma tu bracket de nuevo — los puntos se suman a los de la Fase 1.</p>
              </div>
              {offPool.length < 32 && (
                <div className="bhint">⏳ Esperando que el admin termine de cargar los clasificados reales. Llevan <b>{offPool.length}/32</b>.</div>
              )}
              <KnockoutFlow pool={offPool} ko={pred.ko2 || blankKO()} onToggle={ko2Toggle} onSetSingle={ko2Single} locked={false} />
            </div>
          )}
        </section>

        {/* TABLE */}
        <section className="section" style={{ display: tab === "table" ? "block" : "none" }}>
          <div className="section-head">
            <h2>Tabla de Ganadores</h2>
            <p>Ranking en vivo de la porra del Grupo Hogar. Se calcula solo con los resultados que captura el admin.</p>
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
                onClear={clearOfficial} onExit={() => { setIsAdmin(false); setTab("table"); }} />
            )}
          </section>
        )}

        <footer className="foot">{QM.META.brand} · Quiniela Mundial 2026 — hecha en casa con <span className="heart">♥</span></footer>
      </div>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
