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
  // Horarios oficiales FIFA convertidos a UTC. El pronóstico cierra al inicio del partido.
  const MATCH_SCHEDULE = {
    "A-0": { matchNo: 1, kickoffAt: "2026-06-11T19:00:00Z", lockAt: "2026-06-11T17:00:00Z" },
    "A-1": { matchNo: 2, kickoffAt: "2026-06-12T02:00:00Z", lockAt: "2026-06-12T00:00:00Z" },
    "A-2": { matchNo: 28, kickoffAt: "2026-06-19T01:00:00Z", lockAt: "2026-06-18T23:00:00Z" },
    "A-3": { matchNo: 25, kickoffAt: "2026-06-18T16:00:00Z", lockAt: "2026-06-18T14:00:00Z" },
    "A-4": { matchNo: 53, kickoffAt: "2026-06-25T01:00:00Z", lockAt: "2026-06-24T23:00:00Z" },
    "A-5": { matchNo: 54, kickoffAt: "2026-06-25T01:00:00Z", lockAt: "2026-06-24T23:00:00Z" },
    "B-0": { matchNo: 3, kickoffAt: "2026-06-12T19:00:00Z", lockAt: "2026-06-12T17:00:00Z" },
    "B-1": { matchNo: 8, kickoffAt: "2026-06-13T19:00:00Z", lockAt: "2026-06-13T17:00:00Z" },
    "B-2": { matchNo: 27, kickoffAt: "2026-06-18T22:00:00Z", lockAt: "2026-06-18T20:00:00Z" },
    "B-3": { matchNo: 26, kickoffAt: "2026-06-18T19:00:00Z", lockAt: "2026-06-18T17:00:00Z" },
    "B-4": { matchNo: 51, kickoffAt: "2026-06-24T19:00:00Z", lockAt: "2026-06-24T17:00:00Z" },
    "B-5": { matchNo: 52, kickoffAt: "2026-06-24T19:00:00Z", lockAt: "2026-06-24T17:00:00Z" },
    "C-0": { matchNo: 7, kickoffAt: "2026-06-13T22:00:00Z", lockAt: "2026-06-13T20:00:00Z" },
    "C-1": { matchNo: 5, kickoffAt: "2026-06-14T01:00:00Z", lockAt: "2026-06-13T23:00:00Z" },
    "C-2": { matchNo: 29, kickoffAt: "2026-06-20T00:30:00Z", lockAt: "2026-06-19T22:30:00Z" },
    "C-3": { matchNo: 30, kickoffAt: "2026-06-19T22:00:00Z", lockAt: "2026-06-19T20:00:00Z" },
    "C-4": { matchNo: 49, kickoffAt: "2026-06-24T22:00:00Z", lockAt: "2026-06-24T20:00:00Z" },
    "C-5": { matchNo: 50, kickoffAt: "2026-06-24T22:00:00Z", lockAt: "2026-06-24T20:00:00Z" },
    "D-0": { matchNo: 4, kickoffAt: "2026-06-13T01:00:00Z", lockAt: "2026-06-12T23:00:00Z" },
    "D-1": { matchNo: 6, kickoffAt: "2026-06-13T04:00:00Z", lockAt: "2026-06-13T02:00:00Z" },
    "D-2": { matchNo: 32, kickoffAt: "2026-06-19T19:00:00Z", lockAt: "2026-06-19T17:00:00Z" },
    "D-3": { matchNo: 31, kickoffAt: "2026-06-20T03:00:00Z", lockAt: "2026-06-20T01:00:00Z" },
    "D-4": { matchNo: 59, kickoffAt: "2026-06-26T02:00:00Z", lockAt: "2026-06-26T00:00:00Z" },
    "D-5": { matchNo: 60, kickoffAt: "2026-06-26T02:00:00Z", lockAt: "2026-06-26T00:00:00Z" },
    "E-0": { matchNo: 10, kickoffAt: "2026-06-14T17:00:00Z", lockAt: "2026-06-14T15:00:00Z" },
    "E-1": { matchNo: 9, kickoffAt: "2026-06-14T23:00:00Z", lockAt: "2026-06-14T21:00:00Z" },
    "E-2": { matchNo: 33, kickoffAt: "2026-06-20T20:00:00Z", lockAt: "2026-06-20T18:00:00Z" },
    "E-3": { matchNo: 34, kickoffAt: "2026-06-21T00:00:00Z", lockAt: "2026-06-20T22:00:00Z" },
    "E-4": { matchNo: 56, kickoffAt: "2026-06-25T20:00:00Z", lockAt: "2026-06-25T18:00:00Z" },
    "E-5": { matchNo: 55, kickoffAt: "2026-06-25T20:00:00Z", lockAt: "2026-06-25T18:00:00Z" },
    "F-0": { matchNo: 11, kickoffAt: "2026-06-14T20:00:00Z", lockAt: "2026-06-14T18:00:00Z" },
    "F-1": { matchNo: 12, kickoffAt: "2026-06-15T02:00:00Z", lockAt: "2026-06-15T00:00:00Z" },
    "F-2": { matchNo: 35, kickoffAt: "2026-06-20T17:00:00Z", lockAt: "2026-06-20T15:00:00Z" },
    "F-3": { matchNo: 36, kickoffAt: "2026-06-21T04:00:00Z", lockAt: "2026-06-21T02:00:00Z" },
    "F-4": { matchNo: 58, kickoffAt: "2026-06-25T23:00:00Z", lockAt: "2026-06-25T21:00:00Z" },
    "F-5": { matchNo: 57, kickoffAt: "2026-06-25T23:00:00Z", lockAt: "2026-06-25T21:00:00Z" },
    "G-0": { matchNo: 16, kickoffAt: "2026-06-15T19:00:00Z", lockAt: "2026-06-15T17:00:00Z" },
    "G-1": { matchNo: 15, kickoffAt: "2026-06-16T01:00:00Z", lockAt: "2026-06-15T23:00:00Z" },
    "G-2": { matchNo: 39, kickoffAt: "2026-06-21T19:00:00Z", lockAt: "2026-06-21T17:00:00Z" },
    "G-3": { matchNo: 40, kickoffAt: "2026-06-22T01:00:00Z", lockAt: "2026-06-21T23:00:00Z" },
    "G-4": { matchNo: 64, kickoffAt: "2026-06-27T03:00:00Z", lockAt: "2026-06-27T01:00:00Z" },
    "G-5": { matchNo: 63, kickoffAt: "2026-06-27T03:00:00Z", lockAt: "2026-06-27T01:00:00Z" },
    "H-0": { matchNo: 14, kickoffAt: "2026-06-15T16:00:00Z", lockAt: "2026-06-15T14:00:00Z" },
    "H-1": { matchNo: 13, kickoffAt: "2026-06-15T22:00:00Z", lockAt: "2026-06-15T20:00:00Z" },
    "H-2": { matchNo: 38, kickoffAt: "2026-06-21T16:00:00Z", lockAt: "2026-06-21T14:00:00Z" },
    "H-3": { matchNo: 37, kickoffAt: "2026-06-21T22:00:00Z", lockAt: "2026-06-21T20:00:00Z" },
    "H-4": { matchNo: 66, kickoffAt: "2026-06-27T00:00:00Z", lockAt: "2026-06-26T22:00:00Z" },
    "H-5": { matchNo: 65, kickoffAt: "2026-06-27T00:00:00Z", lockAt: "2026-06-26T22:00:00Z" },
    "I-0": { matchNo: 17, kickoffAt: "2026-06-16T19:00:00Z", lockAt: "2026-06-16T17:00:00Z" },
    "I-1": { matchNo: 18, kickoffAt: "2026-06-16T22:00:00Z", lockAt: "2026-06-16T20:00:00Z" },
    "I-2": { matchNo: 42, kickoffAt: "2026-06-22T21:00:00Z", lockAt: "2026-06-22T19:00:00Z" },
    "I-3": { matchNo: 41, kickoffAt: "2026-06-23T00:00:00Z", lockAt: "2026-06-22T22:00:00Z" },
    "I-4": { matchNo: 61, kickoffAt: "2026-06-26T19:00:00Z", lockAt: "2026-06-26T17:00:00Z" },
    "I-5": { matchNo: 62, kickoffAt: "2026-06-26T19:00:00Z", lockAt: "2026-06-26T17:00:00Z" },
    "J-0": { matchNo: 19, kickoffAt: "2026-06-17T01:00:00Z", lockAt: "2026-06-16T23:00:00Z" },
    "J-1": { matchNo: 20, kickoffAt: "2026-06-16T04:00:00Z", lockAt: "2026-06-16T02:00:00Z" },
    "J-2": { matchNo: 43, kickoffAt: "2026-06-22T17:00:00Z", lockAt: "2026-06-22T15:00:00Z" },
    "J-3": { matchNo: 44, kickoffAt: "2026-06-23T03:00:00Z", lockAt: "2026-06-23T01:00:00Z" },
    "J-4": { matchNo: 70, kickoffAt: "2026-06-28T02:00:00Z", lockAt: "2026-06-28T00:00:00Z" },
    "J-5": { matchNo: 69, kickoffAt: "2026-06-28T02:00:00Z", lockAt: "2026-06-28T00:00:00Z" },
    "K-0": { matchNo: 23, kickoffAt: "2026-06-17T17:00:00Z", lockAt: "2026-06-17T15:00:00Z" },
    "K-1": { matchNo: 24, kickoffAt: "2026-06-18T02:00:00Z", lockAt: "2026-06-18T00:00:00Z" },
    "K-2": { matchNo: 47, kickoffAt: "2026-06-23T17:00:00Z", lockAt: "2026-06-23T15:00:00Z" },
    "K-3": { matchNo: 48, kickoffAt: "2026-06-24T02:00:00Z", lockAt: "2026-06-24T00:00:00Z" },
    "K-4": { matchNo: 71, kickoffAt: "2026-06-27T23:30:00Z", lockAt: "2026-06-27T21:30:00Z" },
    "K-5": { matchNo: 72, kickoffAt: "2026-06-27T23:30:00Z", lockAt: "2026-06-27T21:30:00Z" },
    "L-0": { matchNo: 22, kickoffAt: "2026-06-17T20:00:00Z", lockAt: "2026-06-17T18:00:00Z" },
    "L-1": { matchNo: 21, kickoffAt: "2026-06-17T23:00:00Z", lockAt: "2026-06-17T21:00:00Z" },
    "L-2": { matchNo: 45, kickoffAt: "2026-06-23T20:00:00Z", lockAt: "2026-06-23T18:00:00Z" },
    "L-3": { matchNo: 46, kickoffAt: "2026-06-23T23:00:00Z", lockAt: "2026-06-23T21:00:00Z" },
    "L-4": { matchNo: 67, kickoffAt: "2026-06-27T21:00:00Z", lockAt: "2026-06-27T19:00:00Z" },
    "L-5": { matchNo: 68, kickoffAt: "2026-06-27T21:00:00Z", lockAt: "2026-06-27T19:00:00Z" },
  };
  MATCHES.forEach((m) => Object.assign(m, MATCH_SCHEDULE[m.id] || {}));

  // Jugadores de la porra familiar original (se usa como grupo inicial "hogar").
  // Los grupos nuevos crean su propia lista de jugadores desde la app.
  const DEFAULT_PLAYERS = [
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
  const PLAYERS = DEFAULT_PLAYERS;
  const PLAYER_COLORS = DEFAULT_PLAYERS.map((p) => p.color);

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

  // Horarios de eliminatoria convertidos a UTC, ordenados igual que las tarjetas del bracket.
  const KO_SCHEDULE = {
    r16: [
      { matchNo: 73, kickoffAt: "2026-06-28T19:00:00Z" },
      { matchNo: 74, kickoffAt: "2026-06-29T17:00:00Z" },
      { matchNo: 75, kickoffAt: "2026-06-29T20:30:00Z" },
      { matchNo: 76, kickoffAt: "2026-06-30T01:00:00Z" },
      { matchNo: 77, kickoffAt: "2026-06-30T17:00:00Z" },
      { matchNo: 78, kickoffAt: "2026-06-30T21:00:00Z" },
      { matchNo: 79, kickoffAt: "2026-07-01T01:00:00Z" },
      { matchNo: 80, kickoffAt: "2026-07-01T16:00:00Z" },
      { matchNo: 81, kickoffAt: "2026-07-01T20:00:00Z" },
      { matchNo: 82, kickoffAt: "2026-07-02T00:00:00Z" },
      { matchNo: 83, kickoffAt: "2026-07-02T19:00:00Z" },
      { matchNo: 84, kickoffAt: "2026-07-02T23:00:00Z" },
      { matchNo: 85, kickoffAt: "2026-07-03T03:00:00Z" },
      { matchNo: 86, kickoffAt: "2026-07-03T18:00:00Z" },
      { matchNo: 87, kickoffAt: "2026-07-03T22:00:00Z" },
      { matchNo: 88, kickoffAt: "2026-07-04T01:30:00Z" },
    ],
    qf: [
      { matchNo: 89, kickoffAt: "2026-07-04T17:00:00Z" },
      { matchNo: 90, kickoffAt: "2026-07-04T21:00:00Z" },
      { matchNo: 91, kickoffAt: "2026-07-05T20:00:00Z" },
      { matchNo: 92, kickoffAt: "2026-07-06T00:00:00Z" },
      { matchNo: 93, kickoffAt: "2026-07-06T19:00:00Z" },
      { matchNo: 94, kickoffAt: "2026-07-07T00:00:00Z" },
      { matchNo: 95, kickoffAt: "2026-07-07T16:00:00Z" },
      { matchNo: 96, kickoffAt: "2026-07-07T20:00:00Z" },
    ],
    sf: [
      { matchNo: 97, kickoffAt: "2026-07-09T20:00:00Z" },
      { matchNo: 98, kickoffAt: "2026-07-10T19:00:00Z" },
      { matchNo: 99, kickoffAt: "2026-07-11T21:00:00Z" },
      { matchNo: 100, kickoffAt: "2026-07-12T01:00:00Z" },
    ],
    semis: [
      { matchNo: 101, kickoffAt: "2026-07-14T19:00:00Z" },
      { matchNo: 102, kickoffAt: "2026-07-15T19:00:00Z" },
    ],
    third: { matchNo: 103, kickoffAt: "2026-07-18T21:00:00Z" },
    fin: { matchNo: 104, kickoffAt: "2026-07-19T19:00:00Z" },
  };

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

  const DEFAULT_GROUP_ID = "hogar";

  window.QM = {
    T, GROUPS, MATCHES, PLAYERS, DEFAULT_PLAYERS, PLAYER_COLORS,
    RULES, POINTS, KO_CAPS, KO_SCHEDULE, META, CONFIG, DEFAULT_GROUP_ID,
  };
})();
