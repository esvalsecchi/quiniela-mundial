/* Quiniela Mundial 2026 — motor de puntuación
   Compara los pronósticos de cada jugador contra los resultados oficiales. */
(function () {
  const QM = window.QM;

  function hasScore(o) {
    return o && o.h !== undefined && o.h !== "" && o.h !== null && o.a !== undefined && o.a !== "" && o.a !== null;
  }

  // Devuelve { groups, winners, scores, semis, finals, champ, third, total, anyData }
  function scorePlayer(pred, official) {
    const R = { groups: 0, winners: 0, scores: 0, semis: 0, finals: 0, champ: 0, third: 0 };
    pred = pred || {};
    official = official || {};
    const pg = pred.groups || {}, og = official.groups || {};
    const ps = pred.scores || {}, os = official.scores || {};
    const pb = pred.bracket || {}, ob = official.bracket || {};

    // Grupos: +3 por equipo clasificado acertado; +2 por ganador de grupo acertado
    QM.GROUPS.forEach((g) => {
      const off = og[g.id];
      if (!off || !(off.first || off.second)) return;
      const offQual = [off.first, off.second].filter(Boolean);
      const pv = pg[g.id] || {};
      [pv.first, pv.second].filter(Boolean).forEach((code) => {
        if (offQual.includes(code)) R.groups += 3;
      });
      if (pv.first && off.first && pv.first === off.first) R.winners += 2;
    });

    // Marcadores: +5 exacto, o +2 resultado correcto
    QM.KEY_MATCHES.forEach((m) => {
      const off = os[m.id], pv = ps[m.id];
      if (!hasScore(off) || !hasScore(pv)) return;
      const oh = +off.h, oa = +off.a, ph = +pv.h, pa = +pv.a;
      if (ph === oh && pa === oa) R.scores += 5;
      else if (Math.sign(ph - pa) === Math.sign(oh - oa)) R.scores += 2;
    });

    // Eliminatoria
    const offSemis = (ob.sf || []).filter(Boolean);
    (pb.sf || []).filter(Boolean).forEach((c) => { if (offSemis.includes(c)) R.semis += 5; });
    const offFin = (ob.fin || []).filter(Boolean);
    (pb.fin || []).filter(Boolean).forEach((c) => { if (offFin.includes(c)) R.finals += 8; });
    if (pb.champ && ob.champ && pb.champ === ob.champ) R.champ += 12;
    if (pb.third && ob.third && pb.third === ob.third) R.third += 4;

    R.total = R.groups + R.winners + R.scores + R.semis + R.finals + R.champ + R.third;
    return R;
  }

  // ¿El jugador tiene algún pronóstico cargado?
  function playerHasPredictions(pred) {
    if (!pred) return false;
    const g = pred.groups || {}, s = pred.scores || {}, b = pred.bracket || {};
    if (Object.values(g).some((x) => x && (x.first || x.second))) return true;
    if (Object.values(s).some((x) => hasScore(x))) return true;
    if (b.champ || (b.fin || []).some(Boolean) || (b.sf || []).some(Boolean) || (b.qf || []).some(Boolean)) return true;
    return false;
  }

  // ¿Hay algún resultado oficial cargado?
  function hasOfficialResults(official) {
    if (!official) return false;
    const g = official.groups || {}, s = official.scores || {}, b = official.bracket || {};
    if (Object.values(g).some((x) => x && (x.first || x.second))) return true;
    if (Object.values(s).some((x) => hasScore(x))) return true;
    if (b.champ || (b.fin || []).some(Boolean) || (b.sf || []).some(Boolean)) return true;
    return false;
  }

  // Tabla ordenada de todos los jugadores
  function standings(allPreds, official) {
    const rows = QM.PLAYERS.map((pl) => {
      const pred = allPreds[pl.id];
      return {
        player: pl,
        score: scorePlayer(pred, official),
        played: playerHasPredictions(pred),
      };
    });
    rows.sort((a, b) => b.score.total - a.score.total || (b.played - a.played) || a.player.name.localeCompare(b.player.name));
    let rank = 0, prev = null;
    rows.forEach((r, i) => {
      if (prev === null || r.score.total !== prev) { rank = i + 1; prev = r.score.total; }
      r.rank = rank;
    });
    return rows;
  }

  window.QMScore = { scorePlayer, standings, hasOfficialResults, playerHasPredictions };
})();
