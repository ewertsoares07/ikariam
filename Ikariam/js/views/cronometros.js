// CRONÔMETROS — alarmes, pirataria e recarga dos milagres
import * as store from '../store.js';
import * as T from '../timers.js';
import { PRESETS_GUERRA, PIRATARIA, MILAGRES } from '../data.js';
import { esc, fmtDur, pedirNumero } from '../ui.js';
import { timerHtml, ligarTimers, novoTimerFolha } from './comum.js';

const ABAS = [['', '⏱️ Alarmes'], ['pirataria', '🏴‍☠️ Pirataria'], ['milagres', '🗿 Milagres']];

export function render(raiz, ctx) {
  const sub = ABAS.some(a => a[0] === ctx.sub) ? ctx.sub : '';
  raiz.innerHTML = `<div class="tela-titulo"><div><h2>Cronômetros</h2><p>Alarme com som, vibração e voz</p></div><div class="acoes"><button class="btn ouro mini" data-novo>＋ Novo</button></div></div>
    <div class="seg">${ABAS.map(([id, n]) => `<button class="${id === sub ? 'ativo' : ''}" data-aba="${id}">${n}</button>`).join('')}</div><div data-c></div>`;
  raiz.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b) ctx.ir('cronometros', b.dataset.aba); });
  raiz.querySelector('[data-novo]').onclick = () => novoTimerFolha();
  const c = raiz.querySelector('[data-c]');
  if (sub === 'pirataria') return pirataria(c);
  if (sub === 'milagres') return milagres(c, ctx);
  alarmes(c, ctx);
}

function alarmes(raiz, ctx) {
  const { s } = ctx;
  const agora = Date.now();
  const ativos = s.timers.filter(t => t.fim > agora);
  const feitos = s.timers.filter(t => t.fim <= agora);
  const perm = 'Notification' in window ? Notification.permission : 'indisponivel';
  raiz.innerHTML = `
  <div class="card">
    <div class="card-topo"><span class="ic-q">⏳</span><h3>Rodando</h3><div class="dir">${ativos.length ? '<button class="btn mini" data-ics>📅 Todos na agenda</button>' : ''}</div></div>
    ${ativos.map(t => timerHtml(t, agora)).join('') || '<div class="vazio">Nenhum cronômetro rodando.</div>'}
  </div>
  <div class="card">
    <h3><span class="ic-q">⚡</span>Rápidos de guerra</h3>
    <div class="atalhos">${PRESETS_GUERRA.map(p => `<button class="atalho" data-preset="${p.id}"><span class="ic">${p.icone}</span>${esc(p.nome)}<small class="mut">${p.min} min</small></button>`).join('')}</div>
  </div>
  ${feitos.length ? `<div class="card"><div class="card-topo"><span class="ic-q">✅</span><h3>Concluídos</h3><div class="dir"><button class="btn mini" data-limpar>🧹 Limpar</button></div></div>${feitos.slice(-6).reverse().map(t => timerHtml(t, agora)).join('')}</div>` : ''}
  <div class="card">
    <h3><span class="ic-q">📵</span>E com o app fechado?</h3>
    <p class="dica">Nenhum site consegue tocar alarme com o app fechado. Por isso cada cronômetro tem <b>⋯ › Pôr na Google Agenda</b>: a agenda do celular toca na hora certa, mesmo offline do jogo.</p>
    <div class="flex entre"><span class="pequeno">Notificações do app: <b>${perm === 'granted' ? '✅ ligadas' : perm === 'denied' ? '🚫 bloqueadas no navegador' : perm === 'indisponivel' ? 'não suportadas' : '⚪ desligadas'}</b></span>
    ${perm === 'default' ? '<button class="btn mini" data-perm>Ligar</button>' : ''}</div>
    <p class="pequeno mut" style="margin:8px 0 0">Aviso antes do fim: ${s.config.avisoMin ? `${s.config.avisoMin} min` : 'desligado'} (muda em Ajustes).</p>
  </div>`;
  ligarTimers(raiz);
  raiz.addEventListener('click', async e => {
    const p = e.target.closest('[data-preset]');
    if (p) { const pr = PRESETS_GUERRA.find(x => x.id === p.dataset.preset); return T.novoTimer({ nome: pr.nome, icone: pr.icone, seg: pr.min * 60, tipo: pr.id }); }
    if (e.target.closest('[data-ics]')) return T.baixarICS(ativos);
    if (e.target.closest('[data-limpar]')) return T.limparConcluidos();
    if (e.target.closest('[data-perm]')) { await T.pedirPermissaoNotificacao(); ctx.atualizar(); }
  });
}

function pirataria(raiz) {
  raiz.innerHTML = `<div class="card"><h3><span class="ic-q">🏴‍☠️</span>Missões da Fortaleza Pirata</h3>
    <p class="dica">Toque na missão que você acabou de mandar: o app avisa quando a tripulação voltar.</p>
    ${PIRATARIA.map(p => `<div class="item"><span class="ic">🏴‍☠️</span><span class="meio"><b>${esc(p.nome)}</b><small>${fmtDur(p.seg)}</small></span><button class="btn mini ouro" data-p="${p.id}">Iniciar</button></div>`).join('')}</div>`;
  raiz.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (!b) return; const p = PIRATARIA.find(x => x.id === b.dataset.p); T.novoTimer({ nome: `Pirataria: ${p.nome}`, icone: '🏴‍☠️', seg: p.seg, tipo: 'pirata' }); });
}

function milagres(raiz, ctx) {
  const conf = ctx.s.config.milagres || {};
  raiz.innerHTML = `<div class="card"><h3><span class="ic-q">🗿</span>Recarga dos milagres</h3>
    <p class="dica">A recarga muda com o nível do templo: ajuste as horas uma vez e depois é só tocar em "Usei".</p>
    ${MILAGRES.map(m => `<div class="item"><span class="ic">${m.icone}</span><span class="meio"><b>${esc(m.nome)}</b><small>${esc(m.efeito)}</small></span>
      <span class="flex" style="gap:6px"><button class="chip" data-h="${m.id}" aria-label="Horas de recarga">⏳ ${conf[m.id] ?? m.recargaH}h ✎</button>
      <button class="btn mini ouro" data-m="${m.id}">Usei</button></span></div>`).join('')}</div>`;
  raiz.addEventListener('click', async e => {
    const hb = e.target.closest('[data-h]');
    if (hb) {
      const m = MILAGRES.find(x => x.id === hb.dataset.h);
      const n = await pedirNumero({ titulo: `${m.icone} ${m.nome}`, sub: 'Recarga do milagre', rotulo: 'Horas até poder usar de novo', valor: conf[m.id] ?? m.recargaH, min: 1, max: 240, passos: [-6, -1, 1, 6], sufixo: 'h', atalhos: [{ rotulo: 'Padrão', valor: m.recargaH, texto: `${m.recargaH}h` }] });
      if (n != null) store.set(s => { s.config.milagres[m.id] = n; });
      return;
    }
    const b = e.target.closest('[data-m]'); if (!b) return;
    const m = MILAGRES.find(x => x.id === b.dataset.m);
    const h = conf[m.id] || m.recargaH;
    T.novoTimer({ nome: `${m.nome} pronto de novo`, icone: m.icone, seg: h * 3600, tipo: 'milagre' });
  });
}
