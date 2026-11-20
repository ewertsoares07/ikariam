// =====================================================================
// ÍCONES SVG — traço clássico grego, sem biblioteca externa.
// Cada ícone é desenhado num quadro 48×48. O traço usa a cor do texto
// (currentColor); os detalhes usam classes que o CSS pinta:
//   .a  = bronze cheio · .al = bronze translúcido · .f = fogo
//   .v  = vinho tinto  · .e  = enxofre            · .s = cheio na cor do traço
// Uso: icone('hoplita', { tam: 22 }) ou iconeUnidade('lancachamas').
// =====================================================================

const A = 'class="a" fill="#c9a24d"';
const AL = 'class="al" fill="#c9a24d" fill-opacity=".22"';
const F = 'class="f" fill="#e8742a" stroke="none"';
const V = 'class="v" fill="#8b1e3f"';
const E = 'class="e" fill="#e3c23a" fill-opacity=".35"';
const S = 'class="s" fill="currentColor" stroke="none"';

// Casco comum dos navios + linha d'água
const CASCO = `<path ${AL} d="M4 30 H44 L39 38 H9 Z"/><path d="M3 43 Q7 41 11 43 T19 43 T27 43 T35 43 T45 43" stroke-width="1.8"/>`;
const folha = (cx, cy, ang) => `<ellipse ${AL} cx="${cx}" cy="${cy}" rx="2.3" ry="4.6" transform="rotate(${ang} ${cx} ${cy})" stroke-width="1.6"/>`;

export const ICONES = {
  // ---------------- TERRESTRE ----------------
  hoplita: `<circle ${AL} cx="34" cy="31" r="10"/><circle cx="34" cy="31" r="5.2"/><path d="M31.6 34 L34 27.6 L36.4 34" stroke-width="2"/>
    <path ${AL} d="M6 21 C6 11 26 11 26 21 V33 L21 37 L19.5 31 H12.5 L11 37 L6 33 Z"/>
    <path d="M9 22 H23 M16 22 V29"/><path ${A} d="M5 14 Q15 2 28 9 L26 12 Q16 7 8 16 Z" stroke-width="1.8"/>`,
  gigante: `<rect ${AL} x="13" y="18" width="22" height="17" rx="3"/><rect x="18" y="9" width="12" height="9" rx="2"/><path d="M20.5 13.5 H27.5"/>
    <rect ${A} x="31" y="4" width="4" height="8" rx="1" stroke-width="1.8"/><path d="M38 6 q3 -2 2 -5" stroke-width="1.6"/>
    <circle ${A} cx="24" cy="26.5" r="3.6" stroke-width="1.8"/><path d="M13 22 L7 30 V35 M35 22 L41 30 V35 M18 35 V42 M30 35 V42 M14.5 43 H21.5 M26.5 43 H33.5"/>`,
  espadachim: `<path ${AL} d="M15 31 L34 9 L37 12 L18 34 Z" stroke-width="2"/><path ${AL} d="M33 31 L14 9 L11 12 L30 34 Z" stroke-width="2"/>
    <path d="M11 29 L19 37 M37 29 L29 37 M15 35 L9 41 M33 35 L39 41"/><circle ${S} cx="8" cy="42" r="2"/><circle ${S} cx="40" cy="42" r="2"/>`,
  lanceiro: `<circle ${AL} cx="17" cy="31" r="9"/><circle cx="17" cy="31" r="4"/><path d="M9 43 L36 10"/><path ${A} d="M33 11 L41 4 L38.5 13.5 Z" stroke-width="1.8"/>`,
  carabineiro: `<path ${AL} d="M6 37 L13 30 L18 35 L11 42 Z"/><path d="M14 32 L37 9" stroke-width="3.4"/><path d="M20 28 l3 3 M17 30 l2 4"/>
    <circle ${F} cx="40.5" cy="6.5" r="3.4"/><path d="M40.5 1 V2.6 M46 6.5 H44.4 M44.3 2.7 l-1.1 1.1" stroke="#e8742a" stroke-width="1.8"/>`,
  arqueiro: `<path ${AL} d="M15 5 Q40 24 15 43 Q24 24 15 5 Z" stroke-width="2"/><path d="M15 5 V43" stroke-width="1.6"/>
    <path d="M7 24 H41 M41 24 L36 20.5 M41 24 L36 27.5 M7 24 l-3 -3 M7 24 l-3 3"/>`,
  fundibulario: `<circle cx="9" cy="8" r="3"/><path d="M11 10 Q17 30 28 34 Q35 31 31 23" stroke-width="2.2"/><circle ${AL} cx="36" cy="35" r="5"/><circle ${S} cx="36" cy="35" r="2"/>`,
  ariete: `<path d="M7 19 L24 10 L41 19 M11 19 V31 M37 19 V31"/><rect ${AL} x="5" y="23" width="33" height="7" rx="3.5"/>
    <path ${A} d="M38 22 H43 L46 26.5 L43 31 H38 Z" stroke-width="1.8"/><circle cx="14" cy="37" r="4"/><circle cx="31" cy="37" r="4"/>`,
  catapulta: `<path d="M6 38 H42 M17 38 L25 24 L33 38"/><circle cx="12" cy="40" r="3"/><circle cx="36" cy="40" r="3"/>
    <path d="M27 27 L10 11" stroke-width="3"/><circle ${AL} cx="9" cy="10" r="4.2"/><circle ${S} cx="9" cy="10" r="1.8"/><rect ${A} x="26" y="25" width="7" height="6" rx="1" stroke-width="1.8"/>`,
  morteiro: `<path d="M5 41 H43"/><path ${AL} d="M11 41 L15 31 H33 L37 41"/><path ${A} d="M19 32 L26 16 L35 20 L28 35 Z" stroke-width="2"/>
    <path d="M25.5 15.5 L35.5 20" stroke-width="3.4"/><path d="M33 12 Q37 4 43 7" stroke-dasharray="2 3" stroke-width="1.8"/><circle ${S} cx="43.5" cy="8.5" r="2.4"/>`,
  girocoptero: `<path d="M5 9 H43" stroke-width="3.2"/><path d="M24 9 V16"/><path ${AL} d="M13 23 Q13 16 24 16 Q35 16 35 24 Q35 30 25 30 H18 Q13 30 13 23 Z"/>
    <circle cx="21" cy="22.5" r="3"/><path d="M35 24 L43 22 V28 L35 26.5"/><circle cx="43" cy="25" r="2.6" stroke-width="1.8"/><path d="M15 35 H33 M19 30 V35 M29 30 V35"/>`,
  balao: `<path ${AL} d="M24 3 C34 3 39 11 37 19 C35 26 29 29 27 31 H21 C19 29 13 26 11 19 C9 11 14 3 24 3 Z"/>
    <path d="M24 3 V31 M17 6 Q15 19 21 31 M31 6 Q33 19 27 31" stroke-width="1.6"/><path d="M21 31 L20 36 M27 31 L28 36" stroke-width="1.8"/>
    <rect ${A} x="18.5" y="36" width="11" height="6" rx="1.2" stroke-width="1.8"/><circle ${S} cx="38" cy="40" r="3"/><path d="M38 37 l2 -3" stroke-width="1.6"/>`,
  cozinheiro: `<path d="M18 17 Q15 13 18 10 Q21 7 18 4 M25 17 Q22 13 25 10 Q28 7 25 4 M32 17 Q29 13 32 10" stroke-width="1.8"/>
    <path ${AL} d="M10 22 H38 L35 35 Q34 40 29 40 H19 Q14 40 13 35 Z"/><path d="M7 22 H41" stroke-width="3"/>
    <path d="M17 40 L15 44 M31 40 L33 44"/><path d="M13 28 H35" stroke-width="1.4" stroke-dasharray="2 2.6"/>`,
  medico: `<path d="M24 4 V44" stroke-width="3"/><path ${A} d="M21 4 H27 V7 H21 Z" stroke-width="1.6"/>
    <path d="M30 11 Q16 14 23 20 Q31 25 18 29 Q12 31 18 35 Q24 38 20 42" stroke-width="2.4"/><circle ${S} cx="31" cy="10.5" r="2.2"/>`,

  // ---------------- NAVAL ----------------
  lancachamas: `${CASCO}<path d="M13 30 V24 H24 V30 M17 24 V20"/><path d="M37 30 L42 25" stroke-width="3"/>
    <path ${F} d="M42 26 C47 20 42 17 45 11 C40 13.5 39.5 17.5 40.5 20 C37.5 16.5 37.5 12.5 39.5 8.5 C33 12.5 33 20 37.5 25 Z"/>`,
  arietevapor: `<path ${AL} d="M5 29 H40 L46 34 L40 38 H10 Z"/><path d="M40 33 L47 34.5 L40 36" stroke-width="2"/>
    <rect ${A} x="17" y="14" width="6" height="15" rx="1" stroke-width="1.8"/><circle cx="20" cy="9.5" r="2.6" stroke-width="1.6"/><circle cx="24.5" cy="5" r="2" stroke-width="1.6"/>
    <circle cx="31" cy="25" r="4.5"/><path d="M31 20.5 V29.5 M26.5 25 H35.5" stroke-width="1.6"/><path d="M3 43 Q7 41 11 43 T19 43 T27 43 T35 43 T45 43" stroke-width="1.8"/>`,
  trirreme: `<path ${AL} d="M5 29 Q24 34 43 29 L40 36 Q24 40 8 36 Z"/><path d="M43 29 L46.5 33.5" stroke-width="2.6"/><path d="M24 31 V5"/>
    <path ${A} d="M15 8 H33 L32 23 H16 Z" stroke-width="1.8"/><circle cx="24" cy="15.5" r="2.6" stroke-width="1.6"/>
    <path d="M12 36.5 L9 43 M18 38 L16 44 M24 38.5 V44.5 M30 38 L32 44 M36 36.5 L39 43" stroke-width="1.8"/>`,
  barcobalista: `${CASCO}<path d="M15 22 Q24 13 33 22" stroke-width="2.6"/><path d="M24 30 V15 M24 15 L38 8" stroke-width="2"/><path ${A} d="M38 8 L34 8 L36.5 11.5 Z" stroke-width="1.4"/>`,
  barcocatapulta: `${CASCO}<path d="M16 30 L23 22 L30 30"/><path d="M23 25 L36 11" stroke-width="2.8"/><circle ${AL} cx="37.5" cy="9.5" r="3.6"/><circle ${S} cx="37.5" cy="9.5" r="1.6"/>`,
  barcomorteiro: `${CASCO}<path ${A} d="M18 30 L22.5 18 L30.5 21 L27.5 30 Z" stroke-width="1.8"/><path d="M22 17.5 L31 21.5" stroke-width="3.2"/>
    <path d="M30 14 Q35 6 41 9" stroke-dasharray="2 3" stroke-width="1.8"/><circle ${S} cx="41.5" cy="10.5" r="2.3"/>`,
  lancafoguetes: `${CASCO}<path d="M11 30 L17 22 M18 30 L24 22" stroke-width="2"/><path ${A} d="M18.5 21 L35 10 L38.5 12.8 L22 23.8 Z" stroke-width="1.8"/>
    <path d="M38.5 12.8 L43 8.5 L35 10" stroke-width="1.8"/><path ${F} d="M18.5 21 L13 22 L15 25.5 L20 24 Z"/>`,
  submergivel: `<path ${AL} d="M5 28 Q5 20 24 20 Q41 20 43 26 Q41 34 24 34 Q5 34 5 28 Z"/><path d="M19 20 V14 H28 V20 M25 14 V8 H29.5"/>
    <path d="M43 26 L46.5 22.5 M43 26 L46.5 29.5" stroke-width="2"/><circle ${S} cx="14" cy="27" r="1.7"/><circle ${S} cx="22" cy="27" r="1.7"/><circle ${S} cx="30" cy="27" r="1.7"/>
    <path d="M3 41 Q7 39 11 41 T19 41 T27 41 T35 41 T45 41" stroke-width="1.8"/>`,
  lancharapida: `<path ${AL} d="M10 30 H41 L37 37 H14 Z"/><circle cx="25" cy="25" r="7"/><path d="M25 18 V32 M18 25 H32 M20 20 L30 30 M30 20 L20 30" stroke-width="1.4"/>
    <path d="M2 23 H7 M1 28.5 H6 M3 34 H8" stroke-width="2"/><path d="M8 42 Q12 40 16 42 T24 42 T32 42 T40 42" stroke-width="1.8"/>`,
  portabaloes: `${CASCO}<ellipse ${AL} cx="25" cy="11" rx="9.5" ry="8"/><path d="M25 3 V19 M19.5 5 Q17.5 11 21 18.5 M30.5 5 Q32.5 11 29 18.5" stroke-width="1.4"/>
    <path d="M21 18.5 L17 30 M29 18.5 L33 30" stroke-width="1.6"/><rect ${A} x="22" y="19" width="6" height="3.6" rx=".8" stroke-width="1.4"/>`,
  reparador: `${CASCO}<path d="M15 29 L29 15" stroke-width="3"/><path ${A} d="M26 10 L35 19 L32 22 L23 13 Z" stroke-width="1.8"/><path d="M37 8 l2 -3 M40 12 l3 -1" stroke-width="1.6"/>`,

  // ---------------- IMPÉRIO & GESTÃO ----------------
  anfora: `<path d="M18 5 H30" stroke-width="3"/><path ${AL} d="M21 7 V11 C13 14 11 22 13 29 C15 36 20 41 24 44 C28 41 33 36 35 29 C37 22 35 14 27 11 V7 Z"/>
    <path d="M21 12 C15 11 12.5 16 16 21 M27 12 C33 11 35.5 16 32 21"/><path d="M13.5 24 H34.5 M15.5 31 H32.5" stroke-width="1.6"/>
    <path d="M17 27.5 h3 v-2 h3 v2 h3 v-2 h3 v2 h2" stroke-width="1.2"/>`,
  taca: `<path d="M9 9 H39 Q38 25 24 27 Q10 25 9 9 Z"/><path ${V} d="M11 14 H37 Q35.5 23.5 24 25 Q12.5 23.5 11 14 Z" stroke="none"/>
    <path d="M24 27 V38"/><path ${AL} d="M14 43 Q24 36 34 43 Z"/><path d="M14 43 H34"/>`,
  mercante: `<path ${AL} d="M5 30 H43 Q41 38 32 39 H16 Q7 38 5 30 Z"/><path d="M24 30 V5"/><path ${A} d="M24 7 Q37 15 24 26 Z" stroke-width="1.8"/>
    <rect x="9" y="23" width="8" height="7" rx="1"/><rect x="31" y="23" width="8" height="7" rx="1"/><path d="M3 43 Q7 41 11 43 T19 43 T27 43 T35 43 T45 43" stroke-width="1.8"/>`,
  ancora: `<circle cx="24" cy="8" r="3.6"/><path d="M24 11.6 V41" stroke-width="2.8"/><path ${A} d="M15 15 H33 V18.5 H15 Z" stroke-width="1.8"/>
    <path d="M8 29 Q10 41 24 41 Q38 41 40 29" stroke-width="2.8"/><path d="M8 29 L5 34 M8 29 L13 31.5 M40 29 L43 34 M40 29 L35 31.5"/>`,
  tenda: `<path d="M2 41 H46"/><path ${AL} d="M6 41 L24 9 L42 41 Z"/><path d="M24 41 V23 L17 41 M24 23 L31 41" stroke-width="2"/>
    <path d="M24 9 V3"/><path ${A} d="M24 3 L32 5.5 L24 8 Z" stroke-width="1.4"/>`,
  escudoAlerta: `<path ${AL} d="M24 4 L40 10 V22 C40 33 33 40 24 44 C15 40 8 33 8 22 V10 Z"/><path d="M24 14 V27" stroke-width="3.6"/><circle ${S} cx="24" cy="33.5" r="2.4"/>`,
  tridente: `<path d="M24 18 V45" stroke-width="2.8"/><path d="M12 7 V14 Q12 20 24 20 Q36 20 36 14 V7 M24 6 V20" stroke-width="2.4"/>
    <path ${A} d="M24 1.5 L20.5 8 H27.5 Z" stroke-width="1.4"/><path ${A} d="M12 2.5 L9 9 H15 Z" stroke-width="1.4"/><path ${A} d="M36 2.5 L33 9 H39 Z" stroke-width="1.4"/>
    <path d="M20 28 H28" stroke-width="2"/>`,
  bigorna: `<path ${AL} d="M5 20 H35 L44 22 Q38 28 32 28 V33 H16 V28 Q8 27 5 20 Z"/><path ${A} d="M12 42 H36 L33 33 H15 Z" stroke-width="1.8"/>
    <path d="M22 13 L32 3" stroke-width="2.6"/><path ${A} d="M15 6 L22 13 L19 16 L12 9 Z" stroke-width="1.8"/><path d="M38 12 l2.5 -3 M41 17 l3.5 -1 M35 8 l.5 -3.5" stroke-width="1.6"/>`,

  // ---------------- PAPÉIS DAS CIDADES ----------------
  louros: `<path d="M19 42 Q6 32 11 11 M29 42 Q42 32 37 11" stroke-width="1.8"/>
    ${folha(9, 31, -55)}${folha(7.6, 23, -20)}${folha(9.5, 15, 15)}${folha(14, 37.5, -75)}
    ${folha(39, 31, 55)}${folha(40.4, 23, 20)}${folha(38.5, 15, -15)}${folha(34, 37.5, 75)}<circle ${A} cx="24" cy="13" r="3.4" stroke-width="1.6"/>`,
  cristal: `<path ${AL} d="M14 8 H34 L42 18 L24 42 L6 18 Z"/><path d="M6 18 H42 M14 8 L19 18 L24 42 L29 18 L34 8 M19 18 L24 8 L29 18" stroke-width="1.8"/>`,
  enxofre: `<path ${E} d="M24 4 C30 12 38 18 36 30 C35 38 29 43 24 43 C18 43 12 38 12 30 C12 22 18 20 18 12 C21 15 22 18 22 21 C25 17 26 11 24 4 Z"/>
    <path ${F} d="M24 26 C27 30 30 32 29 36 C28 39 26 40.5 24 40.5 C21 40.5 19 38.5 19 35.5 C19 32 22 31 24 26 Z"/>`,
  coluna: `<path d="M7 8 H41" stroke-width="3"/><path ${A} d="M10 9 Q10 14 15 14 H33 Q38 14 38 9 Z" stroke-width="1.8"/><circle cx="11.5" cy="12" r="2.4" stroke-width="1.6"/><circle cx="36.5" cy="12" r="2.4" stroke-width="1.6"/>
    <rect ${AL} x="14" y="14" width="20" height="24"/><path d="M19 16 V36 M24 16 V36 M29 16 V36" stroke-width="1.6"/><path d="M11 38 H37 M8 42.5 H40" stroke-width="2.6"/>`,
  madeira: `<path d="M22 10 H40 Q43.5 10 43.5 16 Q43.5 22 40 22 H22"/><circle ${AL} cx="22" cy="16" r="6"/><circle cx="22" cy="16" r="2.4" stroke-width="1.6"/>
    <path d="M14 25 H38 Q42.5 25 42.5 32 Q42.5 39 38 39 H14"/><circle ${AL} cx="14" cy="32" r="7"/><circle cx="14" cy="32" r="3" stroke-width="1.6"/>`,

  // ---------------- INTERFACE ----------------
  templo: `<path ${AL} d="M4 18 L24 6 L44 18 Z"/><path d="M6 18 H42 M6 22.5 H42"/><path d="M10 23 V37 M18 23 V37 M30 23 V37 M38 23 V37"/><path d="M4 38 H44 M2.5 42.5 H45.5"/>`,
  elmo: `<path ${AL} d="M13 22 C13 11 35 11 35 22 V35 L29.5 39.5 L28 32.5 H20 L18.5 39.5 L13 35 Z"/><path d="M16 23 H32 M24 23 V31"/>
    <path ${A} d="M11 15 Q22 1 37 9 L35 12.5 Q23 6 14 17 Z" stroke-width="1.8"/>`,
  alvo: `<circle cx="24" cy="24" r="18"/><circle ${AL} cx="24" cy="24" r="11"/><circle ${S} cx="24" cy="24" r="3.4"/><path d="M24 2 V9 M24 39 V46 M2 24 H9 M39 24 H46" stroke-width="2"/>`,
  ampulheta: `<path d="M11 4 H37 M11 44 H37" stroke-width="3"/><path d="M14 4 Q14 18 24 24 Q34 18 34 4 M14 44 Q14 30 24 24 Q34 30 34 44"/>
    <path ${A} d="M18 40.5 Q24 33 30 40.5 Z" stroke-width="1.4"/><path ${AL} d="M17.5 10 H30.5 Q29 16.5 24 19.5 Q19 16.5 17.5 10 Z" stroke="none"/>`,
  nuvem: `<path ${AL} d="M13 37 H35 Q43 37 43 29.5 Q43 22.5 35.5 22 Q34 13 25 13 Q17.5 13 15.5 20.5 Q6 21.5 6 29.5 Q6 37 13 37 Z"/>`,
  ondas: `<path d="M3 16 Q8 11 13 16 T23 16 T33 16 T45 16 M3 26 Q8 21 13 26 T23 26 T33 26 T45 26 M3 36 Q8 31 13 36 T23 36 T33 36 T45 36"/>`,
  fogo: `<path ${F} d="M24 4 C31 12 38 19 36 30 C35 38 29 44 24 44 C18 44 12 38 12 30 C12 22 18 20 18 12 C21 15 22 18 22 21 C25 17 26 11 24 4 Z"/>
    <path d="M24 26 C27 30 30 32 29 36 C28 39 26 40.5 24 40.5 C21 40.5 19 38.5 19 35.5 C19 32 22 31 24 26 Z" stroke-width="1.8"/>`,
  balas: `<circle ${AL} cx="15" cy="34" r="8"/><circle ${AL} cx="33" cy="34" r="8"/><circle ${A} cx="24" cy="18" r="8" stroke-width="2"/><path d="M12 31 q2 -2 4 -2 M30 31 q2 -2 4 -2 M21 15 q2 -2 4 -2" stroke-width="1.6"/>`,
  reagrupar: `<path d="M38 18 A15 15 0 0 0 11 15 M10 30 A15 15 0 0 0 37 33" stroke-width="2.8"/><path d="M38 8 V18 H28 M10 40 V30 H20" stroke-width="2.6"/><circle ${A} cx="24" cy="24" r="4" stroke-width="1.6"/>`,
  espadas: `<path d="M10 38 L36 12 M38 10 L33 9.5 L38.5 15 Z M12 32 L16 36 M8 40 l-2 2" /><path d="M38 38 L12 12 M10 10 L15 9.5 L9.5 15 Z M36 32 L32 36 M40 40 l2 2"/>`,
  bandeira: `<path d="M10 44 V4" stroke-width="2.8"/><path ${AL} d="M10 6 H38 L32 14 L38 22 H10 Z"/>`,
  balanca: `<path d="M24 6 V42 M14 42 H34 M8 12 H40"/><path ${AL} d="M3 26 L8 12 L13 26 Z M35 26 L40 12 L45 26 Z"/><path d="M2 26 Q8 32 14 26 M34 26 Q40 32 46 26"/>`,
  rota: `<circle ${A} cx="9" cy="38" r="4"/><circle ${A} cx="39" cy="10" r="4"/><path d="M12 35 Q16 18 26 22 Q36 26 36 13" stroke-dasharray="3 3"/>`,
  ouro: `<ellipse ${AL} cx="24" cy="32" rx="16" ry="6"/><ellipse ${A} cx="24" cy="24" rx="16" ry="6" stroke-width="1.8"/><path d="M8 24 V32 M40 24 V32"/><ellipse ${AL} cx="24" cy="16" rx="12" ry="4.5"/>`,
};

// Unidade → ícone (as que não têm desenho próprio usam o mais parecido)
const POR_UNIDADE = { mercante: 'mercante' };

export const temIcone = nome => Object.prototype.hasOwnProperty.call(ICONES, nome);

export function icone(nome, { tam = 24, cls = '', titulo = '', traco = 2.6 } = {}) {
  const corpo = ICONES[nome] || ICONES.alvo;
  return `<svg class="ico ico-${nome} ${cls}" viewBox="0 0 48 48" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="${traco}" stroke-linecap="round" stroke-linejoin="round" ${titulo ? `role="img" aria-label="${titulo}"` : 'aria-hidden="true"'} focusable="false">${titulo ? `<title>${titulo}</title>` : ''}${corpo}</svg>`;
}

export const iconeUnidade = (id, o) => icone(POR_UNIDADE[id] || (temIcone(id) ? id : 'espadas'), o);
