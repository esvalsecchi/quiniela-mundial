/* Quiniela Mundial 2026 — Tabla de Ganadores */
function Leaderboard({ standings, hasResults }) {
  const initials = (name) => {
    const p = name.trim().split(/\s+/);
    return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[1][0]).toUpperCase();
  };
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };

  if (!hasResults) {
    return (
      <div className="lb-empty">
        <div className="big">La tabla se enciende con los resultados ⚽</div>
        <div>Aún no hay resultados oficiales cargados. Cuando el <b>admin</b> empiece a capturar lo que pasa en el Mundial, aquí aparece el ranking en vivo de los 10, calculado solo según las reglas de puntos.</div>
      </div>
    );
  }

  const leader = standings.find((r) => r.played) || standings[0];

  return (
    <div>
      <div className="lb-leadcard">
        <span className="crown">👑</span>
        <div>
          <div className="ll-k">Va liderando</div>
          <div className="ll-n">{leader.player.name}</div>
        </div>
        <div className="ll-p"><div className="n">{leader.score.total}</div><div className="ll-k">puntos</div></div>
      </div>

      <div className="lb-list">
        {standings.map((r) => {
          const s = r.score;
          return (
            <div className={"lb-row r" + r.rank + (r.played ? "" : " muted")} key={r.player.id}>
              <div className="rank">{medals[r.rank] ? <span className="medal">{medals[r.rank]}</span> : r.rank}</div>
              <div className="lb-av" style={{ background: r.player.color }}>{initials(r.player.name)}</div>
              <div>
                <div className="lb-name">{r.player.name}</div>
                <div className="lb-sub">
                  <span>Grupos <b>{s.grupos}</b></span>
                  <span>Marcadores <b>{s.scores}</b></span>
                  <span>Eliminatoria <b>{s.elim}</b></span>
                  <span>Campeón <b>{s.champ}</b></span>
                  {s.third ? <span>3.º <b>{s.third}</b></span> : null}
                  {!r.played ? <span>· sin pronósticos</span> : null}
                </div>
              </div>
              <div className="lb-total"><div className="n">{s.total}</div><div className="u">pts</div></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Leaderboard });
