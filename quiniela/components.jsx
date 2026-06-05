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
function MatchRow({ match, value, onChange, locked }) {
  const v = value || {};
  const h = v.h, a = v.a;
  const set = (k, val) => {
    if (val === "") return onChange(match.id, k, "");
    onChange(match.id, k, Math.max(0, Math.min(19, parseInt(val, 10) || 0)));
  };
  const has = QMScore.hasScore(v);
  const win = has ? (+h > +a ? "h" : +a > +h ? "a" : "d") : "";
  return (
    <div className="fxrow">
      <span className={"fxteam home" + (win === "h" ? " w" : "") + (win === "d" ? " d" : "")}>
        <span className="fxname">{T[match.home].name}</span>
        <span className="fxflag">{T[match.home].flag}</span>
      </span>
      <span className="fxscore">
        <input className="fxnum" type="number" inputMode="numeric" min="0" max="19" disabled={locked}
          value={h ?? ""} onChange={(e) => set("h", e.target.value)} aria-label={"Goles " + T[match.home].name} />
        <span className="fxdash">·</span>
        <input className="fxnum" type="number" inputMode="numeric" min="0" max="19" disabled={locked}
          value={a ?? ""} onChange={(e) => set("a", e.target.value)} aria-label={"Goles " + T[match.away].name} />
      </span>
      <span className={"fxteam away" + (win === "a" ? " w" : "") + (win === "d" ? " d" : "")}>
        <span className="fxflag">{T[match.away].flag}</span>
        <span className="fxname">{T[match.away].name}</span>
      </span>
    </div>
  );
}

/* -------------------------------------------------- GroupFixtures (tarjeta por grupo con sus 6 partidos) */
function GroupFixtures({ group, matches, scores, onChange, locked }) {
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
            <MatchRow key={m.id} match={m} value={(scores || {})[m.id]} onChange={onChange} locked={locked} />
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

Object.assign(window, { GroupCard, MatchRow, GroupFixtures, ThirdsSelector });
