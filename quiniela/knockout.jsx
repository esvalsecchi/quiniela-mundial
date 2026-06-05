/* Quiniela Mundial 2026 — Camino al Título (Dieciseisavos → Final) */
const KT = window.QM.T;

function RoundColumn({ title, sub, source, selected, cap, accent, onPick, single, locked, lockedHint }) {
  const sel = selected || [];
  const count = single ? (selected ? 1 : 0) : sel.length;
  const isOn = (c) => single ? selected === c : sel.includes(c);
  const atCap = !single && sel.length >= cap;
  return (
    <div className="ko-col">
      <div className="ko-col-head">
        <div className="ko-col-title">{title}</div>
        <div className="ko-col-sub">{sub}</div>
        <div className={"ko-counter" + (count === cap ? " ok" : "")}>{count}/{cap}</div>
      </div>
      <div className="ko-col-body">
        {source.length === 0 ? (
          <div className="ko-empty">{lockedHint || "Completa la ronda anterior"}</div>
        ) : source.map((c) => {
          const on = isOn(c);
          const full = atCap && !on;
          return (
            <button key={c}
              className={"ko-chip" + (on ? " on" : "") + (full ? " full" : "")}
              disabled={locked || full}
              style={{ "--gc": accent }}
              onClick={() => !locked && onPick(c)}>
              <span className="ko-flag">{KT[c].flag}</span>
              <span className="ko-name">{KT[c].name}</span>
              {on && <span className="ko-check">{single ? "★" : "✓"}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function KnockoutFlow({ pool, ko, onToggle, onSetSingle, locked }) {
  const caps = window.QM.KO_CAPS;
  const k = ko || {};
  const r16 = k.r16 || [], qf = k.qf || [], sf = k.sf || [], fin = k.fin || [];
  const thirdSource = sf.filter((c) => !fin.includes(c));
  const gold = "oklch(0.72 0.16 85)";

  return (
    <div>
      {pool.length < 32 && (
        <div className="bhint no-print">💡 Aquí compiten los <b>32 clasificados</b>: los <b>1.º y 2.º</b> de cada grupo + los <b>8 mejores terceros</b> que elijas. Llevas <b>{pool.length}/32</b> — complétalos en la pestaña <b>Grupos</b> para activar todas las rondas.</div>
      )}
      <div className="ko-scroll">
        <div className="ko-flow">
          <RoundColumn title="Dieciseisavos" sub="Elige los 16 que pasan a Octavos"
            source={pool} selected={r16} cap={caps.r16} accent="oklch(0.64 0.16 233)"
            onPick={(c) => onToggle("r16", c)} locked={locked}
            lockedHint="Completa Grupos y Terceros para ver a los 32" />
          <RoundColumn title="Octavos" sub="Los 8 que pasan a Cuartos"
            source={r16} selected={qf} cap={caps.qf} accent="oklch(0.60 0.18 268)"
            onPick={(c) => onToggle("qf", c)} locked={locked} />
          <RoundColumn title="Cuartos" sub="Los 4 semifinalistas"
            source={qf} selected={sf} cap={caps.sf} accent="oklch(0.56 0.19 320)"
            onPick={(c) => onToggle("sf", c)} locked={locked} />
          <RoundColumn title="Semifinales" sub="Los 2 finalistas"
            source={sf} selected={fin} cap={caps.fin} accent="oklch(0.58 0.20 12)"
            onPick={(c) => onToggle("fin", c)} locked={locked} />
          <RoundColumn title="Final" sub="Tu Campeón del Mundo 🏆"
            source={fin} selected={k.champ} cap={1} single accent={gold}
            onPick={(c) => onSetSingle("champ", c)} locked={locked} />
          <RoundColumn title="Tercer lugar" sub="De los semifinalistas eliminados"
            source={thirdSource} selected={k.third} cap={1} single accent="oklch(0.62 0.13 60)"
            onPick={(c) => onSetSingle("third", c)} locked={locked} />
        </div>
      </div>

      {k.champ && (
        <div className="champ-banner">
          <span className="cb-trophy">🏆</span>
          <div>
            <div className="cb-k">Tu Campeón del Mundo</div>
            <div className="cb-team">{KT[k.champ].flag} {KT[k.champ].name}</div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { KnockoutFlow });
