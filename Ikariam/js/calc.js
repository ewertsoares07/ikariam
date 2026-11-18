// =====================================================================
// CÁLCULOS PUROS (sem tela) — fáceis de testar e corrigir
// =====================================================================
import { UNIDADES, POSEIDON_BONUS, TRITAO_BONUS, OLIGARQUIA_MULT, VEL_MERCANTE, HUMOR } from './data.js';

export const unidadePorId = id => UNIDADES.find(u => u.id === id);

// ---------- Coordenadas e distância ----------
export function lerCoords(txt) {
  const m = String(txt || '').match(/(\d{1,3})\s*[:;,.\s]\s*(\d{1,3})/);
  return m ? { x: +m[1], y: +m[2] } : null;
}
export const coordsTexto = c => (c ? `${c.x}:${c.y}` : '');

// Mesma ilha = 0,5 (Wiki). Ilhas diferentes = distância reta entre as coordenadas.
export function distancia(a, b) {
  const p = typeof a === 'string' ? lerCoords(a) : a;
  const q = typeof b === 'string' ? lerCoords(b) : b;
  if (!p || !q) return null;
  if (p.x === q.x && p.y === q.y) return 0.5;
  return Math.hypot(p.x - q.x, p.y - q.y);
}

// ---------- Velocidade e tempo de viagem ----------
// Grupo misto anda na velocidade do mais lento. Tropas de terra que cruzam o mar
// vão nos navios mercantes, então não passam de 60.
export function velocidadeGrupo(ids, cruzaMar = true) {
  const lista = (ids || []).map(unidadePorId).filter(Boolean);
  if (!lista.length) return VEL_MERCANTE;
  let v = Math.min(...lista.map(u => u.vel));
  if (cruzaMar && lista.some(u => u.tipo === 'terra')) v = Math.min(v, VEL_MERCANTE);
  return v;
}

// Tempo (min) = distância × 1200 ÷ velocidade efetiva. Segundos arredondados para cima.
export function tempoViagem({ dist, vel = VEL_MERCANTE, poseidon = 0, tritao = 0, oligarquia = false, eventoPct = 0, reducaoPct = 0 }) {
  if (dist == null || !(vel > 0)) return null;
  const bonus = 1 + (POSEIDON_BONUS[poseidon] || 0) + (TRITAO_BONUS[tritao] || 0) + (eventoPct || 0) / 100;
  const velEf = vel * bonus * (oligarquia ? OLIGARQUIA_MULT : 1);
  const minutos = (dist * 1200) / velEf;
  const seg = Math.ceil(minutos * 60 * (1 - Math.min(90, Math.max(0, reducaoPct || 0)) / 100));
  return { seg, velEf };
}

export const horaPartida = (impactoMs, seg) => impactoMs - seg * 1000;

// ---------- Vinho / Taverna ----------
// O jogador informa o estoque num momento (em). O app desconta o consumo até agora.
export function vinhoAgora(v, agora = Date.now()) {
  if (!v || !(v.consumo > 0) || v.estoque == null) return null;
  const horas = Math.max(0, (agora - (v.em || agora)) / 3.6e6);
  const restante = Math.max(0, v.estoque - v.consumo * horas);
  const zeraEm = (v.em || agora) + (v.estoque / v.consumo) * 3.6e6;
  const segRest = Math.max(0, (zeraEm - agora) / 1000);
  return { restante, zeraEm, segRest, nivel: nivelVinho(segRest) };
}

// Semáforo: verde > 7 dias · ok 2–7 dias · amarelo < 48h · vermelho < 12h
export function nivelVinho(segRest) {
  const h = segRest / 3600;
  if (h < 12) return 'vermelho';
  if (h < 48) return 'amarelo';
  if (h > 24 * 7) return 'verde';
  return 'ok';
}

export function reposicaoVinho(consumo, dias, restante, cap) {
  const precisa = Math.max(0, Math.ceil(consumo * 24 * dias - (restante || 0)));
  return { precisa, barcos: Math.ceil(precisa / Math.max(1, cap)) };
}

// ---------- Habitantes / Satisfação ----------
// Crescimento/h = satisfação × 0,02 e cada habitante novo tira 1 de satisfação:
// S(t) = S0·e^(−t/50) e P(t) = P0 + S0·(1 − e^(−t/50)), até o limite da Prefeitura.
export function humor(sat) {
  if (sat == null || !Number.isFinite(+sat)) return null;
  return HUMOR.find(h => sat >= h.min);
}

export function habitantesAgora(h, agora = Date.now()) {
  if (!h || h.atual == null) return null;
  const max = h.max > 0 ? h.max : null;
  const s0 = h.satisfacao == null ? null : +h.satisfacao;
  const p0 = +h.atual;
  const t = Math.max(0, (agora - (h.em || agora)) / 3.6e6);
  let atual = p0, sat = s0;
  if (s0 != null && s0 !== 0) {
    atual = p0 + s0 * (1 - Math.exp(-t / 50));
    if (max != null && s0 > 0 && atual > max) atual = Math.max(p0, max);
    atual = Math.max(0, atual);
    sat = s0 - (atual - p0);
  }
  const cresceH = sat == null ? null : sat * 0.02;
  const equilibrio = s0 == null ? null : Math.max(0, p0 + s0);
  let estado = 'sem', cheiaEm = null;
  if (max != null && atual >= max - 0.5) estado = 'cheia';
  else if (sat == null) estado = 'sem';
  else if (sat < -0.5) estado = 'caindo';
  else if (sat <= 0.5) estado = 'parada';
  else if (max != null && equilibrio <= max) estado = 'trava';
  else estado = 'crescendo';
  if (estado === 'crescendo') {
    const falta = max - atual;
    const horas = -50 * Math.log(1 - falta / sat);
    if (Number.isFinite(horas)) cheiaEm = agora + horas * 3.6e6;
  }
  return {
    atual: Math.floor(atual), max, sat: sat == null ? null : Math.round(sat), cresceH, equilibrio: equilibrio == null ? null : Math.floor(equilibrio),
    ocupacao: max ? Math.min(1, atual / max) : null, livres: max ? Math.max(0, Math.floor(max - atual)) : null,
    estado, cheiaEm, humor: humor(sat),
  };
}

// ---------- Corrupção ----------
// Colônia: Residência do Governador precisa ter nível ≥ número de colônias.
// Capital: Palácio com nível ≥ número de colônias. Fórmula: 1 − (nível + 1) ÷ total de cidades.
export function corrupcao(nivel, totalCidades) {
  if (!(totalCidades > 1)) return 0;
  const n = Math.max(0, +nivel || 0);
  return Math.max(0, 1 - (n + 1) / totalCidades);
}
export const nivelSemCorrupcao = totalCidades => Math.max(0, totalCidades - 1);

// ---------- Exército ----------
export const custoTotalUnidade = u => Object.values(u.custo || {}).reduce((a, b) => a + b, 0);
export const generaisUnidade = u => custoTotalUnidade(u) / 50;

export function resumoExercito(unidades = {}, fora = false) {
  let generais = 0, manut = 0, peso = 0, qtd = 0, pesoNaval = 0;
  for (const [id, n] of Object.entries(unidades)) {
    const u = unidadePorId(id);
    const q = +n || 0;
    if (!u || q <= 0) continue;
    qtd += q;
    generais += q * generaisUnidade(u);
    manut += q * u.manut;
    if (u.tipo === 'terra') peso += q * (u.peso || 0); else pesoNaval += q;
  }
  return { qtd, generais, manut1x: manut, manutReal: manut * (fora ? 2 : 1), peso, navios: pesoNaval };
}

export const barcosParaPeso = (peso, cap) => Math.ceil((peso || 0) / Math.max(1, cap));

export function somarExercitos(listas) {
  const total = {};
  for (const l of listas) for (const [id, n] of Object.entries(l || {})) total[id] = (total[id] || 0) + (+n || 0);
  return total;
}

// ---------- Saque ----------
// Ouro não ocupa espaço no porão: fica fora da conta de barcos.
export function saque(recursos = {}, pct = 100, cap = 500) {
  const soma = ['madeira', 'vinho', 'marmore', 'cristal', 'enxofre'].reduce((a, k) => a + (+recursos[k] || 0), 0);
  const total = Math.floor(soma * Math.min(100, Math.max(0, pct)) / 100);
  return { soma, total, barcos: Math.ceil(total / Math.max(1, cap)), ouro: +recursos.ouro || 0 };
}

// ---------- Flancos navais (Informe do fórum: perdas navais nos flancos) ----------
// N = Vida ÷ [ (1500 + UpAtk×10) × Forja − ArmForja − 180 − UpArm×10 ]
export function flancoNaval({ vida = 0, upAtk = 0, forja = 1, armForja = 0, upArm = 0 }) {
  const divisor = (1500 + upAtk * 10) * forja - armForja - 180 - upArm * 10;
  if (!(divisor > 0)) return { divisor, n: null };
  return { divisor, n: vida / divisor };
}

// ---------- Emboscada Abissal ----------
// Limite de 1.000 de peso. Escolhe a melhor mistura (mochila limitada) para o maior dano.
export function melhorAbissal(itens, limite = 1000) {
  const lista = itens
    .map(i => ({ ...i, peso: Math.round(+i.peso || 0), valor: (+i.dano || 0) * ((+i.efic || 100) / 100), max: Math.max(0, Math.floor(+i.disponivel || 0)) }))
    .filter(i => i.peso > 0 && i.valor > 0 && i.max > 0);
  const melhor = new Float64Array(limite + 1);
  const escolha = Array.from({ length: lista.length }, () => new Int32Array(limite + 1));
  lista.forEach((it, idx) => {
    // mochila limitada por "potências de 2" fica complexa; aqui fazemos por contagem (limite é pequeno)
    const antes = Float64Array.from(melhor);
    for (let c = 0; c <= limite; c++) {
      let best = antes[c], bestK = 0;
      for (let k = 1; k <= it.max && k * it.peso <= c; k++) {
        const v = antes[c - k * it.peso] + k * it.valor;
        if (v > best) { best = v; bestK = k; }
      }
      melhor[c] = best;
      escolha[idx][c] = bestK;
    }
  });
  // reconstrução
  let c = limite;
  const qtds = new Array(lista.length).fill(0);
  for (let idx = lista.length - 1; idx >= 0; idx--) {
    const k = escolha[idx][c];
    qtds[idx] = k;
    c -= k * lista[idx].peso;
  }
  const resultado = lista.map((it, i) => ({ nome: it.nome, qtd: qtds[i], dano: qtds[i] * it.valor, peso: qtds[i] * it.peso })).filter(r => r.qtd > 0);
  return { dano: melhor[limite], peso: resultado.reduce((a, r) => a + r.peso, 0), itens: resultado };
}

// ---------- Pré-batalha: alertas de composição ----------
export function analisarComposicao(tipo, unidades = {}, opts = {}) {
  const tem = linha => Object.entries(unidades).some(([id, n]) => { const u = unidadePorId(id); return u && u.tipo === tipo && u.linha === linha && n > 0; });
  const qtd = id => +unidades[id] || 0;
  const alertas = [];
  const total = Object.entries(unidades).filter(([id, n]) => unidadePorId(id)?.tipo === tipo && n > 0).length;
  if (!total) return [{ nivel: 'info', texto: 'Adicione unidades para analisar.' }];
  if (tipo === 'terra') {
    if (!tem('frente')) alertas.push({ nivel: 'erro', texto: 'Sem Linha de Frente (Hoplita/Gigante): o motor do jogo força o recuo do exército inteiro.' });
    if ((opts.muralha || 0) > 0 && !(qtd('morteiro') + qtd('catapulta') + qtd('ariete')))
      alertas.push({ nivel: 'erro', texto: `Alvo com muralha nível ${opts.muralha} e você não leva cerco (Morteiro, Catapulta ou Aríete).` });
    if (!qtd('cozinheiro')) alertas.push({ nivel: 'aviso', texto: 'Sem Cozinheiros: se a moral zerar, seu exército dispersa e só volta em 60 min.' });
    if (qtd('balao') && !qtd('girocoptero')) alertas.push({ nivel: 'aviso', texto: 'Balões sem Girocópteros: os girocópteros inimigos focam seus balões primeiro.' });
    if ((qtd('morteiro') || qtd('carabineiro')) && !opts.reposicao) alertas.push({ nivel: 'info', texto: 'Morteiros/Carabineiros têm munição contada: programe o timer de 45 min para a reposição.' });
  } else {
    if (!tem('principal')) alertas.push({ nivel: 'erro', texto: 'Sem Linha Principal (Lança-Chamas/Aríete a Vapor): recuo imediato, mesmo com Submergíveis e Lanchas.' });
    if (qtd('portabaloes') && !qtd('lancharapida') && opts.inimigoLanchas) alertas.push({ nivel: 'aviso', texto: 'Inimigo tem Lanchas Rápidas: elas caçam seus Porta-Balões.' });
    if (qtd('lancafoguetes') || opts.inimigoFoguetes) {
      if (qtd('arietevapor') && qtd('lancachamas') < 12) alertas.push({ nivel: 'aviso', texto: 'Contra Lança-Foguetes, ponha uma parede de Lança-Chamas (12, 36 ou 43) na frente dos Aríetes a Vapor.' });
    }
    if (!qtd('trirreme')) alertas.push({ nivel: 'info', texto: 'Sem Trirremes os flancos ficam vazios: os trirremes inimigos só lutam contra trirremes.' });
  }
  if (opts.alianca) alertas.push({ nivel: 'info', texto: 'Em batalha de aliança, as unidades com MENOS upgrade entram primeiro na frente.' });
  if (!alertas.some(a => a.nivel === 'erro')) alertas.unshift({ nivel: 'ok', texto: 'Composição válida: tem linha principal e não cai em recuo automático.' });
  return alertas;
}
