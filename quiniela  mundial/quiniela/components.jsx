/* Quiniela Mundial 2026 — componentes presentacionales */
const { useState } = React;
const T = window.QM.T;

function teamLabel(code) {
  if (!code) return "";
  const t = T[code];
  return `${t.flag}  ${t.name}`;
}

/* -------------------------------------------------- GroupCard */
function GroupCard({ group, value, onPick, locked }) {
  const v = value || {};
  const filled = v.first && v.second;
  return (
    <div className={"gcard" + (locked ? " is-locked" : "")} style={{ "--gc": group.color }}>
      <div className="gcard-head">
        <div className="gletter">{group.id}</div>
        <div>
          <div className="gt">Grupo {group.id}</div>
          <div className="gsub">Elige quién avanza · 1.º y 2.º</div>
        </div>
        <div className={"gstat" + (filled ? " ok" : "")}>
          {filled ? "✓ Listo" : `${(v.first ? 1 : 0) + (v.second ? 1 : 0)}/2`}
        </div>
      </div>
      {group.teams.map((code) => {
        const t = T[code];
        const is1 = v.first === code;
        const is2 = v.second === code;
        const rc = is1 ? " q1" : is2 ? " q2" : "";
        return (
          <div className={"trow" + rc} key={code}>
            <span className="barflag"></span>
            <span className="flag">{t.flag}</span>
            <span className="tname">
              {t.name} <span className="tcode">{t.code}</span>
            </span>
            <span className="picks">
              <span
                className={"pos" + (is1 ? " on1" : "") + (locked ? " dis" : "")}
                onClick={() => !locked && onPick(group.id, "first", code)}
                title="Gana el grupo"
              >1º</span>
              <span
                className={"pos" + (is2 ? " on2" : "") + (locked ? " dis" : "")}
                onClick={() => !locked && onPick(group.id, "second", code)}
                title="Segundo lugar"
              >2º</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------- MatchScore */
function MatchScore({ match, value, onChange, locked }) {
  const v = value || {};
  const h = v.h, a = v.a;
  const has = h !== undefined && h !== "" && a !== undefined && a !== "";
  let res = "";
  if (has) {
    const hn = +h, an = +a;
    if (hn > an) res = <span>Gana <b>{T[match.home].name}</b></span>;
    else if (an > hn) res = <span>Gana <b>{T[match.away].name}</b></span>;
    else res = <span><b>Empate</b></span>;
  }
  const set = (k, val) => {
    if (val === "") return onChange(match.id, k, "");
    let n = Math.max(0, Math.min(19, parseInt(val, 10) || 0));
    onChange(match.id, k, n);
  };
  return (
    <div className="mcard">
      <span className="mdate">{match.date}</span>
      <div className="mtag">{match.tag}</div>
      <div className="mrow">
        <div className="mteam">
          <span className="mflag">{T[match.home].flag}</span>
          <span className="mn">{T[match.home].name}</span>
        </div>
        <div className="mscore">
          <input className="snum" type="number" inputMode="numeric" min="0" max="19" disabled={locked}
            value={h ?? ""} onChange={(e) => set("h", e.target.value)} aria-label="Goles local" />
          <span className="mdash">–</span>
          <input className="snum" type="number" inputMode="numeric" min="0" max="19" disabled={locked}
            value={a ?? ""} onChange={(e) => set("a", e.target.value)} aria-label="Goles visitante" />
        </div>
        <div className="mteam">
          <span className="mflag">{T[match.away].flag}</span>
          <span className="mn">{T[match.away].name}</span>
        </div>
      </div>
      <div className="mresult">{res || "Pronostica el marcador exacto"}</div>
    </div>
  );
}

/* -------------------------------------------------- BracketSlot */
function BracketSlot({ value, options, onChange, variant, locked }) {
  const cls = "bslot" + (value ? " filled" : "") + (variant ? " " + variant : "");
  return (
    <div className={cls}>
      <span className="bflag">{value ? T[value].flag : "—"}</span>
      <select value={value || ""} disabled={locked} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{variant === "champ" ? "Elige Campeón…" : "Elegir…"}</option>
        {options.map((c) => (
          <option key={c} value={c}>{T[c].name}</option>
        ))}
      </select>
    </div>
  );
}

/* -------------------------------------------------- Bracket */
function Bracket({ pool, bracket, onSet, locked }) {
  const b = bracket;
  const qf = b.qf || Array(8).fill(null);
  const sf = b.sf || Array(4).fill(null);
  const fin = b.fin || Array(2).fill(null);

  const uniqOpts = (arr) => arr.filter((x, i) => x && arr.indexOf(x) === i);
  const sfOpts = (i) => uniqOpts([qf[2 * i], qf[2 * i + 1]]);
  const finOpts = (i) => uniqOpts([sf[2 * i], sf[2 * i + 1]]);
  const champOpts = uniqOpts([fin[0], fin[1]]);
  const thirdOpts = uniqOpts(sf.filter((s) => s && !fin.includes(s)));

  return (
    <div className="bracket-scroll">
      <div className="bracket">
        <div className="bcol">
          <div className="bcol-title">Cuartos de Final</div>
          <div className="bcol-body">
            {[0, 1, 2, 3].map((m) => (
              <div className="bmatch" key={m}>
                <BracketSlot value={qf[2 * m]} options={pool} locked={locked}
                  onChange={(val) => onSet("qf", 2 * m, val)} />
                <div className="vs">vs</div>
                <BracketSlot value={qf[2 * m + 1]} options={pool} locked={locked}
                  onChange={(val) => onSet("qf", 2 * m + 1, val)} />
              </div>
            ))}
          </div>
        </div>

        <div className="bcol">
          <div className="bcol-title">Semifinales</div>
          <div className="bcol-body">
            {[0, 1, 2, 3].map((i) => (
              <BracketSlot key={i} value={sf[i]} options={sfOpts(i)} locked={locked}
                onChange={(val) => onSet("sf", i, val)} />
            ))}
          </div>
        </div>

        <div className="bcol final-col">
          <div className="bcol-title">La Final</div>
          <div className="bcol-body" style={{ flex: "0 0 auto", gap: 18 }}>
            <BracketSlot value={fin[0]} options={finOpts(0)} locked={locked}
              onChange={(val) => onSet("fin", 0, val)} />
            <div className="vs">vs</div>
            <BracketSlot value={fin[1]} options={finOpts(1)} locked={locked}
              onChange={(val) => onSet("fin", 1, val)} />
          </div>
        </div>

        <div className="bcol final-col">
          <div className="bcol-title">Campeón</div>
          <div className="champ-wrap">
            <div className="trophy">🏆</div>
            <BracketSlot value={b.champ} options={champOpts} variant="champ" locked={locked}
              onChange={(val) => onSet("champ", null, val)} />
            <div className="champ-cap">Campeón del Mundo</div>
          </div>
        </div>
      </div>

      <div className="third-note">
        <span className="lbl">🥉 Tercer lugar:</span>
        <div style={{ minWidth: 200 }}>
          <BracketSlot value={b.third} options={thirdOpts} locked={locked}
            onChange={(val) => onSet("third", null, val)} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GroupCard, MatchScore, BracketSlot, Bracket, teamLabel });
