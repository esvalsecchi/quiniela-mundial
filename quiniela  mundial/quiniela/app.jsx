/* Quiniela Mundial 2026 — App principal (con nube, tabla y admin) */
const { useState, useEffect, useMemo } = React;
const QM = window.QM;
const ALL_CODES = Object.keys(QM.T);

function initials(name) {
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[1][0]).toUpperCase();
}
function blankBracket() { return { qf: Array(8).fill(null), sf: Array(4).fill(null), fin: Array(2).fill(null), champ: null, third: null }; }
function blankPred() { return { groups: {}, scores: {}, bracket: blankBracket() }; }
function qualifiedFrom(groups) {
  const set = [];
  QM.GROUPS.forEach((g) => {
    const v = (groups || {})[g.id] || {};
    [v.first, v.second].forEach((c) => { if (c && !set.includes(c)) set.push(c); });
  });
  return set;
}
function cleanBracket(b) {
  const qf = b.qf || Array(8).fill(null);
  const sf = (b.sf || Array(4).fill(null)).map((s, i) => ([qf[2 * i], qf[2 * i + 1]].includes(s) ? s : null));
  const fin = (b.fin || Array(2).fill(null)).map((f, i) => ([sf[2 * i], sf[2 * i + 1]].includes(f) ? f : null));
  let champ = [fin[0], fin[1]].includes(b.champ) ? b.champ : null;
  const thirdOpts = sf.filter((s) => s && !fin.includes(s));
  let third = thirdOpts.includes(b.third) ? b.third : null;
  return { qf, sf, fin, champ, third };
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

  const pred = all[pid] || blankPred();

  /* ---------- lock ---------- */
  const lockMode = config && config.locked !== undefined ? config.locked : QM.CONFIG.locked;
  const lockedNow = lockMode != null ? lockMode : (Date.now() >= Date.parse(QM.CONFIG.lockAt));

  /* ---------- mutaciones de jugador ---------- */
  function updatePlayer(mut) {
    if (lockedNow) return;
    setAll((prev) => {
      const cur = prev[pid] ? JSON.parse(JSON.stringify(prev[pid])) : blankPred();
      mut(cur);
      QMCloud.savePlayer(pid, cur);
      return { ...prev, [pid]: cur };
    });
  }
  function pickGroup(gid, slot, code) {
    updatePlayer((p) => {
      const g = p.groups[gid] || {};
      if (g[slot] === code) delete g[slot];
      else { g[slot] = code; const other = slot === "first" ? "second" : "first"; if (g[other] === code) delete g[other]; }
      p.groups[gid] = g;
    });
  }
  function setScore(mid, k, val) {
    updatePlayer((p) => { p.scores[mid] = p.scores[mid] || {}; p.scores[mid][k] = val; });
  }
  function setBracket(round, index, value) {
    updatePlayer((p) => {
      const b = { qf: [...(p.bracket.qf || Array(8).fill(null))], sf: [...(p.bracket.sf || Array(4).fill(null))], fin: [...(p.bracket.fin || Array(2).fill(null))], champ: p.bracket.champ, third: p.bracket.third };
      if (round === "champ") b.champ = value; else if (round === "third") b.third = value; else b[round][index] = value;
      p.bracket = cleanBracket(b);
    });
  }
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
      const cur = JSON.parse(JSON.stringify(prev || {}));
      cur.groups = cur.groups || {}; cur.scores = cur.scores || {}; cur.bracket = cur.bracket || blankBracket();
      mut(cur);
      QMCloud.saveOfficial(cur);
      return cur;
    });
  }
  function pickGroupOff(gid, slot, code) {
    updateOfficial((p) => {
      const g = p.groups[gid] || {};
      if (g[slot] === code) delete g[slot];
      else { g[slot] = code; const other = slot === "first" ? "second" : "first"; if (g[other] === code) delete g[other]; }
      p.groups[gid] = g;
    });
  }
  function setScoreOff(mid, k, val) {
    updateOfficial((p) => { p.scores[mid] = p.scores[mid] || {}; p.scores[mid][k] = val; });
  }
  function setBracketOff(round, index, value) {
    updateOfficial((p) => {
      const b = { qf: [...(p.bracket.qf || Array(8).fill(null))], sf: [...(p.bracket.sf || Array(4).fill(null))], fin: [...(p.bracket.fin || Array(2).fill(null))], champ: p.bracket.champ, third: p.bracket.third };
      if (round === "champ") b.champ = value; else if (round === "third") b.third = value; else b[round][index] = value;
      p.bracket = cleanBracket(b);
    });
  }
  function clearOfficial() {
    if (!confirm("¿Borrar TODOS los resultados oficiales? La tabla volverá a cero.")) return;
    const blank = { groups: {}, scores: {}, bracket: blankBracket() };
    setOfficial(blank); QMCloud.saveOfficial(blank);
  }
  function setLock(val) { const next = { ...config, locked: val }; setConfig(next); QMCloud.saveConfig(next); }

  function loginAdmin() {
    const pin = prompt("PIN de administrador:");
    if (pin == null) return;
    const real = (window.QM_FIREBASE && window.QM_FIREBASE.ADMIN_PIN) || "hogar2026";
    if (pin === real) { setIsAdmin(true); setTab("admin"); }
    else alert("PIN incorrecto.");
  }

  /* ---------- derivados ---------- */
  const qualified = useMemo(() => qualifiedFrom(pred.groups), [pred.groups]);
  const pool = qualified.length >= 8 ? qualified : ALL_CODES;
  const offQualified = useMemo(() => qualifiedFrom(official.groups), [official.groups]);
  const offPool = offQualified.length >= 8 ? offQualified : ALL_CODES;

  const groupsDone = QM.GROUPS.filter((g) => { const v = pred.groups[g.id] || {}; return v.first && v.second; }).length;
  const scoresDone = QM.KEY_MATCHES.filter((m) => { const v = (pred.scores || {})[m.id] || {}; return v.h !== undefined && v.h !== "" && v.a !== undefined && v.a !== ""; }).length;

  const standings = useMemo(() => QMScore.standings(all, official), [all, official]);
  const hasResults = QMScore.hasOfficialResults(official);
  const playerHasChamp = (id) => { const p = all[id]; return !!(p && p.bracket && p.bracket.champ); };
  const curPlayer = QM.PLAYERS.find((x) => x.id === pid);

  return (
    <React.Fragment>
      <div className="colorbar">
        {QM.GROUPS.map((g) => <span key={g.id} style={{ background: g.color }}></span>)}
      </div>

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
            <span><b>48</b> selecciones</span>
            <span><b>12</b> grupos</span>
            <span>{QM.META.sub}</span>
          </div>
          <div className="print-only print-name" style={{ display: "none", marginTop: 14, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20 }}>
            Quiniela de: {curPlayer.name}
          </div>
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
              : <button className="btn" title="Capturar resultados" onClick={loginAdmin}>🔐 Admin</button>}
          </div>
        </div>
      </div>

      <div className="wrap">
        <nav className="tabs no-print">
          <button className={"tab" + (tab === "groups" ? " active" : "")} onClick={() => setTab("groups")}>Fase de Grupos <span className="tnum">{groupsDone}/12</span></button>
          <button className={"tab" + (tab === "scores" ? " active" : "")} onClick={() => setTab("scores")}>Marcadores <span className="tnum">{scoresDone}/8</span></button>
          <button className={"tab" + (tab === "bracket" ? " active" : "")} onClick={() => setTab("bracket")}>Camino al Título <span className="tnum">{pred.bracket.champ ? "🏆" : "—"}</span></button>
          <button className={"tab" + (tab === "table" ? " active" : "")} onClick={() => setTab("table")}>🏆 Tabla</button>
          <button className={"tab" + (tab === "rules" ? " active" : "")} onClick={() => setTab("rules")}>Reglas</button>
          {isAdmin && <button className={"tab" + (tab === "admin" ? " active" : "")} onClick={() => setTab("admin")}>⚙️ Admin</button>}
        </nav>

        {lockedNow && tab !== "table" && tab !== "rules" && tab !== "admin" && (
          <div className="lockbar no-print"><b>🔒 Pronósticos cerrados.</b><span>Ya arrancó el Mundial — tus picks quedaron registrados. Revisa la <b>Tabla</b> para ver cómo vas.</span></div>
        )}

        {/* GROUPS */}
        <section className="section print-section" style={{ display: tab === "groups" ? "block" : "none" }}>
          <div className="section-head">
            <h2>Fase de Grupos</h2>
            <p>Marca quién termina <b>1.º</b> (gana el grupo) y <b>2.º</b> en cada grupo. Esos son los que clasifican a la eliminatoria.</p>
            <div className="prog" style={{ marginTop: 10 }}>
              <span>{groupsDone}/12 grupos</span>
              <span className="bar"><span className="fill" style={{ width: (groupsDone / 12 * 100) + "%" }}></span></span>
            </div>
          </div>
          <div className="group-grid">
            {QM.GROUPS.map((g) => (<GroupCard key={g.id} group={g} value={pred.groups[g.id]} onPick={pickGroup} locked={lockedNow} />))}
          </div>
        </section>

        {/* SCORES */}
        <section className="section print-section" style={{ display: tab === "scores" ? "block" : "none" }}>
          <div className="section-head">
            <h2>Marcadores Estelares</h2>
            <p>Pronostica el <b>marcador exacto</b> de los partidos más jugosos de la fase de grupos.</p>
            <div className="prog" style={{ marginTop: 10 }}>
              <span>{scoresDone}/8 marcadores</span>
              <span className="bar"><span className="fill" style={{ width: (scoresDone / 8 * 100) + "%" }}></span></span>
            </div>
          </div>
          <div className="score-grid">
            {QM.KEY_MATCHES.map((m) => (<MatchScore key={m.id} match={m} value={(pred.scores || {})[m.id]} onChange={setScore} locked={lockedNow} />))}
          </div>
        </section>

        {/* BRACKET */}
        <section className="section print-section" style={{ display: tab === "bracket" ? "block" : "none" }}>
          <div className="section-head">
            <h2>Camino al Título</h2>
            <p>Arma tu bracket: elige los 8 de cuartos, avanza a semifinales, la final y corona a tu <b>Campeón del Mundo</b>.</p>
          </div>
          <div className="bhint no-print">💡 Las opciones de <b>Cuartos</b> salen de los equipos que marcaste como clasificados en la Fase de Grupos{qualified.length < 8 ? " (completa más grupos para afinar la lista)." : "."} Cada ronda se desbloquea con la anterior.</div>
          <Bracket pool={pool} bracket={pred.bracket} onSet={setBracket} locked={lockedNow} />
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
            <p>Sistema de puntuación para la porra del Grupo Hogar. Gana quien sume más al final del torneo.</p>
          </div>
          <div className="rules-grid">
            <div className="panel">
              <h3>Tabla de puntos</h3>
              {QM.RULES.map((r, i) => (<div className="rule" key={i}><span className="pts">{r.pts}</span><span className="rl">{r.label}</span></div>))}
            </div>
            <div className="panel">
              <h3>Cómo jugar</h3>
              <ol className="howto">
                <li>Elige tu nombre arriba. Cada quien tiene su <b>propia quiniela</b>.</li>
                <li>Llena los <b>grupos</b>, los <b>marcadores</b> y el <b>bracket</b> antes del primer partido (<b>11 jun</b>).</li>
                <li>Al arrancar el Mundial los pronósticos <b>se cierran</b> y la <b>Tabla</b> empieza a sumar.</li>
                <li>{QM.META.finalInfo}.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ADMIN */}
        {isAdmin && (
          <section className="section" style={{ display: tab === "admin" ? "block" : "none" }}>
            {tab === "admin" && (
              <AdminPanel official={official} pickGroup={pickGroupOff} setScore={setScoreOff} setBracket={setBracketOff}
                pool={offPool} lockMode={lockMode} lockedNow={lockedNow} onSetLock={setLock}
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
