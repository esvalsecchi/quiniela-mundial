/* Quiniela Mundial 2026 — Panel de Administrador
   Captura los resultados REALES; alimenta la tabla de ganadores. */
function AdminPanel(props) {
  const { official, pickGroup, toggleThird, setScore, koToggle, koSingle, offPool,
          lockMode, lockedNow, onSetLock, onClear, onExit } = props;
  const { useState } = React;
  const [sub, setSub] = useState("groups");
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
        <b>Pronósticos:</b>
        <span>{lockedNow ? "🔒 Cerrados" : "🟢 Abiertos"}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6 }}>
          {lockOpts.map((o) => (
            <button key={String(o.v)} className={"btn" + (lockMode === o.v ? " solid" : "")} onClick={() => onSetLock(o.v)}>{o.label}</button>
          ))}
        </span>
      </div>

      <nav className="tabs" style={{ marginTop: 0 }}>
        <button className={"tab" + (sub === "groups" ? " active" : "")} onClick={() => setSub("groups")}>Grupos reales</button>
        <button className={"tab" + (sub === "thirds" ? " active" : "")} onClick={() => setSub("thirds")}>Mejores terceros</button>
        <button className={"tab" + (sub === "scores" ? " active" : "")} onClick={() => setSub("scores")}>Marcadores reales</button>
        <button className={"tab" + (sub === "ko" ? " active" : "")} onClick={() => setSub("ko")}>Eliminatoria real</button>
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
          <div className="section-head"><p>Captura el <b>marcador final real</b> de cada partido de grupos.</p></div>
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

      <div style={{ marginTop: 24 }}>
        <button className="btn" onClick={onClear}>Borrar todos los resultados</button>
      </div>
    </div>
  );
}

Object.assign(window, { AdminPanel });
