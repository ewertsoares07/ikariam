// INÍCIO — briefing do comandante: checklist pré-sono, alarmes e atalhos
import * as T from '../timers.js';
import { vinhoAgora, corrupcao, resumoExercito } from '../calc.js';
import { PRESETS_GUERRA } from '../data.js';
import { esc, fmt, fmtDur, fmtPct, fmtQuando } from '../ui.js';
import { timerHtml, ligarTimers, novoTimerFolha } from './comum.js';

function saudacao() {
  const h = new Date().getHours();
  return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function checklist(s, agora = Date.now()) {
  const itens = [];
  const cs = s.cidades;
  const total = cs.length;
  if (!total) return itens;
  const vinho = cs.map(c => ({ c, v: vinhoAgora(c.vinho, agora) }));
  const menos24 = vinho.filter(x => x.v && x.v.segRest < 86400).sort((a, b) => a.v.segRest - b.v.segRest);
  const semDado = vinho.filter(x => !x.v);
  itens.push(menos24.length
    ? { st: 'ruim', t: `${menos24.length} cidade(s) com menos de 24h de vinho`, d: menos24.map(x => `${x.c.nome} (${fmtDur(x.v.segRest, true)})`).join(' · '), ir: 'imperio' }
    : { st: 'ok', t: 'Vinho garantido por 24h em todas as tavernas', d: semDado.length ? `${semDado.length} cidade(s) sem dados de vinho` : 'Pode dormir tranquilo 🍇', ir: 'imperio' });
  const semAlarme = cs.filter(c => !c.alarme);
  itens.push(semAlarme.length
    ? { st: 'aviso', t: `${semAlarme.length} porto(s) sem Barco Alarme`, d: semAlarme.map(c => c.nome).slice(0, 6).join(' · ') + (semAlarme.length > 6 ? '…' : ''), ir: 'imperio' }
    : { st: 'ok', t: 'Barco Alarme em todos os portos', d: '1 LC ou 1 Trirreme trava a pilhagem por 1 rodada' });
  const fora = cs.filter(c => c.militar?.fora && Object.values(c.militar.unidades || {}).some(n => n > 0));
  if (fora.length) {
    const custo = fora.reduce((a, c) => a + resumoExercito(c.militar.unidades, true).manutReal, 0);
    itens.push({ st: 'aviso', t: `Tropas fora de casa pagando 2×`, d: `${fora.map(c => c.nome).join(' · ')} · ${fmt(custo)} ouro/h`, ir: 'militar' });
  } else itens.push({ st: 'ok', t: 'Nenhuma tropa pagando manutenção dobrada', d: 'Tudo estacionado em casa' });
  const corruptas = cs.filter(c => c.residencia != null && corrupcao(c.residencia, total) > 0);
  if (corruptas.length) itens.push({ st: 'ruim', t: `Corrupção em ${corruptas.length} cidade(s)`, d: corruptas.map(c => `${c.nome} ${fmtPct(corrupcao(c.residencia, total))}`).join(' · ') + ` · precisa nível ${total - 1}`, ir: 'imperio' });
  const subs = cs.filter(c => (c.militar?.unidades?.submergivel || 0) > 0 && !c.militar?.fora);
  if (subs.length) itens.push({ st: 'aviso', t: 'Submergíveis parados no porto', d: `${subs.map(c => c.nome).join(' · ')}: caros de manter; use LC/Trirreme como alarme` });
  const moveis = cs.filter(c => c.papel === 'movel' && c.movel?.ativa);
  for (const m of moveis) {
    const feitos = Object.values(m.movel.checklist || {}).filter(Boolean).length;
    if (feitos < 4) itens.push({ st: 'aviso', t: `Cidade móvel ${m.nome}: ${feitos}/4 da implantação`, d: 'Abra no Império para ver o que falta', ir: 'imperio' });
  }
  const noite = s.timers.filter(t => t.fim > agora && t.fim - agora < 8 * 3600e3);
  if (noite.length) itens.push({ st: 'aviso', t: `${noite.length} alarme(s) nas próximas 8h`, d: 'Leve para a Google Agenda para tocar com o app fechado', ir: 'cronometros' });
  return itens;
}

export function render(raiz, ctx) {
  const { s, cloud, ir, app } = ctx;
  const agora = Date.now();
  const nome = cloud.estado.usuario?.nome?.split(' ')[0] || s.config.nomeJogador || 'comandante';
  const ativos = s.timers.filter(t => t.fim > agora || (t.fim > agora - 3600e3 && t.alertado));
  const lista = checklist(s, agora);
  const okCount = lista.filter(i => i.st === 'ok').length;
  const piorVinho = s.cidades.map(c => vinhoAgora(c.vinho, agora)).filter(Boolean).sort((a, b) => a.segRest - b.segRest)[0];
  const membro = ['membro', 'oficial', 'admin'].includes(cloud.papel());
  let proxOp = null;
  if (membro) proxOp = cloud.lista('ops').filter(o => o.impacto > agora - 3600e3).sort((a, b) => a.impacto - b.impacto)[0];

  raiz.innerHTML = `
  <div class="hero">
    <h2>${saudacao()}, ${esc(nome)}</h2>
    <div class="relogio" data-relogio>${new Date().toLocaleTimeString('pt-BR')}</div>
    <div class="linha-chips">
      <span class="chip">🏘️ ${s.cidades.length} cidades</span>
      ${piorVinho ? `<span class="chip ${piorVinho.nivel === 'vermelho' ? 'vermelho' : piorVinho.nivel === 'amarelo' ? 'amarelo' : ''}">🍇 menor: ${fmtDur(piorVinho.segRest, true)}</span>` : ''}
      <span class="chip">⏱️ ${s.timers.filter(t => t.fim > agora).length} alarmes</span>
      <span class="chip">${cloud.estado.usuario ? (cloud.estado.online ? '☁️ nuvem' : '📴 offline') : '📱 local'}</span>
    </div>
  </div>

  ${!s.cidades.length ? `
  <div class="card destaque">
    <div class="card-topo"><span class="ic-q">🚀</span><h3>Comece em 2 minutos</h3></div>
    <p class="dica">Cadastre as cidades uma vez. Depois o app só pede o vinho quando você abastecer: nada de atualizar recurso toda hora.</p>
    <button class="btn ouro bloco" data-ir="imperio">🏘️ Cadastrar cidades</button>
    ${!cloud.estado.usuario ? '<button class="btn egeu bloco" style="margin-top:10px" data-ir="sistema/conta">☁️ Entrar com Google (nuvem e aliança)</button>' : ''}
  </div>` : `
  <div class="card">
    <div class="card-topo"><span class="ic-q">🌙</span><h3>Checklist pré-sono</h3><div class="dir"><span class="chip ${okCount === lista.length ? 'verde' : 'amarelo'}">${okCount}/${lista.length} ok</span></div></div>
    ${lista.map(i => `<div class="check ${i.st}" ${i.ir ? `data-ir="${i.ir}" role="button"` : ''}><span class="st">${i.st === 'ok' ? '✓' : '!'}</span><div><b>${esc(i.t)}</b><small>${esc(i.d || '')}</small></div></div>`).join('')}
  </div>`}

  ${proxOp ? `
  <div class="card destaque" data-ir="alianca/ops" role="button">
    <div class="card-topo"><span class="ic-q">⚔️</span><h3>Operação da aliança</h3><div class="dir"><span class="chip ouro">impacto ${esc(fmtQuando(proxOp.impacto))}</span></div></div>
    <b>${esc(proxOp.nome)}</b> <span class="mut">→ [${esc(proxOp.alvo || '?')}]</span>
    <div class="mut pequeno">Faltam <span class="contagem" data-fim="${proxOp.impacto}">…</span> · toque para ver sua hora de partida</div>
  </div>` : ''}

  <div class="card">
    <div class="card-topo"><span class="ic-q">⏱️</span><h3>Próximos alarmes</h3><div class="dir"><button class="btn mini" data-novo-timer>＋ Novo</button></div></div>
    ${ativos.length ? ativos.slice(0, 4).map(t => timerHtml(t, agora)).join('') + (ativos.length > 4 ? `<button class="btn fantasma bloco mini" data-ir="cronometros">Ver todos (${ativos.length})</button>` : '') : '<div class="vazio">Nenhum alarme. Use os atalhos abaixo 👇</div>'}
  </div>

  <div class="card">
    <h3><span class="ic-q">⚡</span>Atalhos de guerra</h3>
    <div class="atalhos">
      ${PRESETS_GUERRA.map(p => `<button class="atalho" data-preset="${p.id}"><span class="ic">${p.icone}</span>${esc(p.nome)}<small class="mut">${p.min} min</small></button>`).join('')}
      <button class="atalho" data-ir="militar/viagem"><span class="ic">🧭</span>Viagem<small class="mut">ida e volta</small></button>
      <button class="atalho" data-ir="alvos/saque"><span class="ic">💰</span>Saque<small class="mut">barcos</small></button>
      <button class="atalho" data-ir="alvos/novo"><span class="ic">📋</span>Colar relatório<small class="mut">espionagem</small></button>
      <button class="atalho" data-ir="imperio"><span class="ic">🍇</span>Vinho<small class="mut">abastecer</small></button>
    </div>
  </div>

  ${app.podeInstalar() && !app.instalado() ? `<div class="card destaque"><div class="flex"><span class="ic-q">📲</span><div class="cresce"><b>Instale no celular</b><div class="mut pequeno">Abre como app, em tela cheia e sem internet.</div></div><button class="btn ouro mini" data-instalar>Instalar</button></div></div>` : ''}
  ${!cloud.estado.usuario && s.cidades.length ? `<div class="card"><div class="flex"><span class="ic-q">🤝</span><div class="cresce"><b>Traga sua aliança</b><div class="mut pequeno">Entre com Google para salvar na nuvem, operações sincronizadas e alvos compartilhados.</div></div><button class="btn egeu mini" data-ir="sistema/conta">Entrar</button></div></div>` : ''}
  <p class="rodape-app">Comando Imperial 2.0 · feito para não te prender no jogo</p>`;

  ligarTimers(raiz);
  raiz.addEventListener('click', e => {
    const irEl = e.target.closest('[data-ir]');
    if (irEl) { const [r, sub] = irEl.dataset.ir.split('/'); ir(r, sub); return; }
    const p = e.target.closest('[data-preset]');
    if (p) { const pr = PRESETS_GUERRA.find(x => x.id === p.dataset.preset); T.novoTimer({ nome: pr.nome, icone: pr.icone, seg: pr.min * 60, tipo: pr.id }); return; }
    if (e.target.closest('[data-novo-timer]')) novoTimerFolha();
    if (e.target.closest('[data-instalar]')) app.instalar();
  });
}
