/* ============================================================
   Quiniela Mundial 2026 — Sincronización de resultados
   Fuente principal: ESPN (gratis, sin clave, cubre WC 2026)
   Fuente alternativa: api-sports.io (si KEY configurada y plan Pro+)
   ============================================================ */
(function () {

  /* ── ESPN (sin clave, gratis) ──────────────────────────────── */
  var ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
    + "?dates=20260611-20260702&limit=100";
  var ESPN_TOURNAMENT_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
    + "?dates=20260611-20260720&limit=200";
  var ESPN_STANDINGS_URL = "https://site.web.api.espn.com/apis/v2/sports/soccer/fifa.world/standings"
    + "?region=us&lang=en&contentorigin=espn&type=0&level=3&sort=rank:asc";

  function fetchJSON(url) {
    return fetch(url).then(function(res) {
      if (!res.ok) throw new Error("ESPN HTTP " + res.status);
      return res.json();
    });
  }

  async function fetchFromESPN() {
    var data = await fetchJSON(ESPN_URL);
    return data.events || [];
  }

  async function fetchTournamentFromESPN() {
    var data = await fetchJSON(ESPN_TOURNAMENT_URL);
    return data.events || [];
  }

  async function fetchStandingsFromESPN() {
    return fetchJSON(ESPN_STANDINGS_URL);
  }

  function teamCode(team) {
    if (!team) return null;
    var code = team.abbreviation || team.shortDisplayName || team.name;
    var CODE_MAP = {
      "Bosnia-Herzegovina": "BIH",
      "Bosnia and Herzegovina": "BIH",
      "Congo DR": "COD",
      "DR Congo": "COD",
      "Cape Verde": "CPV",
      "Ivory Coast": "CIV",
      "Côte d'Ivoire": "CIV",
      "Cote d'Ivoire": "CIV",
      "Curacao": "CUW",
      "Curaçao": "CUW",
      "United States": "USA",
      "South Korea": "KOR",
      "Korea Republic": "KOR",
      "Türkiye": "TUR",
    };
    return CODE_MAP[code] || code;
  }

  function scoreDone(comp) {
    var st = comp && comp.status && comp.status.type;
    return !!(st && (st.name === "STATUS_FULL_TIME" || st.completed));
  }

  function parseESPN(events) {
    var lookup = {};
    window.QM.MATCHES.forEach(function (m) {
      lookup[m.home + "-" + m.away] = { id: m.id, reverse: false };
      lookup[m.away + "-" + m.home] = { id: m.id, reverse: true };
    });

    var scores = {}, skipped = [];
    events.forEach(function (e) {
      var comp = (e.competitions || [])[0];
      if (!comp) return;
      // Solo partidos terminados
      if (!scoreDone(comp)) return;

      var teams = comp.competitors || [];
      var home = teams.find(function (t) { return t.homeAway === "home"; });
      var away = teams.find(function (t) { return t.homeAway === "away"; });
      if (!home || !away) return;

      var hCode = teamCode(home.team);
      var aCode = teamCode(away.team);
      if (!hCode || !aCode) return;

      // ESPN ya usa los mismos códigos que nosotros (MEX, BRA, ARG, etc.)
      var hit = lookup[hCode + "-" + aCode];
      if (!hit) { skipped.push(hCode + " vs " + aCode); return; }

      var hScore = parseInt(home.score, 10);
      var aScore = parseInt(away.score, 10);
      if (!isNaN(hScore) && !isNaN(aScore)) {
        scores[hit.id] = hit.reverse ? { h: aScore, a: hScore } : { h: hScore, a: aScore };
      }
    });
    if (skipped.length) console.warn("QMAPI partidos no mapeados:", skipped);
    return scores;
  }

  function stat(entry, name) {
    var row = (entry.stats || []).find(function(s) { return s.name === name || s.type === name; });
    return row ? Number(row.value) : 0;
  }

  function rankOf(entry, fallback) {
    var row = (entry.stats || []).find(function(s) { return s.name === "rank" || s.type === "rank"; });
    return row ? Number(row.value) : fallback;
  }

  function parseStandings(data) {
    var groups = {};
    var thirdRows = [];

    (data.children || []).forEach(function(child) {
      var match = /Group\s+([A-L])/i.exec(child.name || "");
      if (!match) return;
      var gid = match[1].toUpperCase();
      var entries = ((child.standings && child.standings.entries) || []).slice().sort(function(a, b) {
        return rankOf(a, 99) - rankOf(b, 99);
      });
      if (entries.length < 3) return;
      var codes = entries.map(function(entry) { return teamCode(entry.team); });
      if (codes[0] && codes[1] && codes[2]) {
        groups[gid] = { first: codes[0], second: codes[1], third: codes[2] };
        thirdRows.push({
          group: gid,
          code: codes[2],
          points: stat(entries[2], "points"),
          gd: stat(entries[2], "pointDifferential"),
          gf: stat(entries[2], "pointsFor"),
        });
      }
    });

    thirdRows.sort(function(a, b) {
      return (b.points - a.points) || (b.gd - a.gd) || (b.gf - a.gf) || a.group.localeCompare(b.group);
    });

    return {
      groups: groups,
      thirds: thirdRows.slice(0, 8).map(function(row) { return row.code; }),
    };
  }

  function koRoundFromNote(note) {
    note = String(note || "").toLowerCase();
    if (note.indexOf("round of 32") >= 0) return "r16";
    if (note.indexOf("round of 16") >= 0) return "qf";
    if (note.indexOf("quarter") >= 0) return "sf";
    if (note.indexOf("semi") >= 0) return "semis";
    if (note.indexOf("third") >= 0) return "third";
    if (note.indexOf("final") >= 0 && note.indexOf("round") < 0) return "fin";
    return null;
  }

  function koEventRound(e) {
    var comp = (e.competitions || [])[0];
    return koRoundFromNote((comp && comp.altGameNote) || e.name || "");
  }

  function eventTeams(e) {
    var comp = (e.competitions || [])[0];
    var teams = comp ? (comp.competitors || []) : [];
    var home = teams.find(function(t) { return t.homeAway === "home"; });
    var away = teams.find(function(t) { return t.homeAway === "away"; });
    var hCode = home && teamCode(home.team);
    var aCode = away && teamCode(away.team);
    if (!hCode || !aCode || !window.QM.T[hCode] || !window.QM.T[aCode]) return null;
    return { home: hCode, away: aCode, homeRow: home, awayRow: away, comp: comp };
  }

  function parseR16PairsFromESPN(events) {
    return (events || [])
      .filter(function(e) { return koEventRound(e) === "r16"; })
      .sort(function(a, b) { return String(a.date || "").localeCompare(String(b.date || "")); })
      .map(eventTeams)
      .filter(Boolean)
      .slice(0, 16)
      .map(function(t) { return { home: t.home, away: t.away }; });
  }

  function parseKOScoresFromESPN(events) {
    var out = {};
    var rounds = ["r16", "qf", "sf", "semis"];
    rounds.forEach(function(r) { out[r] = []; });

    (events || []).slice().sort(function(a, b) {
      return String(a.date || "").localeCompare(String(b.date || ""));
    }).forEach(function(e) {
      var round = koEventRound(e);
      if (!round) return;
      var t = eventTeams(e);
      if (!t || !scoreDone(t.comp)) return;
      var hScore = parseInt(t.homeRow.score, 10);
      var aScore = parseInt(t.awayRow.score, 10);
      if (isNaN(hScore) || isNaN(aScore)) return;
      var score = { h: hScore, a: aScore };
      if (round === "fin" || round === "third") out[round] = score;
      else out[round].push(score);
    });

    Object.keys(out).forEach(function(k) {
      if (Array.isArray(out[k]) && !out[k].length) delete out[k];
    });
    return out;
  }

  function thirdsFromR16Pairs(groups, r16Pairs) {
    var thirdByCode = {};
    Object.keys(groups || {}).forEach(function(gid) {
      var code = groups[gid] && groups[gid].third;
      if (code) thirdByCode[code] = true;
    });
    return (r16Pairs || []).reduce(function(acc, pair) {
      [pair.home, pair.away].forEach(function(code) {
        if (thirdByCode[code] && !acc.includes(code)) acc.push(code);
      });
      return acc;
    }, []);
  }

  /* ── api-sports.io (requiere KEY con plan Pro o superior) ──── */
  function getApiKey() {
    var cfg = window.QM_API;
    if (cfg && cfg.KEY && cfg.KEY !== "TU_API_KEY") return cfg.KEY;
    return null;
  }

  async function fetchFromApiSports() {
    var key = getApiKey();
    if (!key) throw new Error("Sin API key configurada");
    var res = await fetch("https://v3.football.api-sports.io/fixtures?league=1&season=2026", {
      headers: { "x-apisports-key": key }
    });
    if (!res.ok) throw new Error("api-sports HTTP " + res.status);
    var data = await res.json();
    if (data.errors && Object.keys(data.errors).length) {
      var msg = Object.values(data.errors).join(", ");
      throw new Error(msg);
    }
    return data.response || [];
  }

  function parseApiSports(fixtures) {
    var lookup = {};
    window.QM.MATCHES.forEach(function (m) { lookup[m.home + "-" + m.away] = m.id; });
    var NAME_TO_CODE = {
      "Mexico":"MEX","South Africa":"RSA","Korea Republic":"KOR","South Korea":"KOR",
      "Czech Republic":"CZE","Czechia":"CZE","Canada":"CAN","Bosnia and Herzegovina":"BIH",
      "Bosnia":"BIH","Qatar":"QAT","Switzerland":"SUI","Brazil":"BRA","Morocco":"MAR",
      "Haiti":"HAI","Scotland":"SCO","United States":"USA","Paraguay":"PAR","Australia":"AUS",
      "Turkey":"TUR","Türkiye":"TUR","Germany":"GER","Curacao":"CUW","Curaçao":"CUW",
      "Ivory Coast":"CIV","Côte d'Ivoire":"CIV","Cote d'Ivoire":"CIV","Ecuador":"ECU",
      "Netherlands":"NED","Japan":"JPN","Sweden":"SWE","Tunisia":"TUN","Belgium":"BEL",
      "Egypt":"EGY","Iran":"IRN","New Zealand":"NZL","Spain":"ESP","Cape Verde":"CPV",
      "Saudi Arabia":"KSA","Uruguay":"URU","France":"FRA","Senegal":"SEN","Iraq":"IRQ",
      "Norway":"NOR","Argentina":"ARG","Algeria":"ALG","Austria":"AUT","Jordan":"JOR",
      "Portugal":"POR","DR Congo":"COD","Congo DR":"COD","Democratic Republic of Congo":"COD",
      "Uzbekistan":"UZB","Colombia":"COL","England":"ENG","Croatia":"CRO","Ghana":"GHA","Panama":"PAN",
    };
    var scores = {};
    fixtures.forEach(function (f) {
      var st = f.fixture && f.fixture.status && f.fixture.status.short;
      if (st !== "FT" && st !== "AET" && st !== "PEN") return;
      var hCode = NAME_TO_CODE[f.teams.home.name];
      var aCode = NAME_TO_CODE[f.teams.away.name];
      if (!hCode || !aCode) return;
      var mid = lookup[hCode + "-" + aCode];
      if (!mid || f.goals.home === null || f.goals.away === null) return;
      scores[mid] = { h: f.goals.home, a: f.goals.away };
    });
    return scores;
  }

  /* ── API pública ───────────────────────────────────────────── */

  // Función principal: intenta ESPN primero, api-sports como fallback
  async function fetchGroupFixtures() {
    try {
      var events = await fetchFromESPN();
      return { source: "espn", data: events };
    } catch (espnErr) {
      console.warn("ESPN falló:", espnErr.message, "— intentando api-sports...");
      var fixtures = await fetchFromApiSports();
      return { source: "apisports", data: fixtures };
    }
  }

  function parseScores(result) {
    if (result.source === "espn") return parseESPN(result.data);
    return parseApiSports(result.data);
  }

  async function fetchTournamentState() {
    var events;
    try {
      events = await fetchTournamentFromESPN();
    } catch (e) {
      console.warn("ESPN torneo falló:", e.message, "— usando sync básico de marcadores...");
      var fixtures = await fetchGroupFixtures();
      return {
        source: fixtures.source || "api",
        scores: parseScores(fixtures),
        groups: {},
        thirds: [],
        bracketPairs: {},
        koScores: {},
      };
    }
    var standings = {};
    try {
      standings = parseStandings(await fetchStandingsFromESPN());
    } catch (e) {
      console.warn("ESPN standings falló:", e.message);
      standings = {};
    }

    var r16Pairs = parseR16PairsFromESPN(events);
    var thirdsFromPairs = thirdsFromR16Pairs(standings.groups, r16Pairs);
    return {
      source: "espn",
      scores: parseESPN(events),
      groups: standings.groups || {},
      thirds: thirdsFromPairs.length ? thirdsFromPairs : (standings.thirds || []),
      bracketPairs: r16Pairs.length ? { r16: r16Pairs } : {},
      koScores: parseKOScoresFromESPN(events),
    };
  }

  async function testKey() {
    // Probar ESPN primero (siempre disponible)
    try {
      var res = await fetch(ESPN_URL);
      var data = await res.json();
      var total = (data.events || []).length;
      var done = (data.events || []).filter(function(e) {
        var comp = (e.competitions || [])[0];
        return comp && comp.status && comp.status.type && comp.status.type.completed;
      }).length;
      return { ok: true, msg: "ESPN OK · " + total + " partidos cargados · " + done + " terminados (gratis, sin clave)" };
    } catch (e) {
      return { ok: false, msg: "ESPN: " + e.message };
    }
  }

  // hasKey: ESPN siempre disponible
  function hasKey() { return true; }

  window.QMAPI = {
    fetchGroupFixtures,
    parseScores,
    fetchTournamentState,
    parseR16PairsFromESPN,
    parseKOScoresFromESPN,
    testKey,
    hasKey,
  };
})();
