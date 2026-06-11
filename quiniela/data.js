/* Quiniela Mundial 2026 — Grupo Hogar
   Datos oficiales: sorteo FIFA 5 dic 2025. 48 equipos, 12 grupos (A–L). */
(function () {
  // Equipos por código: nombre en español + bandera (emoji, con código como respaldo)
  const T = {
    MEX: { name: "México",        flag: "🇲🇽", code: "MEX" },
    RSA: { name: "Sudáfrica",     flag: "🇿🇦", code: "RSA" },
    KOR: { name: "Corea del Sur", flag: "🇰🇷", code: "KOR" },
    CZE: { name: "Chequia",       flag: "🇨🇿", code: "CZE" },

    CAN: { name: "Canadá",            flag: "🇨🇦", code: "CAN" },
    BIH: { name: "Bosnia y Herz.",    flag: "🇧🇦", code: "BIH" },
    QAT: { name: "Catar",             flag: "🇶🇦", code: "QAT" },
    SUI: { name: "Suiza",             flag: "🇨🇭", code: "SUI" },

    BRA: { name: "Brasil",     flag: "🇧🇷", code: "BRA" },
    MAR: { name: "Marruecos",  flag: "🇲🇦", code: "MAR" },
    HAI: { name: "Haití",      flag: "🇭🇹", code: "HAI" },
    SCO: { name: "Escocia",    flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", code: "SCO" },

    USA: { name: "Estados Unidos", flag: "🇺🇸", code: "USA" },
    PAR: { name: "Paraguay",       flag: "🇵🇾", code: "PAR" },
    AUS: { name: "Australia",      flag: "🇦🇺", code: "AUS" },
    TUR: { name: "Turquía",        flag: "🇹🇷", code: "TUR" },

    GER: { name: "Alemania",        flag: "🇩🇪", code: "GER" },
    CUW: { name: "Curazao",         flag: "🇨🇼", code: "CUW" },
    CIV: { name: "Costa de Marfil", flag: "🇨🇮", code: "CIV" },
    ECU: { name: "Ecuador",         flag: "🇪🇨", code: "ECU" },

    NED: { name: "Países Bajos", flag: "🇳🇱", code: "NED" },
    JPN: { name: "Japón",        flag: "🇯🇵", code: "JPN" },
    SWE: { name: "Suecia",       flag: "🇸🇪", code: "SWE" },
    TUN: { name: "Túnez",        flag: "🇹🇳", code: "TUN" },

    BEL: { name: "Bélgica",       flag: "🇧🇪", code: "BEL" },
    EGY: { name: "Egipto",        flag: "🇪🇬", code: "EGY" },
    IRN: { name: "Irán",          flag: "🇮🇷", code: "IRN" },
    NZL: { name: "Nueva Zelanda", flag: "🇳🇿", code: "NZL" },

    ESP: { name: "España",          flag: "🇪🇸", code: "ESP" },
    CPV: { name: "Cabo Verde",      flag: "🇨🇻", code: "CPV" },
    KSA: { name: "Arabia Saudita",  flag: "🇸🇦", code: "KSA" },
    URU: { name: "Uruguay",         flag: "🇺🇾", code: "URU" },

    FRA: { name: "Francia",  flag: "🇫🇷", code: "FRA" },
    SEN: { name: "Senegal",  flag: "🇸🇳", code: "SEN" },
    IRQ: { name: "Irak",     flag: "🇮🇶", code: "IRQ" },
    NOR: { name: "Noruega",  flag: "🇳🇴", code: "NOR" },

    ARG: { name: "Argentina", flag: "🇦🇷", code: "ARG" },
    ALG: { name: "Argelia",   flag: "🇩🇿", code: "ALG" },
    AUT: { name: "Austria",   flag: "🇦🇹", code: "AUT" },
    JOR: { name: "Jordania",  flag: "🇯🇴", code: "JOR" },

    POR: { name: "Portugal",    flag: "🇵🇹", code: "POR" },
    COD: { name: "RD Congo",    flag: "🇨🇩", code: "COD" },
    UZB: { name: "Uzbekistán",  flag: "🇺🇿", code: "UZB" },
    COL: { name: "Colombia",    flag: "🇨🇴", code: "COL" },

    ENG: { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", code: "ENG" },
    CRO: { name: "Croacia",    flag: "🇭🇷", code: "CRO" },
    GHA: { name: "Ghana",      flag: "🇬🇭", code: "GHA" },
    PAN: { name: "Panamá",     flag: "🇵🇦", code: "PAN" },
  };

  // Color vibrante por grupo (oklch, misma familia de croma/luz, variando matiz)
  const GROUPS = [
    { id: "A", color: "oklch(0.63 0.20 25)",  teams: ["MEX", "RSA", "KOR", "CZE"] },
    { id: "B", color: "oklch(0.68 0.18 55)",  teams: ["CAN", "BIH", "QAT", "SUI"] },
    { id: "C", color: "oklch(0.78 0.16 92)",  teams: ["BRA", "MAR", "HAI", "SCO"] },
    { id: "D", color: "oklch(0.72 0.18 132)", teams: ["USA", "PAR", "AUS", "TUR"] },
    { id: "E", color: "oklch(0.64 0.16 158)", teams: ["GER", "CUW", "CIV", "ECU"] },
    { id: "F", color: "oklch(0.70 0.12 200)", teams: ["NED", "JPN", "SWE", "TUN"] },
    { id: "G", color: "oklch(0.64 0.15 233)", teams: ["BEL", "EGY", "IRN", "NZL"] },
    { id: "H", color: "oklch(0.56 0.18 268)", teams: ["ESP", "CPV", "KSA", "URU"] },
    { id: "I", color: "oklch(0.53 0.20 298)", teams: ["FRA", "SEN", "IRQ", "NOR"] },
    { id: "J", color: "oklch(0.56 0.20 328)", teams: ["ARG", "ALG", "AUT", "JOR"] },
    { id: "K", color: "oklch(0.60 0.21 352)", teams: ["POR", "COD", "UZB", "COL"] },
    { id: "L", color: "oklch(0.62 0.19 12)",  teams: ["ENG", "CRO", "GHA", "PAN"] },
  ];

  // Los 72 partidos de la fase de grupos (round-robin de cada grupo de 4).
  // 3 jornadas × 2 partidos × 12 grupos = 72.
  function roundRobin(t) {
    const [a, b, c, d] = t;
    return [
      { jor: 1, home: a, away: b }, { jor: 1, home: c, away: d },
      { jor: 2, home: a, away: c }, { jor: 2, home: d, away: b },
      { jor: 3, home: d, away: a }, { jor: 3, home: b, away: c },
    ];
  }
  const MATCHES = [];
  GROUPS.forEach((g) => {
    roundRobin(g.teams).forEach((m, i) => {
      MATCHES.push({ id: g.id + "-" + i, group: g.id, jor: m.jor, home: m.home, away: m.away });
    });
  });

  // Jugadores de la porra familiar (color de avatar por persona)
  const PLAYERS = [
    { id: "abu",   name: "Abu George",  color: "oklch(0.63 0.20 25)" },
    { id: "juli",  name: "Julina",      color: "oklch(0.68 0.18 55)" },
    { id: "jorge", name: "Jorge",       color: "oklch(0.72 0.18 132)" },
    { id: "majo",  name: "Maria José",  color: "oklch(0.64 0.16 158)" },
    { id: "mia",   name: "Mia",         color: "oklch(0.70 0.12 200)" },
    { id: "iker",  name: "Iker",        color: "oklch(0.64 0.15 233)" },
    { id: "guille",name: "Guille",      color: "oklch(0.56 0.18 268)" },
    { id: "dani",  name: "Dani",        color: "oklch(0.53 0.20 298)" },
    { id: "este",  name: "Esteban",     color: "oklch(0.62 0.19 12)" },
  ];

  // Valores de puntos (usados por el motor de puntuación y la tabla de reglas)
  const POINTS = {
    clasificado: 2,   // cada equipo que clasifica directo (1.º o 2.º) acertado
    lider: 1,         // acertar quién gana el grupo (1.º exacto)
    tercerGrupo: 1,   // acertar el 3.º de cada grupo
    mejorTercero: 2,  // cada "mejor tercero" que avanza, acertado
    resultado: 1,     // resultado correcto de un partido (gana/empate)
    exacto: 3,        // marcador exacto (total, ya incluye el de resultado)
    octavos: 2,       // cada equipo que llega a Octavos
    cuartos: 3,       // cada equipo que llega a Cuartos
    semis: 5,         // cada semifinalista
    final: 8,         // cada finalista
    campeon: 12,      // campeón del mundo
    tercer: 4,        // tercer lugar
  };

  // Reglas de puntuación agrupadas por sección (para la pestaña Reglas)
  const RULES = [
    { section: "Fase de grupos", items: [
      { pts: "+2", label: "Cada equipo que clasifica (1.º o 2.º) acertado" },
      { pts: "+1", label: "Acertar al líder del grupo (1.º)" },
      { pts: "+1", label: "Acertar el 3.º de cada grupo" },
      { pts: "+2", label: "Cada «mejor tercero» que avanza, acertado" },
    ]},
    { section: "Marcadores · 72 partidos", items: [
      { pts: "+1", label: "Resultado correcto (gana o empata)" },
      { pts: "+3", label: "Marcador exacto (en vez del +1)" },
    ]},
    { section: "Eliminatoria", items: [
      { pts: "+2", label: "Cada equipo en Octavos de Final" },
      { pts: "+3", label: "Cada equipo en Cuartos de Final" },
      { pts: "+5", label: "Cada semifinalista" },
      { pts: "+8", label: "Cada finalista" },
      { pts: "+12", label: "Campeón del Mundo" },
      { pts: "+4", label: "Tercer lugar" },
    ]},
  ];

  // Configuración por defecto (se puede sobreescribir desde la nube)
  const CONFIG = {
    lockAt: "2026-06-11T19:00:00Z",  // arranque del Mundial (inauguración)
    locked: null,                    // null = automático por fecha; true/false = forzado por admin
  };

  const META = {
    title: "Quiniela Mundial 2026",
    brand: "Grupo Hogar",
    sub: "Canadá · México · EE.UU.   ·   11 jun – 19 jul, 2026",
    finalInfo: "La Gran Final · 19 jul · MetLife, Nueva Jersey",
  };

  // Capacidades de cada ronda eliminatoria (cuántos equipos avanzan)
  const KO_CAPS = { r16: 16, qf: 8, sf: 4, fin: 2 };

  window.QM = { T, GROUPS, MATCHES, PLAYERS, RULES, POINTS, KO_CAPS, META, CONFIG };
})();
