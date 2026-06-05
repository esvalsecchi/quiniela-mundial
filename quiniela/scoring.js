/* Quiniela Mundial 2026 — motor de puntuación (formato real 2026)
   Estructura de un pronóstico / resultado:
   {
     groups: { A: {first, second, third}, ... },
     thirds: [codes...],            // los 8 "mejores terceros" elegidos
     scores: { "A-0": {h,a}, ... },  // 72 partidos
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
      if (!hasScore(off) || !hasScore(pv)) return;
      const oh = +off.h, oa = +off.a, ph = +pv.h, pa = +pv.a;
      if (ph === oh && pa === oa) R.scores += P.exacto;
      else if (Math.sign(ph - pa) === Math.sign(oh - oa)) R.scores += P.resultado;
    });

    // Eliminatoria (conjuntos por ronda)
    inter(pk.r16, ok.r16).forEach(() => { R.octavos += P.octavos; });
    inter(pk.qf, ok.qf).forEach(() => { R.cuartos += P.cuartos; });
    inter(pk.sf, ok.sf).forEach(() => { R.semis += P.semis; });
    inter(pk.fin, ok.fin).forEach(() => { R.finals += P.final; });
    if (pk.champ && ok.champ && pk.champ === ok.champ) R.champ += P.campeon;
    if (pk.third && ok.third && pk.third === ok.third) R.third += P.tercer;

    R.total = R.groupPos + R.thirds + R.scores + R.octavos + R.cuartos + R.semis + R.finals + R.champ + R.third;
    // agregados para la tabla
    R.grupos = R.groupPos + R.thirds;
    R.elim = R.octavos + R.cuartos + R.semis + R.finals;
    return R;
  }

  function playerHasPredictions(pred) {
    if (!pred) return false;
    const g = pred.groups || {}, s = pred.scores || {}, k = pred.ko || {};
    if (Object.values(g).some((x) => x && (x.first || x.second || x.third))) return true;
    if (Object.values(s).some((x) => hasScore(x))) return true;
    if ((pred.thirds || []).length) return true;
    if (k.champ || (k.fin || []).length || (k.qf || []).length || (k.r16 || []).length) return true;
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

  function standings(allPreds, official) {
    const rows = QM.PLAYERS.map((pl) => ({
      player: pl,
      score: scorePlayer(allPreds[pl.id], official),
      played: playerHasPredictions(allPreds[pl.id]),
    }));
    rows.sort((a, b) => b.score.total - a.score.total || (b.played - a.played) || a.player.name.localeCompare(b.player.name));
    let rank = 0, prev = null;
    rows.forEach((r, i) => { if (prev === null || r.score.total !== prev) { rank = i + 1; prev = r.score.total; } r.rank = rank; });
    return rows;
  }

  window.QMScore = { scorePlayer, standings, hasOfficialResults, playerHasPredictions, hasScore };
})();
