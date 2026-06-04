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

  // Partidos estelares para marcador exacto
  const KEY_MATCHES = [
    { id: "m1", home: "MEX", away: "RSA", date: "11 jun", tag: "Inauguración · Estadio Azteca" },
    { id: "m2", home: "USA", away: "PAR", date: "12 jun", tag: "Grupo D · Los Ángeles" },
    { id: "m3", home: "BRA", away: "MAR", date: "13 jun", tag: "Grupo C · Nueva Jersey" },
    { id: "m4", home: "GER", away: "CIV", date: "14 jun", tag: "Grupo E · Filadelfia" },
    { id: "m5", home: "FRA", away: "SEN", date: "16 jun", tag: "Grupo I · Nueva Jersey" },
    { id: "m6", home: "ARG", away: "ALG", date: "16 jun", tag: "Grupo J · Kansas City" },
    { id: "m7", home: "ENG", away: "CRO", date: "17 jun", tag: "Grupo L · Dallas" },
    { id: "m8", home: "ESP", away: "URU", date: "21 jun", tag: "Grupo H · Miami" },
  ];

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
    { id: "yesi",  name: "Yesi",        color: "oklch(0.60 0.21 352)" },
    { id: "este",  name: "Esteban",     color: "oklch(0.62 0.19 12)" },
  ];

  // Reglas de puntuación (porra casera)
  const RULES = [
    { pts: "+3", label: "Equipo clasificado a eliminatorias" },
    { pts: "+2", label: "Acertar al ganador del grupo (1.º)" },
    { pts: "+5", label: "Marcador exacto de partido estelar" },
    { pts: "+2", label: "Acertar el resultado (gana / empate)" },
    { pts: "+5", label: "Cada semifinalista correcto" },
    { pts: "+8", label: "Cada finalista correcto" },
    { pts: "+12", label: "Acertar al Campeón del Mundo" },
    { pts: "+4", label: "Acertar el 3.er lugar" },
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

  window.QM = { T, GROUPS, KEY_MATCHES, PLAYERS, RULES, META, CONFIG };
})();
