/* Quiniela Mundial 2026 — Panel de Administrador
   Captura los resultados REALES; alimenta la tabla de ganadores. */
function AdminPanel(props) {
  const { official, pickGroup, setScore, setBracket, pool, lockMode, lockedNow, onSetLock, onClear, onExit } = props;
  const { useState } = React;
  const [sub, setSub] = useState("groups");

  const lockOpts = [
    { v: null, label: "Automático" },
    { v: false, label: "Abierto" },
    { v: true, label: "Cerrado" },
  ];

  return (
    <div>
      <div className="admin-banner">
        <span className="ab-k">Modo admin</span>
        <span style={{ fontSize: 13.5 }}>Captura aquí los <b>resultados reales</b>. La tabla de ganadores se recalcula sola.</span>
        <button className="btn" onClick={onExit}>Salir de admin</button>
      </div>

      {/* control de bloqueo */}
      <div className={"lockbar" + (lockedNow ? "" : " live")}>
        <b>Pronósticos:</b>
        <span>{lockedNow ? "🔒 Cerrados (nadie puede editar sus picks)" : "🟢 Abiertos (los jugadores pueden editar)"}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
          {lockOpts.map((o) => (
            <button key={String(o.v)} className={"btn" + (lockMode === o.v ? " solid" : "")}
              onClick={() => onSetLock(o.v)}>{o.label}</button>
          ))}
        </span>
      </div>

      {/* sub-navegación */}
      <nav className="tabs" style={{ marginTop: 0 }}>
        <button className={"tab" + (sub === "groups" ? " active" : "")} onClick={() => setSub("groups")}>Grupos reales</button>
        <button className={"tab" + (sub === "scores" ? " active" : "")} onClick={() => setSub("scores")}>Marcadores reales</button>
        <button className={"tab" + (sub === "bracket" ? " active" : "")} onClick={() => setSub("bracket")}>Eliminatoria real</button>
      </nav>

      {sub === "groups" && (
        <div>
          <div className="section-head"><p>Marca quién <b>realmente</b> terminó 1.º y 2.º en cada grupo.</p></div>
          <div className="group-grid">
            {window.QM.GROUPS.map((g) => (
              <GroupCard key={g.id} group={g} value={(official.groups || {})[g.id]} onPick={pickGroup} />
            ))}
          </div>
        </div>
      )}

      {sub === "scores" && (
        <div>
          <div className="section-head"><p>Captura el <b>marcador final real</b> de los partidos estelares.</p></div>
          <div className="score-grid">
            {window.QM.KEY_MATCHES.map((m) => (
              <MatchScore key={m.id} match={m} value={(official.scores || {})[m.id]} onChange={setScore} />
            ))}
          </div>
        </div>
      )}

      {sub === "bracket" && (
        <div>
          <div className="section-head"><p>Arma la eliminatoria <b>real</b>: cuartos, semifinales, final, campeón y 3.er lugar.</p></div>
          <Bracket pool={pool} bracket={official.bracket || { qf: [], sf: [], fin: [] }} onSet={setBracket} />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button className="btn" onClick={onClear}>Borrar todos los resultados</button>
      </div>
    </div>
  );
}

Object.assign(window, { AdminPanel });
