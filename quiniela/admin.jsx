/* Quiniela Mundial 2026 — Panel de Administrador
   Captura los resultados REALES; alimenta la tabla de ganadores. */

/* ────────────────────────────────────────────────────────────────
   BracketPairsSetup — admin configura los 16 cruces del R16
   ──────────────────────────────────────────────────────────────── */
function BracketPairsSetup({ bracketPairs, onSetBracketPairs }) {
  const QM = window.QM;
  // Lista ordenada de los 32 equipos (por nombre)
  const ALL_TEAMS = Object.keys(QM.T).sort(function(a, b) {
    return QM.T[a].name.localeCompare(QM.T[b].name);
  });

  // Obtener pares actuales, asegurar 16 slots
  const pairs = [];
  for (var i = 0; i < 16; i++) {
    pairs.push((bracketPairs && bracketPairs[i]) ? bracketPairs[i] : { home: '', away: '' });
  }

  function setTeam(matchIdx, side, code) {
    if (!onSetBracketPairs) return;
    const next = pairs.map(function(p) { return { home: p.home || '', away: p.away || '' }; });
    next[matchIdx][side] = code;
    onSetBracketPairs(next);
  }

  // Calcular qué equipos ya están usados en otros slots (para evitar duplicados)
  function usedTeams(excludeMatchIdx, excludeSide) {
    const used = [];
    pairs.forEach(function(p, idx) {
      if (idx !== excludeMatchIdx || 'home' !== excludeSide) {
        if (p.home) used.push(p.home);
      }
      if (idx !== excludeMatchIdx || 'away' !== excludeSide) {
        if (p.away) used.push(p.away);
      }
    });
    return used;
  }

  return (
    <div>
      <div className="section-head">
        <h3>Cruces del Dieciseisavos (R16)</h3>
        <p>Define qué equipo juega contra cuál en los <b>16 partidos</b> de Dieciseisavos. Los equipos seleccionados aquí serán los que aparezcan en el bracket de la Fase 2.</p>
      </div>
      <div className="bp-grid">
        {pairs.map(function(pair, i) {
          const usedH = usedTeams(i, 'home');
          const usedA = usedTeams(i, 'away');
          return (
            <div key={i} className="bp-row">
              <span className="bp-num">P{i + 1}</span>
              <select
                className="bp-sel"
                value={pair.home || ''}
                onChange={function(e) { setTeam(i, 'home', e.target.value); }}
              >
                <option value="">— Local —</option>
                {ALL_TEAMS.map(function(code) {
                  const t = QM.T[code];
                  const disabled = usedH.includes(code) && code !== pair.home;
                  return (
                    <option key={code} value={code} disabled={disabled}>
                      {t.flag} {t.name}
                    </option>
                  );
                })}
              </select>
              <span className="bp-vs">VS</span>
              <select
                className="bp-sel"
                value={pair.away || ''}
                onChange={function(e) { setTeam(i, 'away', e.target.value); }}
              >
                <option value="">— Visitante —</option>
                {ALL_TEAMS.map(function(code) {
                  const t = QM.T[code];
                  const disabled = usedA.includes(code) && code !== pair.away;
                  return (
                    <option key={code} value={code} disabled={disabled}>
                      {t.flag} {t.name}
                    </option>
                  );
                })}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminPanel(props) {
  const { official, pickGroup, toggleThird, setScore, koToggle, koSingle, offPool,
          lockMode, lockedNow, onSetLock, phase2Open, onSetPhase2, onSyncScores, onClear, onExit,
          bracketPairs, onSetBracketPairs, officialKoScores, onSetBracketScoreOff } = props;
  const { useState } = React;
  const [sub, setSub] = useState("scores");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  async function syncFromAPI() {
    if (!window.QMAPI || !onSyncScores) return;
    setSyncing(true); setSyncMsg("");
    try {
      const fixtures = await window.QMAPI.fetchGroupFixtures();
      const scores = window.QMAPI.parseScores(fixtures);
      const count = Object.keys(scores).length;
      if (!count) { setSyncMsg("⏳ Aún no hay partidos terminados."); setSyncing(false); return; }
      onSyncScores(scores);
      setSyncMsg("✅ " + count + " partidos sincronizados.");
    } catch (e) {
      setSyncMsg("❌ " + e.message);
    }
    setSyncing(false);
  }

  async function testAPI() {
    if (!window.QMAPI) return;
    setSyncMsg("⏳ Probando clave...");
    const r = await window.QMAPI.testKey();
    setSyncMsg(r.ok ? "✅ " + r.msg : "❌ " + r.msg);
  }
  const QM = window.QM;

  const lockOpts = [
    { v: null, label: "Automático" },
    { v: false, label: "Abierto" },
    { v: true, label: "Cerrado" },
  ];

  return (
    <div>
      <div className="admin-banner">
        <span className="ab-k">Modo admin</span>
        <span style={{ fontSize: 13.5 }}>Captura aquí los <b>resultados reales</b>. La tabla se recalcula sola.</span>
        <button className="btn" onClick={onExit}>Salir de admin</button>
      </div>

      <div className={"lockbar" + (lockedNow ? "" : " live")}>
        <b>Pronósticos Fase de Grupos:</b>
        <span>{lockedNow ? "🔒 Cerrados por admin" : "🟢 Abiertos para partidos pendientes (cierre 2h antes)"}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
          {lockOpts.map((o) => (
            <button key={String(o.v)} className={"btn" + (lockMode === o.v ? " solid" : "")} onClick={() => onSetLock(o.v)}>{o.label}</button>
          ))}
        </span>
      </div>

      {onSetPhase2 && (
        <div className={"lockbar" + (phase2Open ? " live" : "")}>
          <b>Fase 2 — Eliminatoria:</b>
          <span>{phase2Open ? "🟢 Pronósticos abiertos" : "🔒 Cerrada"}</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
            <button className={"btn" + (!phase2Open ? " solid" : "")} onClick={() => onSetPhase2(false)}>Cerrar</button>
            <button className={"btn" + (phase2Open ? " solid" : "")} onClick={() => onSetPhase2(true)}>Abrir Fase 2</button>
          </span>
        </div>
      )}

      <nav className="tabs" style={{ marginTop: 0 }}>
        <button className={"tab" + (sub === "groups" ? " active" : "")} onClick={() => setSub("groups")}>Grupos reales</button>
        <button className={"tab" + (sub === "thirds" ? " active" : "")} onClick={() => setSub("thirds")}>Mejores terceros</button>
        <button className={"tab" + (sub === "scores" ? " active" : "")} onClick={() => setSub("scores")}>Marcadores reales</button>
        <button className={"tab" + (sub === "ko" ? " active" : "")} onClick={() => setSub("ko")}>Eliminatoria real</button>
        <button className={"tab" + (sub === "bracketPairs" ? " active" : "")} onClick={() => setSub("bracketPairs")}>Bracket R16</button>
        <button className={"tab" + (sub === "bracketOff" ? " active" : "")} onClick={() => setSub("bracketOff")}>Bracket oficial</button>
      </nav>

      {sub === "groups" && (
        <div>
          <div className="section-head"><p>Marca el <b>1.º, 2.º y 3.º real</b> de cada grupo.</p></div>
          <div className="group-grid">
            {QM.GROUPS.map((g) => (<GroupCard key={g.id} group={g} value={(official.groups || {})[g.id]} onPick={pickGroup} />))}
          </div>
        </div>
      )}

      {sub === "thirds" && (
        <div>
          <div className="section-head"><p>Marca los <b>8 terceros que realmente clasificaron</b>.</p></div>
          <ThirdsSelector groups={official.groups || {}} selected={official.thirds || []} onToggle={toggleThird} />
        </div>
      )}

      {sub === "scores" && (
        <div>
          <div className="section-head" style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <p style={{ margin: 0, flex: 1 }}>Captura el <b>marcador final real</b> de cada partido de grupos, o sincroniza directo desde la API.</p>
            {window.QMAPI && (
              <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "flex-end" }}>
                <div style={{ display: "flex", gap: 7 }}>
                  <button className="btn" onClick={testAPI} disabled={syncing}>🔑 Probar clave</button>
                  <button className={"btn solid" + (!window.QMAPI.hasKey() ? " dis" : "")} onClick={syncFromAPI} disabled={syncing || !window.QMAPI.hasKey()}>
                    {syncing ? "⏳ Sincronizando..." : "🔄 Sync desde API"}
                  </button>
                </div>
                {!window.QMAPI.hasKey() && <span style={{ fontSize: 11, color: "var(--ink-faint)" }}>Configura QM_API.KEY en firebase-config.js</span>}
                {syncMsg && <span style={{ fontSize: 12, color: syncMsg.startsWith("✅") ? "var(--brand-ink)" : syncMsg.startsWith("❌") ? "#c00" : "var(--ink-faint)" }}>{syncMsg}</span>}
              </div>
            )}
          </div>
          <div className="fx-grid">
            {QM.GROUPS.map((g) => (
              <GroupFixtures key={g.id} group={g} matches={QM.MATCHES.filter((m) => m.group === g.id)}
                scores={official.scores || {}} onChange={setScore} />
            ))}
          </div>
        </div>
      )}

      {sub === "ko" && (
        <div>
          <div className="section-head"><p>Arma la eliminatoria <b>real</b>: quién avanzó en cada ronda, campeón y 3.er lugar.</p></div>
          <KnockoutFlow pool={offPool} ko={official.ko || {}} onToggle={koToggle} onSetSingle={koSingle} />
        </div>
      )}

      {sub === "bracketPairs" && (
        <BracketPairsSetup
          bracketPairs={bracketPairs || []}
          onSetBracketPairs={onSetBracketPairs}
        />
      )}

      {sub === "bracketOff" && (
        <div>
          <div className="section-head">
            <h3>Bracket oficial — marcadores reales</h3>
            <p>Ingresa los marcadores reales de cada partido de la eliminatoria.</p>
          </div>
          <BracketView
            r16Pairs={bracketPairs || []}
            koScores={officialKoScores || {}}
            onScoreChange={onSetBracketScoreOff}
            locked={false}
          />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button className="btn" onClick={onClear}>Borrar todos los resultados</button>
      </div>
    </div>
  );
}

Object.assign(window, { AdminPanel });
