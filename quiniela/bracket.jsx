/* Quiniela Mundial 2026 — Bracket por marcadores (Fase 2) */
const KT2 = window.QM.T;

/* ────────────────────────────────────────────────────────────────
   Core logic
   ──────────────────────────────────────────────────────────────── */
function getKOWinner(home, away, score) {
  if (!home || !away) return null;
  const h = (score && score.h !== '' && score.h != null) ? +score.h : NaN;
  const a = (score && score.a !== '' && score.a != null) ? +score.a : NaN;
  if (isNaN(h) || isNaN(a)) return null;
  if (h > a) return home;
  if (a > h) return away;
  const tieWinner = score && (score.w || score.winner);
  if (tieWinner === home || tieWinner === away) return tieWinner;
  return null; // empate = no resuelto
}

// ¿El marcador es un empate completo (ambos números puestos e iguales)?
function isKOTie(score) {
  if (!score) return false;
  const h = (score.h !== '' && score.h != null) ? +score.h : NaN;
  const a = (score.a !== '' && score.a != null) ? +score.a : NaN;
  return !isNaN(h) && !isNaN(a) && h === a;
}

// defaultTieToHome: para PRONÓSTICOS de jugador, un empate sin ganador elegido
// avanza al local por defecto (editable). Para resultados OFICIALES queda en false.
function buildBracket(r16Pairs, koScores, defaultTieToHome) {
  r16Pairs = r16Pairs || [];
  koScores = koScores || {};

  function winnerOf(home, away, score) {
    const w = getKOWinner(home, away, score);
    if (w) return w;
    if (defaultTieToHome && home && away && isKOTie(score)) return home;
    return null;
  }

  function makeMatch(home, away, score) {
    return { home: home || null, away: away || null, score: score || null, winner: winnerOf(home, away, score) };
  }

  // Estructura real del cuadro (por índice). Si falta, cae al emparejamiento consecutivo.
  const B = (window.QM && window.QM.KO_BRACKET) || {};
  function feed(prev, pairIdx) {
    return prev[pairIdx] ? prev[pairIdx].winner : null;
  }
  function pairsFor(round, i) {
    return (B[round] && B[round][i]) ? B[round][i] : [i * 2, i * 2 + 1];
  }

  // R16 (Dieciseisavos) — 16 partidos definidos por el admin
  const r16Scores = koScores.r16 || [];
  const r16 = r16Pairs.map(function(pair, i) {
    return makeMatch(pair ? pair.home : null, pair ? pair.away : null, r16Scores[i] || null);
  });

  // QF (Octavos) — 8 partidos: ganadores de dos Dieciseisavos según la estructura real
  const qfScores = koScores.qf || [];
  const qf = [];
  for (var qi = 0; qi < 8; qi++) {
    var qp = pairsFor("qf", qi);
    qf.push(makeMatch(feed(r16, qp[0]), feed(r16, qp[1]), qfScores[qi] || null));
  }

  // SF (Cuartos) — 4 partidos
  const sfScores = koScores.sf || [];
  const sf = [];
  for (var si = 0; si < 4; si++) {
    var sp = pairsFor("sf", si);
    sf.push(makeMatch(feed(qf, sp[0]), feed(qf, sp[1]), sfScores[si] || null));
  }

  // Semis (Semifinales) — 2 partidos
  const semisScores = koScores.semis || [];
  const semis = [];
  for (var mi = 0; mi < 2; mi++) {
    var mp = pairsFor("semis", mi);
    semis.push(makeMatch(feed(sf, mp[0]), feed(sf, mp[1]), semisScores[mi] || null));
  }

  // Final — los 2 ganadores de Semifinales
  const finPair = B.fin || [0, 1];
  const finScore = koScores.fin || null;
  const fin = makeMatch(feed(semis, finPair[0]), feed(semis, finPair[1]), finScore);

  // Tercer lugar — los dos perdedores de semis
  function getLoser(match) {
    if (!match.winner) return null;
    if (match.winner === match.home) return match.away;
    return match.home;
  }
  const thirdScore = koScores.third || null;
  const third = makeMatch(
    semis[0] ? getLoser(semis[0]) : null,
    semis[1] ? getLoser(semis[1]) : null,
    thirdScore
  );

  return { r16: r16, qf: qf, sf: sf, semis: semis, fin: fin, third: third };
}

function deriveKO(bracket) {
  if (!bracket) return { r16: [], qf: [], sf: [], fin: [], champ: null, third: null };

  function winners(arr) {
    return (arr || []).map(function(m) { return m.winner; }).filter(Boolean);
  }
  function finalistsFrom(arr) {
    // fin (array of 2) = teams that reached the final
    return (arr || []).filter(function(m) { return m.home && m.away; }).reduce(function(acc, m) {
      if (m.home && !acc.includes(m.home)) acc.push(m.home);
      if (m.away && !acc.includes(m.away)) acc.push(m.away);
      return acc;
    }, []);
  }

  // r16: los 32 equipos que participan en r16 (home+away de cada partido)
  var r16Teams = [];
  (bracket.r16 || []).forEach(function(m) {
    if (m.winner && !r16Teams.includes(m.winner)) r16Teams.push(m.winner);
  });

  // qf: equipos que ganaron los R16 (= ganadores del R16)
  var qfTeams = winners(bracket.r16);
  // sf: equipos que ganaron los QF
  var sfTeams = winners(bracket.qf);
  // fin: equipos que llegaron a la final (ganadores de semis = ganadores de SF)
  var finTeams = winners(bracket.sf);

  var champ = bracket.fin ? bracket.fin.winner : null;
  var third = bracket.third ? bracket.third.winner : null;

  return {
    r16: qfTeams,   // equipos que avanzan desde R16 = los que ganaron r16
    qf:  sfTeams,   // equipos que avanzan desde QF
    sf:  finTeams,  // semifinalistas que llegan a la final
    fin: champ ? [champ, (bracket.fin.home === champ ? bracket.fin.away : bracket.fin.home)].filter(Boolean) : finTeams,
    champ: champ,
    third: third,
  };
}

function getKOSchedule(round, matchIdx) {
  const schedule = (window.QM && window.QM.KO_SCHEDULE) || {};
  if (round === "fin" || round === "third") return schedule[round] || null;
  return Array.isArray(schedule[round]) ? schedule[round][matchIdx] || null : null;
}

function formatKOKickoff(schedule) {
  if (!schedule || !schedule.kickoffAt) return "";
  const d = new Date(schedule.kickoffAt);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function sameKOTeams(predMatch, officialMatch) {
  return !!(predMatch && officialMatch && predMatch.home && predMatch.away &&
    predMatch.home === officialMatch.home && predMatch.away === officialMatch.away);
}

function scoreKOMatchCard(predMatch, officialMatch) {
  if (!sameKOTeams(predMatch, officialMatch)) return 0;
  return QMScore.scoreKOMatch
    ? QMScore.scoreKOMatch(predMatch, officialMatch)
    : QMScore.scoreMatch(predMatch.score, officialMatch.score);
}

const KO_PROGRESSIVE_MULTIPLIERS_UI = { r16: 1, qf: 2, sf: 4, semis: 8, fin: 16, third: 16 };

function getKOMatchMultiplier(mode, round) {
  return mode === "progressive" ? (KO_PROGRESSIVE_MULTIPLIERS_UI[round] || 1) : 1;
}

function getKOScoreForRound(koScores, round, idx) {
  koScores = koScores || {};
  if (round === "fin" || round === "third") return koScores[round] || null;
  return Array.isArray(koScores[round]) ? koScores[round][idx] || null : null;
}

function withPredictedScores(teamBracket, koScores) {
  if (!teamBracket) return null;
  function withScore(round, match, idx) {
    match = match || {};
    const score = getKOScoreForRound(koScores, round, idx);
    return {
      home: match.home || null,
      away: match.away || null,
      score: score || null,
      winner: getKOWinner(match.home, match.away, score),
    };
  }
  return {
    r16: (teamBracket.r16 || []).map(function(m, i) { return withScore("r16", m, i); }),
    qf: (teamBracket.qf || []).map(function(m, i) { return withScore("qf", m, i); }),
    sf: (teamBracket.sf || []).map(function(m, i) { return withScore("sf", m, i); }),
    semis: (teamBracket.semis || []).map(function(m, i) { return withScore("semis", m, i); }),
    fin: withScore("fin", teamBracket.fin, 0),
    third: withScore("third", teamBracket.third, 0),
  };
}

/* ────────────────────────────────────────────────────────────────
   KOMatchCard — muestra un partido del bracket con inputs
   ──────────────────────────────────────────────────────────────── */
function KOMatchCard({ home, away, score, winner: winnerProp, officialMatch, schedule, multiplier, matchLabel, locked, tiebreakLocked, onChange }) {
  // El marcador se bloquea al cerrar el partido, pero el desempate se puede seguir
  // eligiendo (tiebreakLocked solo se activa cuando toda la fase está cerrada).
  const tieLocked = (tiebreakLocked != null) ? tiebreakLocked : locked;
  // El ganador viene precalculado del bracket (puede incluir el default de empate).
  const winner = (winnerProp != null) ? winnerProp : getKOWinner(home, away, score);
  const predMatch = { home: home, away: away, score: score || null, winner: winner };
  const homeT = home ? KT2[home] : null;
  const awayT = away ? KT2[away] : null;
  const decided = !!(winner);
  const kickoffLabel = formatKOKickoff(schedule);
  const hasOfficial = officialMatch && QMScore.hasScore(officialMatch.score);
  const officialTeamsMatch = hasOfficial && sameKOTeams(predMatch, officialMatch);
  const officialHomeT = hasOfficial && officialMatch.home ? KT2[officialMatch.home] : null;
  const officialAwayT = hasOfficial && officialMatch.away ? KT2[officialMatch.away] : null;
  const matchPoints = officialTeamsMatch ? scoreKOMatchCard(predMatch, officialMatch) * (multiplier || 1) : 0;

  if (!home && !away) {
    return (
      <div className="ko-mc empty">
        <div className="ko-mc-top">
          {matchLabel && <span className="ko-mc-label">{matchLabel}</span>}
          {kickoffLabel && <span className="ko-mc-date">{kickoffLabel}</span>}
        </div>
        <span className="ko-mc-tbd">Por definir</span>
      </div>
    );
  }

  const hVal = (score && score.h !== '' && score.h != null) ? String(score.h) : '';
  const aVal = (score && score.a !== '' && score.a != null) ? String(score.a) : '';
  const hasBothScores = hVal !== '' && aVal !== '';
  const isTie = hasBothScores && +hVal === +aVal;
  const explicitTieWinner = score && (score.w || score.winner);
  const needsTieWinner = isTie && !winner;             // sin resolver (solo pasa en oficial)
  const decidedByDefault = isTie && !!winner && !explicitTieWinner; // empate resuelto por default

  const homeClass = "ko-mc-row" + (decided ? (winner === home ? " ko-w" : " ko-l") : "");
  const awayClass = "ko-mc-row away" + (decided ? (winner === away ? " ko-w" : " ko-l") : "");

  return (
    <div className={"ko-mc" + (decided ? " ko-decided" : "") + (needsTieWinner ? " ko-needs-winner" : "") + (locked ? " is-locked" : "")}>
      <div className="ko-mc-top">
        {matchLabel && <span className="ko-mc-label">{matchLabel}</span>}
        {kickoffLabel && <span className="ko-mc-date">{kickoffLabel}</span>}
      </div>
      <div className={homeClass}>
        <span className="ko-mc-flag">{homeT ? homeT.flag : "?"}</span>
        <span className="ko-mc-name">{homeT ? homeT.name : home}</span>
        <input
          type="number"
          className="ko-mc-num"
          min="0"
          max="99"
          value={hVal}
          disabled={locked || !home || !away}
          placeholder="—"
          onChange={function(e) { if (onChange) onChange('h', e.target.value); }}
        />
      </div>
      <div className="ko-mc-sep">
        {decided
          ? <span className="ko-mc-adv">→ avanza{isTie ? (decidedByDefault ? " (por defecto)" : " por desempate") : ""}</span>
          : <span className="ko-mc-vs">VS</span>}
      </div>
      <div className={awayClass}>
        <span className="ko-mc-flag">{awayT ? awayT.flag : "?"}</span>
        <span className="ko-mc-name">{awayT ? awayT.name : away}</span>
        <input
          type="number"
          className="ko-mc-num"
          min="0"
          max="99"
          value={aVal}
          disabled={locked || !home || !away}
          placeholder="—"
          onChange={function(e) { if (onChange) onChange('a', e.target.value); }}
        />
      </div>
      {isTie && (
        <div className="ko-mc-tiebreak">
          <span>{explicitTieWinner
            ? "✓ Ganador del desempate"
            : (winner ? "Avanza por defecto — toca para cambiar" : "⚠️ Elige quién avanza")}</span>
          <button
            type="button"
            className={"ko-mc-tiebtn" + (winner === home ? (explicitTieWinner ? " on" : " on is-default") : "")}
            disabled={tieLocked || !onChange}
            onClick={function() { if (onChange) onChange('w', home); }}>
            {homeT ? homeT.flag : ""} {homeT ? homeT.name : home}
          </button>
          <button
            type="button"
            className={"ko-mc-tiebtn" + (winner === away ? (explicitTieWinner ? " on" : " on is-default") : "")}
            disabled={tieLocked || !onChange}
            onClick={function() { if (onChange) onChange('w', away); }}>
            {awayT ? awayT.flag : ""} {awayT ? awayT.name : away}
          </button>
        </div>
      )}
      {hasOfficial && (
        <div className="ko-mc-official">
          <span className="ko-mc-official-label">{officialTeamsMatch ? "Final real" : "Real"}</span>
          <span className="ko-mc-official-score">
            {!officialTeamsMatch && officialHomeT && <span className="ko-mc-official-flag">{officialHomeT.flag}</span>}
            {officialMatch.score.h} <span>·</span> {officialMatch.score.a}
            {!officialTeamsMatch && officialAwayT && <span className="ko-mc-official-flag">{officialAwayT.flag}</span>}
          </span>
          {matchPoints > 0 && <span className="ko-mc-points">+{matchPoints} {matchPoints === 1 ? "punto" : "puntos"}</span>}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   BracketRound — columna de partidos para una ronda
   ──────────────────────────────────────────────────────────────── */
function BracketRound({ title, sub, matches, officialMatches, mode, round, locked, onScoreChange, isMatchClosed }) {
  return (
    <div className="br-round">
      <div className="br-round-head">
        <div className="br-round-title">{title}</div>
        {sub && <div className="br-round-sub">{sub}</div>}
      </div>
      <div className="br-round-matches">
        {(matches || []).map(function(m, i) {
          return (
            <KOMatchCard
              key={i}
              home={m.home}
              away={m.away}
              score={m.score}
              winner={m.winner}
              officialMatch={(officialMatches || [])[i]}
              schedule={getKOSchedule(round, i)}
              multiplier={getKOMatchMultiplier(mode, round)}
              matchLabel={"P" + (i + 1)}
              locked={locked || !!(isMatchClosed && isMatchClosed(round, i))}
              tiebreakLocked={locked}
              onChange={function(k, val) { if (onScoreChange) onScoreChange(round, i, k, val); }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   BracketView — bracket completo con todas las rondas
   ──────────────────────────────────────────────────────────────── */
function BracketView({ r16Pairs, koScores, officialKoScores, mode, onScoreChange, locked, phase2Open, isMatchClosed }) {
  // Siempre mostrar 16 slots — rellenar con vacíos si el admin aún no configuró los cruces
  const rawPairs = r16Pairs || [];
  const fullPairs = Array.from({ length: 16 }, function(_, i) {
    return rawPairs[i] && (rawPairs[i].home || rawPairs[i].away) ? rawPairs[i] : { home: null, away: null };
  });
  const pairsReady = rawPairs.filter(function(p) { return p && p.home && p.away; }).length;
  koScores = koScores || {};
  mode = mode === "progressive" ? "progressive" : "predictive";

  const officialBracket = buildBracket(fullPairs, officialKoScores || {}, false);
  const bracket = mode === "progressive"
    ? withPredictedScores(officialBracket, koScores)
    : buildBracket(fullPairs, koScores, true);

  // Columna final: Final + 3er lugar
  const finMatch = bracket.fin;
  const thirdMatch = bracket.third;
  const officialFinMatch = officialBracket ? officialBracket.fin : null;
  const officialThirdMatch = officialBracket ? officialBracket.third : null;
  const champ = finMatch ? finMatch.winner : null;
  const champT = champ ? KT2[champ] : null;

  return (
    <div>
      {pairsReady < 16 && (
        <div className="bhint" style={{ marginBottom: 16 }}>
          ⏳ <b>Cruces del R16 pendientes</b> — el admin los configura cuando terminen los grupos ({pairsReady}/16 definidos). El bracket aparece aquí en cuanto estén listos.
        </div>
      )}
      {pairsReady === 16 && !phase2Open && (
        <div className="bhint" style={{ marginBottom: 16, background: "oklch(0.97 0.04 85)", borderColor: "var(--gold-deep)" }}>
          🔒 <b>Bracket listo.</b> El admin abrirá la Fase 2 cuando empiece la eliminatoria para que puedas llenar los marcadores.
        </div>
      )}
      {pairsReady === 16 && mode === "progressive" && (
        <div className="bhint live" style={{ marginBottom: 16 }}>
          🧭 <b>Modo llave real progresiva.</b> Los cruces se actualizan con los equipos reales; cada marcador se puede cambiar hasta que inicia ese partido.
        </div>
      )}
    <div className="br-scroll">
      <div className="br-flow">
        <BracketRound
          title="Dieciseisavos"
          sub={"16 partidos"}
          matches={bracket.r16}
          officialMatches={officialBracket ? officialBracket.r16 : null}
          mode={mode}
          round="r16"
          locked={locked}
          onScoreChange={onScoreChange}
          isMatchClosed={isMatchClosed}
        />
        <BracketRound
          title="Octavos"
          sub={"8 partidos"}
          matches={bracket.qf}
          officialMatches={officialBracket ? officialBracket.qf : null}
          mode={mode}
          round="qf"
          locked={locked}
          onScoreChange={onScoreChange}
          isMatchClosed={isMatchClosed}
        />
        <BracketRound
          title="Cuartos"
          sub={"4 partidos"}
          matches={bracket.sf}
          officialMatches={officialBracket ? officialBracket.sf : null}
          mode={mode}
          round="sf"
          locked={locked}
          onScoreChange={onScoreChange}
          isMatchClosed={isMatchClosed}
        />
        <BracketRound
          title="Semifinales"
          sub={"2 partidos"}
          matches={bracket.semis}
          officialMatches={officialBracket ? officialBracket.semis : null}
          mode={mode}
          round="semis"
          locked={locked}
          onScoreChange={onScoreChange}
          isMatchClosed={isMatchClosed}
        />

        {/* Columna final: Final + 3er lugar + banner campeón */}
        <div className="br-round">
          <div className="br-round-head">
            <div className="br-round-title">Final</div>
            <div className="br-round-sub">Final + Tercer lugar</div>
          </div>
          <div className="br-round-matches">
            <KOMatchCard
              home={finMatch.home}
              away={finMatch.away}
              score={finMatch.score}
              winner={finMatch.winner}
              officialMatch={officialFinMatch}
              schedule={getKOSchedule("fin", 0)}
              multiplier={getKOMatchMultiplier(mode, "fin")}
              matchLabel="Final"
              locked={locked || !!(isMatchClosed && isMatchClosed('fin', 0))}
              tiebreakLocked={locked}
              onChange={function(k, val) { if (onScoreChange) onScoreChange('fin', 0, k, val); }}
            />
            <KOMatchCard
              home={thirdMatch.home}
              away={thirdMatch.away}
              score={thirdMatch.score}
              winner={thirdMatch.winner}
              officialMatch={officialThirdMatch}
              schedule={getKOSchedule("third", 0)}
              multiplier={getKOMatchMultiplier(mode, "third")}
              matchLabel="3.er lugar"
              locked={locked || !!(isMatchClosed && isMatchClosed('third', 0))}
              tiebreakLocked={locked}
              onChange={function(k, val) { if (onScoreChange) onScoreChange('third', 0, k, val); }}
            />
            {champ && (
              <div className="champ-banner" style={{ marginTop: 8 }}>
                <span className="cb-trophy">🏆</span>
                <div>
                  <div className="cb-k">Campeón del Mundo</div>
                  <div className="cb-team">{champT.flag} {champT.name}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

Object.assign(window, { BracketView, buildBracket, deriveKO, getKOWinner });
