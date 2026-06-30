/* Quiniela Mundial 2026 — motor de puntuación (formato real 2026)
   Estructura de un pronóstico / resultado:
   {
     groups: { A: {first, second, third}, ... },
     thirds: [codes...],            // los 8 "mejores terceros" elegidos
     scores: { "A-0": {h,a}, ... },  // 72 partidos de grupos
     koScores: { r16: [{h,a}], qf: [{h,a}], sf: [{h,a}], semis: [{h,a}], fin: {h,a}, third: {h,a} },
     ko: { r16:[], qf:[], sf:[], fin:[], champ:null, third:null }
   }
*/
(function () {
  const QM = window.QM;
  const P = QM.POINTS;

  function hasScore(o) {
    return o && o.h !== undefined && o.h !== "" && o.h !== null && o.a !== undefined && o.a !== "" && o.a !== null;
  }
  const inter = (a, b) => (a || []).filter((x) => x && (b || []).includes(x));

  function scoreMatch(predScore, officialScore) {
    if (!hasScore(officialScore) || !hasScore(predScore)) return 0;
    const oh = +officialScore.h, oa = +officialScore.a, ph = +predScore.h, pa = +predScore.a;
    if (ph === oh && pa === oa) return P.exacto;
    if (Math.sign(ph - pa) === Math.sign(oh - oa)) return P.resultado;
    return 0;
  }

  function sameTeams(a, b) {
    return a && b && a.home && a.away && a.home === b.home && a.away === b.away;
  }

  function koWinner(match) {
    if (!match || !match.home || !match.away || !hasScore(match.score)) return null;
    const h = +match.score.h, a = +match.score.a;
    if (h > a) return match.home;
    if (a > h) return match.away;
    const w = match.score.w || match.score.winner;
    return (w === match.home || w === match.away) ? w : null;
  }

  // Ganador efectivo: usa el precalculado por buildBracket (que puede incluir el
  // default de empate del jugador) y si no, lo recalcula del marcador.
  function matchWinner(match) {
    if (!match) return null;
    if (match.winner) return match.winner;
    return koWinner(match);
  }

  function scoreKOMatch(predMatch, officialMatch) {
    if (!sameTeams(predMatch, officialMatch)) return 0;
    if (!hasScore(officialMatch.score) || !hasScore(predMatch.score)) return 0;
    const oh = +officialMatch.score.h, oa = +officialMatch.score.a;
    const ph = +predMatch.score.h, pa = +predMatch.score.a;
    const officialWinner = matchWinner(officialMatch);
    const predWinner = matchWinner(predMatch);
    const sameWinner = officialWinner && predWinner && officialWinner === predWinner;
    if (ph === oh && pa === oa) {
      if (oh !== oa || sameWinner) return P.exacto;
      return 0;
    }
    if (sameWinner) return P.resultado;
    return 0;
  }

  function scoreKOBracket(pred, official) {
    if (!window.buildBracket || !official.bracketPairs || !(official.bracketPairs.r16 || []).length || !official.koScores) return 0;
    const playerBracket = window.buildBracket(official.bracketPairs.r16, pred.koScores || {}, true);
    const officialBracket = window.buildBracket(official.bracketPairs.r16, official.koScores || {}, false);
    if (!playerBracket || !officialBracket) return 0;

    let points = 0;
    ["r16", "qf", "sf", "semis"].forEach((round) => {
      (officialBracket[round] || []).forEach((officialMatch, idx) => {
        points += scoreKOMatch((playerBracket[round] || [])[idx], officialMatch);
      });
    });
    points += scoreKOMatch(playerBracket.fin, officialBracket.fin);
    points += scoreKOMatch(playerBracket.third, officialBracket.third);
    return points;
  }

  function scorePlayer(pred, official) {
    const R = { groupPos: 0, thirds: 0, scores: 0, octavos: 0, cuartos: 0, semis: 0, finals: 0, champ: 0, third: 0 };
    pred = pred || {}; official = official || {};
    const pg = pred.groups || {}, og = official.groups || {};
    const ps = pred.scores || {}, os = official.scores || {};
    const pk = pred.ko || {}, ok = official.ko || {};

    // Fase de grupos (posiciones)
    QM.GROUPS.forEach((g) => {
      const off = og[g.id]; if (!off) return;
      const pv = pg[g.id] || {};
      const offTop2 = [off.first, off.second].filter(Boolean);
      [pv.first, pv.second].filter(Boolean).forEach((c) => { if (offTop2.includes(c)) R.groupPos += P.clasificado; });
      if (pv.first && off.first && pv.first === off.first) R.groupPos += P.lider;
      if (pv.third && off.third && pv.third === off.third) R.groupPos += P.tercerGrupo;
    });

    // Mejores terceros
    inter(pred.thirds, official.thirds).forEach(() => { R.thirds += P.mejorTercero; });

    // Marcadores (72)
    QM.MATCHES.forEach((m) => {
      const off = os[m.id], pv = ps[m.id];
      R.scores += scoreMatch(pv, off);
    });

    // Eliminatoria — cada partido de la llave predictiva puntúa por resultado/marcador.
    R.koScores = scoreKOBracket(pred, official);

    R.total = R.groupPos + R.thirds + R.scores + R.koScores;
    // agregados para la tabla
    R.grupos = R.groupPos + R.thirds;
    R.elim = R.koScores;
    return R;
  }

  function playerHasPredictions(pred) {
    if (!pred) return false;
    const g = pred.groups || {}, s = pred.scores || {}, k = pred.ko || {};
    if (Object.values(g).some((x) => x && (x.first || x.second || x.third))) return true;
    if (Object.values(s).some((x) => hasScore(x))) return true;
    if ((pred.thirds || []).length) return true;
    if (k.champ || (k.fin || []).length || (k.qf || []).length || (k.r16 || []).length) return true;
    if (pred.koScores && Object.values(pred.koScores).some((x) => {
      if (Array.isArray(x)) return x.some((s) => hasScore(s));
      return hasScore(x);
    })) return true;
    return false;
  }

  function hasOfficialResults(official) {
    if (!official) return false;
    const g = official.groups || {}, s = official.scores || {}, k = official.ko || {};
    if (Object.values(g).some((x) => x && (x.first || x.second || x.third))) return true;
    if (Object.values(s).some((x) => hasScore(x))) return true;
    if ((official.thirds || []).length) return true;
    if (k.champ || (k.fin || []).length || (k.r16 || []).length) return true;
    return false;
  }

  function standings(allPreds, official, players) {
    const roster = Array.isArray(players) ? players : QM.PLAYERS;
    const rows = roster.map((pl) => ({
      player: pl,
      score: scorePlayer(allPreds[pl.id], official),
      played: playerHasPredictions(allPreds[pl.id]),
    }));
    rows.sort((a, b) => b.score.total - a.score.total || (b.played - a.played) || a.player.name.localeCompare(b.player.name));
    let rank = 0, prev = null;
    rows.forEach((r, i) => { if (prev === null || r.score.total !== prev) { rank = i + 1; prev = r.score.total; } r.rank = rank; });
    return rows;
  }

  function calcGroupStandings(groupId, scores) {
    const group = QM.GROUPS.find(function(g) { return g.id === groupId; });
    if (!group) return null;
    const matches = QM.MATCHES.filter(function(m) { return m.group === groupId; });
    if (!matches.every(function(m) { return hasScore((scores || {})[m.id]); })) return null;
    const pts = {}, gd = {}, gf = {};
    group.teams.forEach(function(t) { pts[t] = 0; gd[t] = 0; gf[t] = 0; });
    matches.forEach(function(m) {
      const s = scores[m.id], h = +s.h, a = +s.a;
      gf[m.home] += h; gf[m.away] += a;
      gd[m.home] += (h - a); gd[m.away] += (a - h);
      if (h > a) pts[m.home] += 3;
      else if (a > h) pts[m.away] += 3;
      else { pts[m.home]++; pts[m.away]++; }
    });
    const sorted = group.teams.slice().sort(function(a, b) {
      return (pts[b] - pts[a]) || (gd[b] - gd[a]) || (gf[b] - gf[a]) || a.localeCompare(b);
    });
    return { first: sorted[0], second: sorted[1], third: sorted[2] };
  }

  window.QMScore = { scorePlayer, standings, hasOfficialResults, playerHasPredictions, hasScore, scoreMatch, scoreKOMatch, calcGroupStandings };
})();
