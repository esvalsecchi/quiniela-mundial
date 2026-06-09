/* ============================================================
   Quiniela Mundial 2026 — Sincronización de resultados
   Fuente principal: ESPN (gratis, sin clave, cubre WC 2026)
   Fuente alternativa: api-sports.io (si KEY configurada y plan Pro+)
   ============================================================ */
(function () {

  /* ── ESPN (sin clave, gratis) ──────────────────────────────── */
  var ESPN_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard"
    + "?dates=20260611-20260702&limit=100";

  async function fetchFromESPN() {
    var res = await fetch(ESPN_URL);
    if (!res.ok) throw new Error("ESPN HTTP " + res.status);
    var data = await res.json();
    return data.events || [];
  }

  function parseESPN(events) {
    var lookup = {};
    window.QM.MATCHES.forEach(function (m) { lookup[m.home + "-" + m.away] = m.id; });

    var scores = {}, skipped = [];
    events.forEach(function (e) {
      var comp = (e.competitions || [])[0];
      if (!comp) return;
      var st = comp.status && comp.status.type;
      // Solo partidos terminados
      if (!st || (st.name !== "STATUS_FULL_TIME" && !st.completed)) return;

      var teams = comp.competitors || [];
      var home = teams.find(function (t) { return t.homeAway === "home"; });
      var away = teams.find(function (t) { return t.homeAway === "away"; });
      if (!home || !away) return;

      var hCode = home.team && home.team.abbreviation;
      var aCode = away.team && away.team.abbreviation;
      if (!hCode || !aCode) return;

      // ESPN ya usa los mismos códigos que nosotros (MEX, BRA, ARG, etc.)
      var mid = lookup[hCode + "-" + aCode];
      if (!mid) { skipped.push(hCode + " vs " + aCode); return; }

      var hScore = parseInt(home.score, 10);
      var aScore = parseInt(away.score, 10);
      if (!isNaN(hScore) && !isNaN(aScore)) {
        scores[mid] = { h: hScore, a: aScore };
      }
    });
    if (skipped.length) console.warn("QMAPI partidos no mapeados:", skipped);
    return scores;
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

  window.QMAPI = { fetchGroupFixtures, parseScores, testKey, hasKey };
})();
