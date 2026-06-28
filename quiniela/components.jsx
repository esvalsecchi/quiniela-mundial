/* Quiniela Mundial 2026 — componentes de grupos y marcadores */
const T = window.QM.T;

/* -------------------------------------------------- GroupCard (1.º/2.º/3.º) */
function GroupCard({ group, value, onPick, locked }) {
  const v = value || {};
  const done = v.first && v.second && v.third;
  const slots = [
    { key: "first", lbl: "1º", cls: "on1" },
    { key: "second", lbl: "2º", cls: "on2" },
    { key: "third", lbl: "3º", cls: "on3" },
  ];
  return (
    <div className={"gcard" + (locked ? " is-locked" : "")} style={{ "--gc": group.color }}>
      <div className="gcard-head">
        <div className="gletter">{group.id}</div>
        <div>
          <div className="gt">Grupo {group.id}</div>
          <div className="gsub">1.º y 2.º pasan · el 3.º compite por mejor tercero</div>
        </div>
        <div className={"gstat" + (done ? " ok" : "")}>{done ? "✓ Listo" : `${[v.first, v.second, v.third].filter(Boolean).length}/3`}</div>
      </div>
      {group.teams.map((code) => {
        const t = T[code];
        const here = v.first === code ? "q1" : v.second === code ? "q2" : v.third === code ? "q3" : "";
        return (
          <div className={"trow" + (here ? " " + here : "")} key={code}>
            <span className="barflag"></span>
            <span className="flag">{t.flag}</span>
            <span className="tname">{t.name} <span className="tcode">{t.code}</span></span>
            <span className="picks">
              {slots.map((s) => {
                const on = v[s.key] === code;
                return (
                  <span key={s.key}
                    className={"pos" + (on ? " " + s.cls : "") + (locked ? " dis" : "")}
                    onClick={() => !locked && onPick(group.id, s.key, code)}>{s.lbl}</span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------- MatchRow (compacto, para los 72) */
function MatchRow({ match, value, officialValue, onChange, locked, isClosed }) {
  const v = value || {};
  const closed = !!(locked || (isClosed && isClosed(match.id)));
  const h = v.h, a = v.a;
  const hasOfficial = QMScore.hasScore(officialValue);
  const matchPoints = hasOfficial ? QMScore.scoreMatch(v, officialValue) : 0;
  const set = (k, val) => {
    if (closed) return;
    if (val === "") return onChange(match.id, k, "");
    onChange(match.id, k, Math.max(0, Math.min(19, parseInt(val, 10) || 0)));
  };
  const has = QMScore.hasScore(v);
  const win = has ? (+h > +a ? "h" : +a > +h ? "a" : "d") : "";
  return (
    <div className={"fxmatch" + (closed ? " is-locked" : "")}>
      <div className="fxrow">
        <span className={"fxteam home" + (win === "h" ? " w" : "") + (win === "d" ? " d" : "")}>
          <span className="fxname">{T[match.home].name}</span>
          <span className="fxflag">{T[match.home].flag}</span>
        </span>
        <span className="fxscore">
          <input className="fxnum" type="number" inputMode="numeric" min="0" max="19" disabled={closed}
            value={h ?? ""} onChange={(e) => set("h", e.target.value)} aria-label={"Goles " + T[match.home].name} />
          <span className="fxdash">·</span>
          <input className="fxnum" type="number" inputMode="numeric" min="0" max="19" disabled={closed}
            value={a ?? ""} onChange={(e) => set("a", e.target.value)} aria-label={"Goles " + T[match.away].name} />
        </span>
        <span className={"fxteam away" + (win === "a" ? " w" : "") + (win === "d" ? " d" : "")}>
          <span className="fxflag">{T[match.away].flag}</span>
          <span className="fxname">{T[match.away].name}</span>
        </span>
      </div>
      {hasOfficial && (
        <div className="fxofficial">
          <span className="fxofficial-label">Final real</span>
          <span className="fxofficial-score">{officialValue.h} <span>·</span> {officialValue.a}</span>
          {matchPoints > 0 && <span className="fxpoints">+{matchPoints} {matchPoints === 1 ? "punto" : "puntos"}</span>}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- GroupFixtures (tarjeta por grupo con sus 6 partidos) */
function GroupFixtures({ group, matches, scores, officialScores, onChange, locked, isClosed }) {
  const filled = matches.filter((m) => QMScore.hasScore((scores || {})[m.id])).length;
  const byJor = [1, 2, 3].map((j) => ({ j, list: matches.filter((m) => m.jor === j) }));
  return (
    <div className="fxcard" style={{ "--gc": group.color }}>
      <div className="fxhead">
        <div className="gletter">{group.id}</div>
        <div className="fxtitle">Grupo {group.id}</div>
        <div className={"gstat" + (filled === matches.length ? " ok" : "")}>{filled}/{matches.length}</div>
      </div>
      {byJor.map(({ j, list }) => (
        <div className="fxjor" key={j}>
          <div className="fxjlabel">Jornada {j}</div>
          {list.map((m) => (
            <MatchRow key={m.id} match={m} value={(scores || {})[m.id]} officialValue={(officialScores || {})[m.id]} onChange={onChange} locked={locked} isClosed={isClosed} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------- ThirdsSelector (elige 8 de 12 terceros) */
function ThirdsSelector({ groups, selected, onToggle, locked, cap = 8 }) {
  // candidatos: el 3.º elegido en cada grupo
  const cands = window.QM.GROUPS
    .map((g) => ({ g, code: (groups[g.id] || {}).third }))
    .filter((x) => x.code);
  const sel = selected || [];
  return (
    <div className="thirds">
      <div className="thirds-head">
        <div>
          <div className="thirds-title">Mejores Terceros</div>
          <div className="thirds-sub">De los 12 terceros, solo avanzan <b>8</b>. Elige cuáles crees que clasifican.</div>
        </div>
        <div className={"thirds-count" + (sel.length === cap ? " ok" : "")}>{sel.length}/{cap}</div>
      </div>
      {cands.length === 0 ? (
        <div className="thirds-empty">Primero marca el <b>3.º</b> de cada grupo arriba y aquí aparecerán para elegir.</div>
      ) : (
        <div className="thirds-grid">
          {cands.map(({ g, code }) => {
            const on = sel.includes(code);
            const full = sel.length >= cap && !on;
            return (
              <button key={g.id} className={"third-chip" + (on ? " on" : "") + (full ? " full" : "")}
                disabled={locked || full} style={{ "--gc": g.color }}
                onClick={() => !locked && onToggle(code)}>
                <span className="tc-grp">{g.id}</span>
                <span className="tc-flag">{T[code].flag}</span>
                <span className="tc-name">{T[code].name}</span>
                {on && <span className="tc-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------- GroupPhasePoints (puntos por jugador en grupos) */
function GroupPhasePoints({ players, allPreds, official, hasResults }) {
  const rows = (players || []).map((player) => {
    const score = QMScore.scorePlayer((allPreds || {})[player.id], official || {});
    return {
      player,
      score,
      played: QMScore.playerHasPredictions((allPreds || {})[player.id]),
    };
  }).sort((a, b) => (
    b.score.grupos - a.score.grupos ||
    b.score.groupPos - a.score.groupPos ||
    b.score.thirds - a.score.thirds ||
    a.player.name.localeCompare(b.player.name)
  ));

  return (
    <div className="phase-panel phase-points">
      <div className="phase-panel-head">
        <div>
          <div className="phase-title">Puntos obtenidos</div>
          <div className="phase-sub">Solo Fase de Grupos: posiciones y mejores terceros.</div>
        </div>
      </div>
      {!hasResults && (
        <div className="phase-empty">Aún no hay resultados oficiales cargados; los puntos aparecerán aquí automáticamente.</div>
      )}
      <div className="phase-points-list">
        {rows.map((row) => (
          <div className={"phase-player" + (row.played ? "" : " muted")} key={row.player.id}>
            <div className="phase-player-main">
              <span className="phase-av" style={{ background: row.player.color }}>{row.player.name.trim().slice(0, 2).toUpperCase()}</span>
              <span className="phase-name">{row.player.name}</span>
            </div>
            <div className="phase-breakdown">
              <span>Posiciones <b>{row.score.groupPos}</b></span>
              <span>Mejores 3.º <b>{row.score.thirds}</b></span>
            </div>
            <div className="phase-total"><b>{row.score.grupos}</b><span>pts</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------- OfficialGroupResults (posiciones finales por grupo) */
function OfficialGroupResults({ official }) {
  const officialGroups = (official && official.groups) || {};
  const bestThirds = (official && official.thirds) || [];
  const completed = window.QM.GROUPS.filter((g) => {
    const r = officialGroups[g.id] || {};
    return r.first && r.second && r.third;
  }).length;

  function orderedTeams(group) {
    const result = officialGroups[group.id] || {};
    const known = [result.first, result.second, result.third].filter(Boolean);
    const rest = group.teams.filter((code) => !known.includes(code));
    return [result.first, result.second, result.third, rest[0]].filter(Boolean);
  }

  return (
    <div className="phase-panel official-groups">
      <div className="phase-panel-head">
        <div>
          <div className="phase-title">Resultados finales por grupo</div>
          <div className="phase-sub">{completed}/12 grupos con posiciones oficiales.</div>
        </div>
      </div>
      {completed === 0 ? (
        <div className="phase-empty">Cuando el admin cargue los resultados oficiales, aquí se verá cómo terminó cada grupo.</div>
      ) : (
        <div className="official-grid">
          {window.QM.GROUPS.map((group) => {
            const result = officialGroups[group.id] || {};
            const order = orderedTeams(group);
            const complete = !!(result.first && result.second && result.third);
            return (
              <div className={"official-card" + (complete ? "" : " pending")} key={group.id} style={{ "--gc": group.color }}>
                <div className="official-head">
                  <span className="official-letter">{group.id}</span>
                  <span>Grupo {group.id}</span>
                </div>
                {complete ? (
                  <div className="official-teams">
                    {order.map((code, idx) => (
                      <div className="official-team" key={code}>
                        <span className="official-pos">{idx + 1}º</span>
                        <span className="official-flag">{T[code].flag}</span>
                        <span className="official-name">{T[code].name}</span>
                        {idx < 2 && <span className="official-tag direct">Clasifica</span>}
                        {idx === 2 && bestThirds.includes(code) && <span className="official-tag third">Mejor 3.º</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="official-pending">Pendiente</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { GroupCard, MatchRow, GroupFixtures, ThirdsSelector, GroupPhasePoints, OfficialGroupResults });
