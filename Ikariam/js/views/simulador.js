// SIMULADOR DE COMBATE — tabuleiro interativo (terrestre e naval), estilo do campo do Ikariam:
// inimigo em cima, você embaixo, frente a frente. Tocar num espaço abre o teclado numérico.
import * as store from '../store.js';
import { LINHAS, LC_PRESETS, COMBATE } from '../data.js';
import { ladoVazio, distribuir, rodada, situacao, posicao, unidadesDaLinha, capacidade, encherSlot, preencherLinha, contar, totalLado, noCampo, pctVida, clonar, frenteDe } from '../combate.js';
import { analisarComposicao, generaisUnidade, unidadePorId } from '../calc.js';
import { icone, iconeUnidade } from '../icones.js';
import { esc, fmt, fmtK, toast, modal, pedirCampos, pedirNumero, confirmar, lerNumero, vibrar } from '../ui.js';
import { alertasHtml, seletorCidade } from './comum.js';

// Cores das linhas (pedido do layout): vermelho frente · amarelo flancos · laranja longo · azul artilharia
// Aéreo: terra = verde Girocóptero / roxo Balão · mar = verde Porta-Balões / roxo Lancha Rápida
const COR = {
  terra: { frente: 'vermelho', flanco: 'amarelo', longo: 'laranja', artilharia: 'azul', caca: 'verde', bombardeio: 'roxo' },
  mar: { principal: 'vermelho', flanco: 'amarelo', longo: 'laranja', artilharia: 'azul', caca: 'roxo', bombardeio: 'verde' },
};
const FANTASMA = {
  terra: { frente: 'hoplita', flanco: 'espadachim', longo: 'carabineiro', artilharia: 'morteiro', caca: 'girocoptero', bombardeio: 'balao' },
  mar: { principal: 'lancachamas', flanco: 'trirreme', longo: 'barcomorteiro', artilharia: 'submergivel', caca: 'lancharapida', bombardeio: 'portabaloes' },
};
const NOME_LADO = { ini: 'Inimigo', meu: 'Você' };
const ICONE_FAIXA = { recuo: 'bandeira', impasse: 'balanca', alianca: 'espadas', vitoria: 'louros', derrota: 'bandeira' };

const novoEstado = tipo => ({ ini: ladoVazio(tipo), meu: ladoVazio(tipo), rodada: 0, inicio: null, faixas: [], ultima: null, marcas: null });

function estado(ctx) {
  const sim = (ctx.mem.sim ||= { tipo: 'mar', alianca: false });
  sim.mar ||= novoEstado('mar');
  sim.terra ||= novoEstado('terra');
  return { sim, est: sim[sim.tipo] };
}

const nomeLinha = (tipo, linha) => LINHAS[tipo].find(l => l.id === linha)?.nome || linha;

function slotHtml(tipo, ladoId, linha, i, s, marcas) {
  const p = posicao(linha, i);
  const fileira = ladoId === 'ini' ? 5 - p.lin : p.lin; // o inimigo fica espelhado: a frente encosta no centro
  const c = COMBATE[s.u];
  const estado = s.q > 0 ? 'cheio' : s.u ? 'morto' : 'vazio';
  const pct = s.q > 0 ? pctVida(s) : 0;
  const k = `${ladoId}.${linha}.${i}`;
  const reforco = marcas?.includes(k);
  const dica = s.q > 0 ? `${unidadePorId(s.u).nome}: ${fmt(s.q)} de ${fmt(capacidade(s.u))}${s.mun === 0 ? ' · sem munição' : s.mun != null ? ` · munição ${s.mun}` : ''}` : `${nomeLinha(tipo, linha)} · vazio`;
  return `<button type="button" class="slot cor-${COR[tipo][linha]} ${estado} ${s.mun === 0 ? 'semmun' : ''} ${reforco ? 'reforco' : ''} ${s.q > 0 && s.q < capacidade(s.u) ? 'parcial' : ''}"
    style="grid-column:${p.col};grid-row:${fileira}" data-slot="${k}" aria-label="${esc(dica)}" title="${esc(dica)}">
    <span class="slot-ic">${s.u ? iconeUnidade(s.u, { tam: 22, traco: 2.8 }) : icone(FANTASMA[tipo][linha], { tam: 20, cls: 'fantasma', traco: 2.4 })}</span>
    ${s.q > 0 ? `<b class="qtd">${fmtK(s.q)}</b>` : ''}${s.mun === 0 && s.q > 0 ? '<span class="sem-mun">∅</span>' : ''}
    <i class="hp" aria-hidden="true"><i style="width:${pct}%"></i></i>${c && s.q > 0 && s.dano > 0 ? '<span class="ferido"></span>' : ''}
  </button>`;
}

function campoHtml(tipo, ladoId, lado, marcas) {
  const res = Object.values(lado.reserva || {}).reduce((a, b) => a + b, 0);
  const slots = Object.entries(lado.linhas).map(([linha, arr]) => arr.map((s, i) => slotHtml(tipo, ladoId, linha, i, s, marcas)).join('')).join('');
  return `<div class="campo-lado ${ladoId}">${slots}
    <div class="lado-rot" style="grid-column:3/8;grid-row:${ladoId === 'ini' ? 1 : 4}">
      <b>${NOME_LADO[ladoId]}</b><small>${fmt(noCampo(lado))} no campo${res ? ` · ${fmt(res)} na reserva` : ''}</small></div></div>`;
}

function faixasHtml(est, nova = false) {
  const rot = est.rodada ? `Rodada ${est.rodada} · ${est.rodada * 15} min` : 'Monte os lados e simule';
  return `<span class="rodada-rot">${icone('espadas', { tam: 14 })} ${rot}</span>
    ${est.faixas.map(f => `<div class="faixa ${f.tipo} ${nova ? 'nova' : ''}">${icone(ICONE_FAIXA[f.tipo.split(' ')[0]] || 'escudoAlerta', { tam: 20 })}<div><b>${esc(f.titulo)}</b><small>${esc(f.texto)}</small></div></div>`).join('')}`;
}

function cabLado(ladoId, est, tipo, s) {
  const lado = est[ladoId];
  const res = Object.values(lado.reserva || {}).reduce((a, b) => a + b, 0);
  const temAlvos = s.alvos.some(a => Object.keys(a.unidades || {}).some(id => unidadePorId(id)?.tipo === tipo));
  const puxar = ladoId === 'meu'
    ? seletorCidade('puxar-meu', '', 'class="entrada lado-sel" aria-label="Puxar exército de uma cidade"', 'Puxar de cidade…')
    : `<select name="puxar-ini" class="entrada lado-sel" aria-label="Puxar de um alvo espionado"><option value="">${temAlvos ? 'Puxar de alvo…' : 'Sem alvo espionado'}</option>${s.alvos.filter(a => Object.keys(a.unidades || {}).length).map(a => `<option value="${a.id}">${esc(a.nome || 'Alvo')}${a.coords ? ` [${esc(a.coords)}]` : ''}</option>`).join('')}</select>`;
  return `<div class="lado-cab ${ladoId}">
    <span class="lado-nome">${icone(ladoId === 'ini' ? 'bandeira' : 'elmo', { tam: 18 })}${NOME_LADO[ladoId]}</span>
    <button type="button" class="chip" data-reserva="${ladoId}" data-balao="Unidades fora do campo: entram nos espaços que esvaziarem entre as rodadas.">Reserva ${fmt(res)}</button>
    <button type="button" class="chip ${lado.up.dano || lado.up.arm ? 'ouro' : ''}" data-oficina="${ladoId}">${icone('bigorna', { tam: 14 })} +${lado.up.dano}/+${lado.up.arm}</button>
    ${puxar}</div>`;
}

const perdasHtml = (perdas = {}) => {
  const lista = Object.entries(perdas).filter(([, n]) => n > 0);
  if (!lista.length) return '<span class="mut pequeno">sem baixas</span>';
  const gen = lista.reduce((a, [id, n]) => a + n * generaisUnidade(unidadePorId(id)), 0);
  return `<div class="perdas">${lista.map(([id, n]) => `<span class="perda">${iconeUnidade(id, { tam: 16 })}${fmt(n)}</span>`).join('')}</div><small class="mut">${fmt(gen, 1)} generais</small>`;
};

export function render(raiz, ctx) {
  const { s } = ctx;
  const { sim, est } = estado(ctx);
  const tipo = sim.tipo;
  const marcas = est.marcas; est.marcas = null; // brilho de reforço só no primeiro desenho
  const cIni = contar(est.ini), cMeu = contar(est.meu);
  const alertas = totalLado(est.meu) ? analisarComposicao(tipo, cMeu, { alianca: sim.alianca, inimigoLanchas: !!cIni.lancharapida, inimigoFoguetes: !!cIni.lancafoguetes }) : [];
  if (!est.rodada) est.faixas = situacao(tipo, est.ini, est.meu, { alianca: sim.alianca });

  raiz.innerHTML = `
  <div class="seg"><button class="${tipo === 'mar' ? 'ativo' : ''}" data-tipo="mar">${icone('trirreme', { tam: 16 })} Naval</button><button class="${tipo === 'terra' ? 'ativo' : ''}" data-tipo="terra">${icone('hoplita', { tam: 16 })} Terrestre</button></div>
  <div class="card tab-card">
    ${cabLado('ini', est, tipo, s)}
    <div class="tabuleiro ${tipo}" data-tab>
      ${campoHtml(tipo, 'ini', est.ini, marcas)}
      <div class="tab-centro" data-centro>${faixasHtml(est)}</div>
      ${campoHtml(tipo, 'meu', est.meu, marcas)}
    </div>
    ${cabLado('meu', est, tipo, s)}
    <div class="tab-acoes">
      <button type="button" class="btn ouro tab-simular" data-simular>${icone('espadas', { tam: 20 })} Simular Rodada</button>
      <button type="button" class="btn" data-reiniciar ${est.inicio ? '' : 'disabled'} aria-label="Voltar ao início da batalha">${icone('reagrupar', { tam: 18 })}</button>
      <button type="button" class="btn" data-limpar aria-label="Limpar o tabuleiro">🧹</button>
    </div>
    <label class="marcar tab-alianca"><input type="checkbox" data-alianca ${sim.alianca ? 'checked' : ''}> ${icone('espadas', { tam: 16 })} Combate em aliança</label>
    <p class="pequeno mut" style="margin:8px 2px 0">Toque num espaço para pôr a unidade e a quantidade. A barra embaixo é a vida do espaço.</p>
  </div>

  ${est.ultima ? `<div class="card"><h3><span class="ic-q">${icone('balanca', { tam: 18 })}</span>Rodada ${est.rodada}: baixas</h3>
    <div class="grade2"><div class="kpi"><span>Inimigo perdeu</span>${perdasHtml(est.ultima.perdas.ini)}</div><div class="kpi"><span>Você perdeu</span>${perdasHtml(est.ultima.perdas.meu)}</div></div>
    <p class="pequeno mut" style="margin:8px 2px 0">Dano que passou da armadura: você ${fmt(est.ultima.danoTotal.meu)} · inimigo ${fmt(est.ultima.danoTotal.ini)}.</p></div>` : ''}

  ${alertas.length ? `<div class="card destaque"><h3><span class="ic-q">${icone('escudoAlerta', { tam: 18 })}</span>Leitura do estrategista</h3>${alertasHtml(alertas)}</div>` : ''}

  <div class="card"><h3><span class="ic-q">${icone('alvo', { tam: 18 })}</span>Quem ataca quem</h3>
    ${LINHAS[tipo].filter(l => COR[tipo][l.id]).map(l => `<div class="legenda-l"><span class="cor-pt cor-${COR[tipo][l.id]}"></span><div><b>${esc(l.nome)}</b><small>${esc(l.alvo)}</small></div></div>`).join('')}
    <details class="ajuda"><summary>Como o simulador calcula</summary>Campo Grande (Prefeitura/Porto 25+). Cada tiro fere uma unidade: dano da arma + Oficina − armadura do alvo; o que passa da vida dela se perde. Acertos = quantidade × precisão. A reserva completa os espaços entre as rodadas. Os números das unidades ficam em <b>data.js → COMBATE</b> (os marcados "conferir" podem ser ajustados). É uma estimativa: o jogo espalha os tiros entre espaços vizinhos.</details>
  </div>`;

  raiz.addEventListener('click', async e => {
    const t = e.target;
    const tp = t.closest('[data-tipo]'); if (tp) { sim.tipo = tp.dataset.tipo; return ctx.atualizar(); }
    const sl = t.closest('[data-slot]'); if (sl) { const [l, linha, i] = sl.dataset.slot.split('.'); return editarSlot(ctx, est, tipo, l, linha, +i); }
    if (t.closest('[data-simular]')) return simular(raiz, ctx, sim, est);
    const of = t.closest('[data-oficina]'); if (of) return oficina(ctx, est[of.dataset.oficina], of.dataset.oficina);
    const rs = t.closest('[data-reserva]'); if (rs && !t.closest('.balao')) return reserva(ctx, est, tipo, rs.dataset.reserva);
    if (t.closest('[data-reiniciar]') && est.inicio) { Object.assign(est, { ...clonar(est.inicio), rodada: 0, inicio: null, ultima: null }); toast('↺ De volta ao começo da batalha'); return ctx.atualizar(); }
    if (t.closest('[data-limpar]') && await confirmar('Limpar o tabuleiro?', 'Apaga os dois lados desta simulação.', 'Limpar', true)) { sim[tipo] = novoEstado(tipo); return ctx.atualizar(); }
  });
  raiz.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-alianca]')) { sim.alianca = t.checked; return ctx.atualizar(); }
    if (t.name === 'puxar-meu' && t.value) {
      const c = store.cidade(t.value);
      est.meu = distribuir(tipo, c?.militar?.unidades || {}, est.meu.up);
      reiniciarBatalha(est);
      toast(totalLado(est.meu) ? `${c.nome}: ${fmt(totalLado(est.meu))} unidades no campo` : `${c.nome} não tem tropas ${tipo === 'mar' ? 'navais' : 'de terra'}`, totalLado(est.meu) ? 'ok' : 'erro');
      return ctx.atualizar();
    }
    if (t.name === 'puxar-ini' && t.value) {
      const a = s.alvos.find(x => x.id === t.value);
      est.ini = distribuir(tipo, a?.unidades || {}, est.ini.up);
      reiniciarBatalha(est);
      toast(totalLado(est.ini) ? `${a.nome}: ${fmt(totalLado(est.ini))} unidades` : 'Esse alvo não tem unidades deste tipo', totalLado(est.ini) ? 'ok' : 'erro');
      return ctx.atualizar();
    }
  });
}

function reiniciarBatalha(est) { est.rodada = 0; est.inicio = null; est.ultima = null; est.faixas = []; }

// ---------- Rodada animada ----------
function simular(raiz, ctx, sim, est) {
  if (sim.animando) return;
  const tipo = sim.tipo;
  if (!totalLado(est.ini) || !totalLado(est.meu)) return toast('Ponha unidades nos dois lados', 'erro');
  const f = frenteDe(tipo);
  const fim = est.faixas.find(x => ['vitoria', 'derrota', 'impasse'].includes(x.tipo) || (x.tipo === 'recuo' && est.rodada));
  if (fim && est.rodada) return toast(`${fim.titulo}: reinicie ou mude os lados`, 'erro');
  if (!est.inicio) est.inicio = clonar({ ini: est.ini, meu: est.meu });
  const r = rodada(tipo, est.ini, est.meu);
  const tab = raiz.querySelector('[data-tab]');
  const q = k => tab.querySelector(`[data-slot="${k}"]`);
  sim.animando = true;
  tab.classList.add('lutando');
  r.disparos.forEach(k => q(k)?.classList.add('dispara'));
  vibrar([30, 40, 30]);
  setTimeout(() => {
    for (const [k, info] of Object.entries(r.atingidos)) {
      const el = q(k);
      if (!el) continue;
      el.classList.remove('dispara');
      el.classList.add('atingido');
      const barra = el.querySelector('.hp > i');
      if (barra) barra.style.width = info.pct + '%';
      const b = el.querySelector('.qtd');
      if (b) b.textContent = info.destruido ? '0' : fmtK(info.q);
      if (info.destruido) el.classList.add('destruido');
      if (info.mortos) el.insertAdjacentHTML('beforeend', `<span class="baixa">−${fmtK(info.mortos)}</span>`);
    }
    est.ini = r.ini; est.meu = r.meu; est.rodada++;
    est.ultima = { perdas: r.perdas, danoTotal: r.danoTotal };
    est.faixas = situacao(tipo, est.ini, est.meu, { rodou: true, danoTotal: r.danoTotal, alianca: sim.alianca });
    est.marcas = [...r.reforcos.ini.map(x => `ini.${x.linha}.${x.i}`), ...r.reforcos.meu.map(x => `meu.${x.linha}.${x.i}`)];
    const centro = raiz.querySelector('[data-centro]');
    if (centro) centro.innerHTML = faixasHtml(est, true);
    if (est.faixas.some(x => x.tipo === 'recuo' || x.tipo === 'impasse' || x.tipo === 'derrota')) vibrar([80, 60, 80]);
  }, 420);
  setTimeout(() => { sim.animando = false; ctx.atualizar(); }, 2100);
  void f;
}

// ---------- Popover do espaço: unidade + teclado numérico + atalhos ----------
function editarSlot(ctx, est, tipo, ladoId, linha, i) {
  const lado = est[ladoId];
  const s = lado.linhas[linha][i];
  const raras = store.get().config.mostrarRaras;
  const opcoes = unidadesDaLinha(tipo, linha).filter(u => raras || !u.raro || u.id === s.u);
  if (!opcoes.length) return;
  let uSel = s.u && opcoes.some(o => o.id === s.u) ? s.u : opcoes[0].id;
  const n = lado.linhas[linha].length;
  const f = modal({
    titulo: `${NOME_LADO[ladoId]} · ${nomeLinha(tipo, linha)}`, sub: `Espaço ${i + 1} de ${n}`, classe: 'md-slot',
    html: `<form novalidate>
      ${opcoes.length > 1 ? `<div class="md-rotulo">Unidade</div><div class="slot-unis">${opcoes.map(u => `<button type="button" class="slot-uni ${u.id === uSel ? 'ativo' : ''}" data-u="${u.id}">${iconeUnidade(u.id, { tam: 28 })}<small>${esc(u.nome)}</small></button>`).join('')}</div>` : ''}
      <div class="md-rotulo" data-rotulo></div>
      <div class="md-visor"><button type="button" class="md-passo" data-passo="-1" aria-label="Menos">−</button>
        <input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" data-v value="${s.q > 0 ? s.q : ''}" placeholder="0" aria-label="Quantidade">
        <button type="button" class="md-passo" data-passo="1" aria-label="Mais">+</button></div>
      <div class="md-atalhos" data-atalhos></div>
      <label class="marcar" style="margin-top:10px"><input type="checkbox" data-todos> Aplicar em todos os ${n} espaços da linha</label>
      <div class="slot-ficha" data-ficha></div>
      <div class="fl-botoes"><button type="button" class="btn" data-fechar>Cancelar</button><button type="submit" class="btn ouro">Pôr no campo</button></div>
    </form>`,
  });
  const corpo = f.corpo;
  const inp = corpo.querySelector('[data-v]');
  const desenhar = () => {
    const u = unidadePorId(uSel), c = COMBATE[uSel], cap = capacidade(uSel);
    corpo.querySelector('[data-rotulo]').textContent = `Quantidade · cabem ${cap} ${u.nome}`;
    const presets = uSel === 'lancachamas' ? LC_PRESETS.map(p => `<button type="button" class="md-atalho" data-preset="${p.id}"><small>LC Tank</small><b>${p.qtd} LCs</b><small>${p.slots} espaço${p.slots > 1 ? 's' : ''}${p.qtd > p.slots * cap ? ` + ${p.qtd - p.slots * cap} reserva` : ''}</small></button>`).join('') : '';
    corpo.querySelector('[data-atalhos]').innerHTML = `<button type="button" class="md-atalho" data-cheio><small>Espaço cheio</small><b>${cap}</b></button>
      <button type="button" class="md-atalho" data-vazio><small>Esvaziar</small><b>0</b></button>${presets}`;
    corpo.querySelector('[data-ficha]').innerHTML = `${iconeUnidade(uSel, { tam: 22 })}<span>Vida <b>${c.hp}</b></span><span>Armadura <b>${c.arm}</b></span><span>Dano <b>${c.dano}</b></span><span>Acerto <b>${Math.round(c.prec * 100)}%</b></span>${c.mun ? `<span>Munição <b>${c.mun}</b></span>` : ''}`;
  };
  desenhar();
  corpo.addEventListener('click', e => {
    const b = e.target.closest('[data-u]');
    if (b) { uSel = b.dataset.u; corpo.querySelectorAll('[data-u]').forEach(x => x.classList.toggle('ativo', x === b)); desenhar(); vibrar(8); return; }
    const p = e.target.closest('[data-passo]');
    if (p) { inp.value = String(Math.max(0, (lerNumero(inp.value) || 0) + +p.dataset.passo)); vibrar(8); return; }
    if (e.target.closest('[data-cheio]')) { inp.value = String(capacidade(uSel)); return; }
    if (e.target.closest('[data-vazio]')) { inp.value = '0'; return; }
    const pr = e.target.closest('[data-preset]');
    if (pr) {
      const pre = LC_PRESETS.find(x => x.id === pr.dataset.preset);
      delete lado.reserva.lancachamas;
      preencherLinha(lado, linha, 'lancachamas', pre.qtd, pre.slots);
      toast(`🔥 ${pre.titulo}`, 'ok');
      f.fechar(); ctx.atualizar();
    }
  });
  corpo.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    let q = lerNumero(inp.value) ?? 0;
    if (Number.isNaN(q) || q < 0) { inp.closest('.md-visor').classList.add('md-erro'); return; }
    const cap = capacidade(uSel);
    const todos = corpo.querySelector('[data-todos]').checked;
    const alvos = todos ? lado.linhas[linha] : [s];
    let sobra = 0;
    for (const x of alvos) { const v = Math.min(cap, q); sobra += q - v; encherSlot(x, uSel, v); }
    if (sobra > 0) { lado.reserva[uSel] = (lado.reserva[uSel] || 0) + sobra; toast(`Cabem ${cap} por espaço: ${fmt(sobra)} foram para a reserva`); }
    f.fechar(); ctx.atualizar();
  });
  setTimeout(() => { inp.focus({ preventScroll: true }); inp.select(); }, 320);
}

async function oficina(ctx, lado, ladoId) {
  const r = await pedirCampos({
    titulo: `⚒️ Oficina · ${NOME_LADO[ladoId]}`, sub: 'Níveis de melhoria das unidades',
    dica: 'Cada nível soma dano/armadura: +1 nas tropas de terra, +2 nos navios (Oficina do jogo).',
    campos: [{ name: 'dano', rotulo: 'Nível de dano', valor: lado.up.dano || '' }, { name: 'arm', rotulo: 'Nível de armadura', valor: lado.up.arm || '' }],
  });
  if (!r) return;
  lado.up = { dano: Math.max(0, r.dano || 0), arm: Math.max(0, r.arm || 0) };
  ctx.atualizar();
}

function reserva(ctx, est, tipo, ladoId) {
  const lado = est[ladoId];
  const raras = store.get().config.mostrarRaras;
  const lista = Object.keys(COMBATE).map(unidadePorId).filter(u => u && u.tipo === tipo && (raras || !u.raro || lado.reserva[u.id]));
  const html = () => `<div class="mn-vidro">${lista.map(u => `<div class="mn-item" data-ru="${u.id}"><span class="ic">${iconeUnidade(u.id, { tam: 22 })}</span><span class="meio"><b>${esc(u.nome)}</b><small>${esc(nomeLinha(tipo, u.linha))}</small></span><b class="num">${fmt(lado.reserva[u.id] || 0)}</b></div>`).join('')}</div>
    <div class="fl-botoes"><button class="btn ouro" data-fechar>Pronto</button></div>`;
  const f = modal({ titulo: `Reserva · ${NOME_LADO[ladoId]}`, sub: 'Entram nos espaços que esvaziarem', html: html() });
  f.corpo.addEventListener('click', async e => {
    const it = e.target.closest('[data-ru]'); if (!it) return;
    const u = unidadePorId(it.dataset.ru);
    const n = await pedirNumero({ titulo: u.nome, sub: 'Na reserva', valor: lado.reserva[u.id] || '', min: 0, passos: [-10, 10, 50], limpar: true });
    if (n === undefined) return;
    if (n > 0) lado.reserva[u.id] = n; else delete lado.reserva[u.id];
    f.corpo.innerHTML = html();
    ctx.atualizar();
  });
}
