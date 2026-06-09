/* ============================================================
   Quiniela Mundial 2026 — Sincronización de resultados
   API: api-sports.io / api-football.com (plan gratuito: 100 req/día)
   Registro: https://dashboard.api-football.com/register
   ============================================================ */
(function () {
  // Mapeo nombre de equipo (API) → código interno
  const NAME_TO_CODE = {
    // Grupo A
    "Mexico": "MEX", "South Africa": "RSA",
    "Korea Republic": "KOR", "South Korea": "KOR",
    "Czech Republic": "CZE", "Czechia": "CZE",
    // Grupo B
    "Canada": "CAN",
    "Bosnia": "BIH", "Bosnia and Herzegovina": "BIH",
    "Qatar": "QAT", "Switzerland": "SUI",
    // Grupo C
    "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
    // Grupo D
    "United States": "USA", "USA": "USA",
    "Paraguay": "PAR", "Australia": "AUS",
    "Turkey": "TUR", "Türkiye": "TUR",
    // Grupo E
    "Germany": "GER",
    "Curacao": "CUW", "Curaçao": "CUW",
    "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV", "Cote d'Ivoire": "CIV",
    "Ecuador": "ECU",
    // Grupo F
    "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
    // Grupo G
    "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
    // Grupo H
    "Spain": "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
    // Grupo I
    "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
    // Grupo J
    "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
    // Grupo K
    "Portugal": "POR",
    "DR Congo": "COD", "Congo DR": "COD", "Democratic Republic of Congo": "COD",
    "Uzbekistan": "UZB", "Colombia": "COL",
    // Grupo L
    "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
  };

  function getKey() {
    var cfg = window.QM_API;
    if (cfg && cfg.KEY && cfg.KEY !== "TU_API_KEY") return cfg.KEY;
    return null;
  }

  async function fetchGroupFixtures() {
    var key = getKey();
    if (!key) throw new Error("API key no configurada. Ponla en firebase-config.js en QM_API.KEY");
    var url = "https://v3.football.api-sports.io/fixtures?league=1&season=2026";
    var res = await fetch(url, { headers: { "x-apisports-key": key } });
    if (!res.ok) throw new Error("HTTP " + res.status + " — verifica que tu API key sea válida");
    var data = await res.json();
    if (data.errors) {
      var errs = typeof data.errors === "object" ? Object.values(data.errors) : [data.errors];
      if (errs.length && errs[0]) throw new Error(errs.join(", "));
    }
    return data.response || [];
  }

  // Filtra y convierte los fixtures terminados a { matchId: {h, a} }
  function parseScores(fixtures) {
    var lookup = {};
    window.QM.MATCHES.forEach(function (m) { lookup[m.home + "-" + m.away] = m.id; });

    var scores = {}, skipped = [];
    fixtures.forEach(function (f) {
      var st = f.fixture.status.short;
      // FT=full time, AET=after extra time, PEN=penalties
      if (st !== "FT" && st !== "AET" && st !== "PEN") return;
      var hName = f.teams.home.name;
      var aName = f.teams.away.name;
      var hCode = NAME_TO_CODE[hName];
      var aCode = NAME_TO_CODE[aName];
      if (!hCode || !aCode) { skipped.push(hName + " vs " + aName); return; }
      var mid = lookup[hCode + "-" + aCode];
      if (!mid) return; // eliminatoria u otro campeonato
      if (f.goals.home !== null && f.goals.away !== null) {
        scores[mid] = { h: f.goals.home, a: f.goals.away };
      }
    });
    if (skipped.length) console.warn("QMAPI equipos no reconocidos:", skipped);
    return scores;
  }

  // Verifica la API key (una llamada al endpoint de status)
  async function testKey() {
    var key = getKey();
    if (!key) return { ok: false, msg: "Sin API key" };
    try {
      var res = await fetch("https://v3.football.api-sports.io/status", {
        headers: { "x-apisports-key": key }
      });
      var data = await res.json();
      if (data.errors && Object.values(data.errors).length) return { ok: false, msg: JSON.stringify(data.errors) };
      var plan = data.response ? data.response.subscription : null;
      var remaining = data.response ? data.response.requests.current + "/" + data.response.requests.limit_day : "?";
      return { ok: true, msg: "OK · " + (plan ? plan.plan : "") + " · Requests hoy: " + remaining };
    } catch (e) {
      return { ok: false, msg: e.message };
    }
  }

  window.QMAPI = { fetchGroupFixtures, parseScores, testKey, hasKey: function () { return !!getKey(); } };
})();
