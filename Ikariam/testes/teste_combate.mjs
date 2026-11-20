// Testes do motor do simulador de combate: node testes/teste_combate.mjs
import * as k from '../js/combate.js';
let falhas = 0;
const ok = (cond, msg) => { console.log(cond ? '✔' : '✘', msg); if (!cond) falhas++; };

ok(k.ordemSlots('frente', 7).join() === '3,2,4,1,5,0,6', 'frente enche do centro para as pontas');
ok(k.ordemSlots('flanco', 6).join() === '0,3,1,4,2,5', 'flancos alternam os lados, da frente para trás');
ok(k.ordemSlots('artilharia', 5).join() === '2,1,3,0,4', 'artilharia (5) do centro');

// Distribuir enche todos os espaços como o jogo: 43 LCs = 12 + 12 + 12 + 7
let mar = k.distribuir('mar', { lancachamas: 43 });
let pr = mar.linhas.principal;
ok(pr[3].q === 12 && pr[2].q === 12 && pr[4].q === 12 && pr[1].q === 7 && !mar.reserva.lancachamas, 'distribuir 43 LCs: 4 espaços, sem reserva');
// Preset do Dossiê: 43 LCs = 3 espaços de 12 no centro + 7 na reserva
mar = k.preencherLinha(k.ladoVazio('mar'), 'principal', 'lancachamas', 43, 3);
pr = mar.linhas.principal;
ok(pr[3].q === 12 && pr[2].q === 12 && pr[4].q === 12 && pr[1].q === 0, 'preset 43 LCs: 3 espaços centrais de 12');
ok(mar.reserva.lancachamas === 7, 'preset 43 LCs: 7 na reserva');
ok(k.totalLado(mar) === 43 && k.noCampo(mar) === 36, 'contagem campo + reserva');

// Preset na linha sem apagar o resto
let p = k.distribuir('mar', { arietevapor: 10 });
k.preencherLinha(p, 'principal', 'lancachamas', 12);
ok(p.linhas.principal[3].u === 'lancachamas' && p.linhas.principal[2].u === 'arietevapor', 'preset de 12 LCs ocupa o centro e mantém os AV');

// Hoplita x Hoplita: 45 acertos de 17 (18 − 1 de armadura), 4 tiros por hoplita (56 de vida)
let a = k.distribuir('terra', { hoplita: 50 }), b = k.distribuir('terra', { hoplita: 50 });
let r = k.rodada('terra', a, b);
const s = r.meu.linhas.frente[3];
ok(s.q === 39 && s.dano === 17, `hoplitas: 11 mortos e 17 de dano no próximo -> ${s.q}/${s.dano}`);
ok(r.perdas.ini.hoplita === 11 && r.perdas.meu.hoplita === 11, 'perdas simétricas');
ok(a.linhas.frente[3].q === 50, 'rodada não altera os lados originais');

// Dano excedente se perde: LF (760) contra LC (219 de vida) mata 1 por tiro
const sl = k.encherSlot(k.slotVazio(), 'lancachamas', 12);
ok(k.aplicarTiros(sl, 3, 752) === 3 && sl.q === 9 && sl.dano === 0, '3 tiros de LF = 3 LCs mortos, o resto se perde');
const sl2 = k.encherSlot(k.slotVazio(), 'lancachamas', 2);
ok(k.aplicarTiros(sl2, 10, 752) === 2 && sl2.q === 0, 'espaço zerado: tiros que sobram somem');

// Reserva entra no lugar dos mortos
let atk = k.distribuir('mar', { lancafoguetes: 20 }), def = k.preencherLinha(k.ladoVazio('mar'), 'principal', 'lancachamas', 43, 3);
r = k.rodada('mar', atk, def);
ok(r.reforcos.meu.length > 0, 'reserva de LC reabastece os espaços depois da rodada');
ok(r.ini.linhas.artilharia[2].mun === 1, 'Lança-Foguetes gasta 1 das 2 munições');

// Recuo automático sem linha principal
let semFrente = k.distribuir('mar', { submergivel: 10 });
let alertas = k.situacao('mar', k.distribuir('mar', { lancachamas: 12 }), semFrente);
ok(alertas.some(x => x.tipo === 'recuo'), 'sem Linha Principal = recuo automático');

// Impasse: dano não passa a armadura
let fracos = k.distribuir('terra', { lanceiro: 1 }), duros = k.distribuir('terra', { gigante: 1 });
fracos.linhas.frente[3] = k.encherSlot(k.slotVazio(), 'lanceiro', 5);
const up = { dano: 0, arm: 10 };
duros.up = up;
const ataqueGiganteBlindado = k.danoPorTiro('lanceiro', {}, 'gigante', up);
ok(ataqueGiganteBlindado === 0, 'lanceiro não fura gigante com +10 de armadura');

// Oficina soma dano
ok(k.danoPorTiro('trirreme', { dano: 3 }, 'trirreme', {}) === 75 + 6 - 9, 'Oficina naval: +2 de dano por nível');

if (falhas) { console.log(`\n${falhas} falha(s)`); process.exit(1); }
