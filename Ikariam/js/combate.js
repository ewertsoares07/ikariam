// =====================================================================
// MOTOR DO SIMULADOR DE COMBATE (sem tela) — uma rodada de 15 min por vez
// Regras do jogo usadas (Dossiê 2.3 + Wiki):
//  • cada linha ataca na ordem de prioridade de ALVOS (data.js);
//  • cada tiro acerta UMA unidade: dano = dano da arma − armadura do alvo;
//    o que passa da vida dela se perde (base do Lança-Chamas Tank);
//  • acerto = quantidade × precisão; munição conta rodadas;
//  • as duas frentes atiram ao mesmo tempo (calcula tudo, depois aplica);
//  • entre rodadas a reserva completa os espaços (do centro para as pontas);
//  • sem Linha de Frente / Principal = recuo automático.
// É uma estimativa: o jogo também espalha os tiros entre espaços vizinhos.
// =====================================================================
import { CAMPO, ALVOS, COMBATE, UNIDADES } from './data.js';

export const frenteDe = tipo => (tipo === 'mar' ? 'principal' : 'frente');
export const capacidade = id => COMBATE[id]?.slot || 0;
export const unidadesDaLinha = (tipo, linha) => UNIDADES.filter(u => u.tipo === tipo && u.linha === linha && COMBATE[u.id]);
export const chaveSlot = (lado, linha, i) => `${lado}.${linha}.${i}`;
export const clonar = o => JSON.parse(JSON.stringify(o));

// Ordem de preenchimento: do centro para as pontas. Flancos: da frente para trás, alternando os lados.
export function ordemSlots(linha, n) {
  if (linha === 'flanco') { const o = []; for (let i = 0; i < n / 2; i++) o.push(i, i + n / 2); return o; }
  const c = (n - 1) / 2;
  return [...Array(n).keys()].sort((a, b) => Math.abs(a - c) - Math.abs(b - c) || a - b);
}

// Lugar de cada espaço na grade 9 colunas × 4 fileiras do tabuleiro.
// fileira 1 = Linha de Frente (encostada no centro) … fileira 4 = Aéreo (na borda).
export function posicao(linha, i) {
  switch (linha) {
    case 'flanco': return { col: i < 3 ? 1 : 9, lin: (i % 3) + 1 };
    case 'frente': case 'principal': return { col: 2 + i, lin: 1 };
    case 'longo': return { col: 2 + i, lin: 2 };
    case 'artilharia': return { col: 3 + i, lin: 3 };
    case 'caca': return { col: 1 + i, lin: 4 };
    case 'bombardeio': return { col: 8 + i, lin: 4 };
    default: return { col: 5, lin: 4 };
  }
}

export const slotVazio = () => ({ u: null, q: 0, q0: 0, dano: 0, mun: null });

export function ladoVazio(tipo) {
  const linhas = {};
  for (const [l, n] of Object.entries(CAMPO[tipo])) linhas[l] = Array.from({ length: n }, slotVazio);
  return { linhas, reserva: {}, up: { dano: 0, arm: 0 } };
}

export function encherSlot(s, id, q) {
  q = Math.max(0, Math.floor(+q || 0));
  if (!id || !q) { Object.assign(s, slotVazio()); return s; }
  Object.assign(s, { u: id, q, q0: q, dano: 0, mun: COMBATE[id]?.mun ?? null });
  return s;
}

// Espalha um exército { id: qtd } pelo campo: enche os espaços e o resto vai para a reserva
export function distribuir(tipo, unidades = {}, up = { dano: 0, arm: 0 }) {
  const lado = ladoVazio(tipo);
  lado.up = { ...up };
  for (const [linha, slots] of Object.entries(lado.linhas)) {
    const ordem = ordemSlots(linha, slots.length);
    let k = 0;
    for (const u of unidadesDaLinha(tipo, linha)) {
      let resto = Math.max(0, Math.floor(+unidades[u.id] || 0));
      const cap = capacidade(u.id);
      while (resto > 0 && k < ordem.length) { const q = Math.min(cap, resto); encherSlot(slots[ordem[k++]], u.id, q); resto -= q; }
      if (resto > 0) lado.reserva[u.id] = (lado.reserva[u.id] || 0) + resto;
    }
  }
  return lado;
}

// Preenche espaços de uma linha a partir do centro, até maxEspacos (ex.: preset 43 LCs = 3 espaços de 12 + 7 na reserva)
export function preencherLinha(lado, linha, id, total, maxEspacos = Infinity) {
  const slots = lado.linhas[linha];
  const cap = capacidade(id);
  let resto = Math.max(0, Math.floor(total));
  let usados = 0;
  for (const i of ordemSlots(linha, slots.length)) {
    if (resto <= 0 || usados++ >= maxEspacos) break;
    const q = Math.min(cap, resto);
    encherSlot(slots[i], id, q);
    resto -= q;
  }
  if (resto > 0) lado.reserva[id] = (lado.reserva[id] || 0) + resto;
  return lado;
}

// Quantas unidades de cada tipo o lado tem (campo + reserva)
export function contar(lado) {
  const out = {};
  for (const slots of Object.values(lado.linhas)) for (const s of slots) if (s.q > 0) out[s.u] = (out[s.u] || 0) + s.q;
  for (const [id, n] of Object.entries(lado.reserva || {})) if (n > 0) out[id] = (out[id] || 0) + n;
  return out;
}
export const totalLado = lado => Object.values(contar(lado)).reduce((a, b) => a + b, 0);
export const noCampo = lado => Object.values(lado.linhas).flat().reduce((a, s) => a + (s.q > 0 ? s.q : 0), 0);
export const temLinha = (lado, linha) => (lado.linhas[linha] || []).some(s => s.q > 0);

export function danoPorTiro(idAtk, upAtk, idAlvo, upAlvo) {
  const a = COMBATE[idAtk], d = COMBATE[idAlvo];
  if (!a || !d) return 0;
  return Math.max(0, a.dano + (upAtk?.dano || 0) * a.upD - (d.arm + (upAlvo?.arm || 0) * d.upA));
}

// Escolhe o espaço inimigo atacado: primeira linha viva da prioridade, o espaço mais próximo na grade
function escolherAlvo(tipo, defensor, linhaAtk, i) {
  const eu = posicao(linhaAtk, i);
  for (const l of ALVOS[tipo][linhaAtk] || []) {
    const slots = defensor.linhas[l];
    if (!slots) continue;
    let melhor = null, dist = Infinity;
    slots.forEach((s, j) => {
      if (s.q <= 0) return;
      const p = posicao(l, j);
      const d = Math.abs(p.col - eu.col) * 10 + Math.abs(p.lin - eu.lin); // mesma coluna; empate = mesma fileira
      if (d < dist) { dist = d; melhor = j; }
    });
    if (melhor != null) return { linha: l, i: melhor };
  }
  return null;
}

// Aplica N tiros de D de dano num espaço: cada tiro fere 1 unidade e o excedente se perde
export function aplicarTiros(s, hits, dmg) {
  const c = COMBATE[s.u];
  if (!c || s.q <= 0 || !(dmg > 0) || !(hits > 0)) return 0;
  let mortos = 0;
  const porUnidade = Math.ceil(c.hp / dmg);
  while (hits > 0 && s.q > 0) {
    const precisa = Math.ceil((c.hp - s.dano) / dmg);
    if (hits >= precisa) {
      hits -= precisa; s.q--; s.dano = 0; mortos++;
      if (s.q > 0 && hits >= porUnidade) { const n = Math.min(s.q, Math.floor(hits / porUnidade)); s.q -= n; mortos += n; hits -= n * porUnidade; }
    } else { s.dano += hits * dmg; hits = 0; }
  }
  return mortos; // tiros que sobram depois que o espaço zera se perdem
}

// Reserva completa os espaços (mesmo tipo primeiro; espaço vazio aceita qualquer unidade da linha)
export function reabastecer(tipo, lado) {
  const entrou = [];
  for (const [linha, slots] of Object.entries(lado.linhas)) {
    for (const i of ordemSlots(linha, slots.length)) {
      const s = slots[i];
      const ids = s.q > 0 ? [s.u] : unidadesDaLinha(tipo, linha).map(u => u.id);
      for (const id of ids) {
        const r = lado.reserva[id] || 0;
        if (!r) continue;
        const falta = capacidade(id) - (s.q > 0 ? s.q : 0);
        if (falta <= 0) break;
        const n = Math.min(falta, r);
        if (s.q > 0) { s.q += n; s.q0 = Math.max(s.q0, s.q); } else encherSlot(s, id, n);
        lado.reserva[id] = r - n;
        if (!lado.reserva[id]) delete lado.reserva[id];
        entrou.push({ linha, i, id, n });
        break;
      }
    }
  }
  return entrou;
}

const vidaSlot = s => { const c = COMBATE[s.u]; return c ? Math.max(0, s.q * c.hp - s.dano) : 0; };
export const pctVida = s => (s.q0 > 0 && COMBATE[s.u] ? Math.round((vidaSlot(s) / (s.q0 * COMBATE[s.u].hp)) * 100) : 0);

// Uma rodada. Não mexe nos lados recebidos: devolve cópias novas e o que aconteceu.
export function rodada(tipo, ini, meu) {
  const lados = { ini: clonar(ini), meu: clonar(meu) };
  const antes = { ini, meu };
  const golpes = []; // { lado (quem apanhou), linha, i, hits, dmg, de }
  const disparos = []; // espaços que atiraram
  const danoTotal = { ini: 0, meu: 0 };
  for (const [ladoId, outro] of [['ini', 'meu'], ['meu', 'ini']]) {
    const atk = antes[ladoId], def = antes[outro];
    for (const [linha, slots] of Object.entries(atk.linhas)) {
      slots.forEach((s, i) => {
        const c = COMBATE[s.u];
        if (s.q <= 0 || !c || !(c.dano > 0) || s.mun === 0) return;
        const alvo = escolherAlvo(tipo, def, linha, i);
        if (!alvo) return;
        const idAlvo = def.linhas[alvo.linha][alvo.i].u;
        const dmg = danoPorTiro(s.u, atk.up, idAlvo, def.up);
        const hits = Math.round(s.q * c.prec);
        if (s.mun != null) lados[ladoId].linhas[linha][i].mun = Math.max(0, s.mun - 1);
        disparos.push(chaveSlot(ladoId, linha, i));
        if (dmg > 0 && hits > 0) { golpes.push({ lado: outro, linha: alvo.linha, i: alvo.i, hits, dmg, de: chaveSlot(ladoId, linha, i) }); danoTotal[ladoId] += hits * dmg; }
      });
    }
  }
  const perdas = { ini: {}, meu: {} };
  const atingidos = {};
  for (const g of golpes) {
    const s = lados[g.lado].linhas[g.linha][g.i];
    const id = s.u;
    const m = aplicarTiros(s, g.hits, g.dmg);
    if (m) perdas[g.lado][id] = (perdas[g.lado][id] || 0) + m;
    const k = chaveSlot(g.lado, g.linha, g.i);
    atingidos[k] = { mortos: (atingidos[k]?.mortos || 0) + m };
  }
  for (const k of Object.keys(atingidos)) {
    const [l, linha, i] = k.split('.');
    const s = lados[l].linhas[linha][+i];
    atingidos[k].pct = pctVida(s);
    atingidos[k].destruido = s.q <= 0;
    atingidos[k].q = s.q;
  }
  const reforcos = { ini: reabastecer(tipo, lados.ini), meu: reabastecer(tipo, lados.meu) };
  return { ini: lados.ini, meu: lados.meu, atingidos, disparos, perdas, danoTotal, reforcos };
}

// Faixas de alerta do centro do campo
export function situacao(tipo, ini, meu, { rodou = false, danoTotal = null, alianca = false } = {}) {
  const f = frenteDe(tipo);
  const tIni = totalLado(ini), tMeu = totalLado(meu);
  const out = [];
  const nomeFrente = tipo === 'mar' ? 'Linha Principal' : 'Linha de Frente';
  if (!tIni && !tMeu) return out;
  if (rodou && tIni && !tMeu) out.push({ tipo: 'derrota', titulo: 'Derrota', texto: 'Seu exército foi destruído.' });
  else if (rodou && tMeu && !tIni) out.push({ tipo: 'vitoria', titulo: 'Vitória', texto: 'O inimigo não tem mais unidades.' });
  const semIni = tIni > 0 && !temLinha(ini, f), semMeu = tMeu > 0 && !temLinha(meu, f);
  if (semIni && semMeu) out.push({ tipo: 'impasse', titulo: 'Impasse', texto: `Nenhum lado tem ${nomeFrente}: os dois recuam.` });
  else {
    if (semMeu) out.push({ tipo: 'recuo', titulo: 'Recuo automático', texto: `Você ficou sem ${nomeFrente}: o exército inteiro recua.` });
    if (semIni) out.push({ tipo: 'recuo ini', titulo: 'Inimigo em recuo', texto: `O inimigo ficou sem ${nomeFrente} e recua.` });
  }
  if (rodou && danoTotal && tIni && tMeu && !danoTotal.ini && !danoTotal.meu && !out.some(x => x.tipo === 'impasse'))
    out.push({ tipo: 'impasse', titulo: 'Impasse', texto: 'Ninguém passou da armadura nesta rodada (ou acabou a munição).' });
  if (alianca) out.push({ tipo: 'alianca', titulo: 'Combate em aliança', texto: 'As unidades com MENOS upgrade entram primeiro na frente.' });
  return out;
}
