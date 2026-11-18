// Pedaços de tela usados em várias abas
import * as store from '../store.js';
import * as T from '../timers.js';
import { esc, fmtQuando, folha, campoNum, toast, paraDatetimeLocal } from '../ui.js';
import { UNIDADES } from '../data.js';

export const alertasHtml = lista => lista.map(a => `<div class="alerta ${a.nivel}">${esc(a.texto)}</div>`).join('');

export function timerHtml(t, agora = Date.now()) {
  const acabou = t.fim <= agora;
  return `<div class="timer ${acabou ? 'acabou' : ''}" data-timer="${t.id}">
    <span class="ic-q">${t.icone || '⏱️'}</span>
    <div class="meio"><b>${esc(t.nome)}</b><small>${acabou ? 'terminou ' : 'termina '}${esc(fmtQuando(t.fim))}</small></div>
    <span class="contagem" data-fim="${t.fim}" data-zero="fim!">…</span>
    <button class="icone-btn" data-opcoes-timer="${t.id}" aria-label="Opções">⋯</button>
    <div class="barra" data-barra-ini="${t.inicio || t.fim - 1}" data-barra-fim="${t.fim}"></div></div>`;
}

export function opcoesTimer(id) {
  const t = store.get().timers.find(x => x.id === id);
  if (!t) return;
  const f = folha({
    titulo: t.nome, sub: `Termina ${fmtQuando(t.fim)}`,
    html: `<div class="mn-vidro">
      <div class="mn-item" data-a="g"><span class="ic">📅</span><span class="meio"><b>Pôr na Google Agenda</b><small>Toca no celular mesmo com o app fechado</small></span>›</div>
      <div class="mn-item" data-a="ics"><span class="ic">🗓️</span><span class="meio"><b>Baixar alarme (.ics)</b><small>iPhone, Outlook e outras agendas</small></span>›</div>
      <div class="mn-item" data-a="5"><span class="ic">➕</span><span class="meio"><b>Adiar 5 minutos</b><small>Empurra o fim</small></span>›</div>
      <div class="mn-item" data-a="15"><span class="ic">⏩</span><span class="meio"><b>Adiar 15 minutos</b><small>Uma rodada a mais</small></span>›</div>
      <div class="mn-item" data-a="x"><span class="ic">🗑️</span><span class="meio"><b>Apagar</b><small>Remove o cronômetro</small></span>›</div></div>`,
  });
  f.corpo.addEventListener('click', e => {
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (!a) return;
    if (a === 'g') window.open(T.linkGoogleAgenda(t), '_blank', 'noopener');
    else if (a === 'ics') T.baixarICS([t]);
    else if (a === 'x') T.removerTimer(t.id);
    else T.adiarTimer(t.id, +a);
    f.fechar();
  });
}

// Liga os botões ⋯ dos cronômetros dentro de um container
export function ligarTimers(raiz) {
  raiz.addEventListener('click', e => { const b = e.target.closest('[data-opcoes-timer]'); if (b) opcoesTimer(b.dataset.opcoesTimer); });
}

const ICONES_TIMER = ['⏱️', '⚔️', '💣', '🔥', '⛵', '🏗️', '🍇', '🕵️', '🏴‍☠️', '🗿', '🔁', '🛡️'];

export function novoTimerFolha(pre = {}) {
  let icone = pre.icone || '⏱️';
  const f = folha({
    titulo: 'Novo cronômetro', sub: 'Duração ou horário exato',
    html: `<form data-sem-arrasto-n>
      <label class="campo"><span>Nome</span><input name="nome" value="${esc(pre.nome || '')}" placeholder="Ex.: Ataque chega em 93:24" maxlength="60"></label>
      <div class="linha-chips" data-icones>${ICONES_TIMER.map(i => `<button type="button" class="chip ${i === icone ? 'ativo' : ''}" data-ic="${i}">${i}</button>`).join('')}</div>
      <div class="grade3">
        <label class="campo"><span>Horas</span>${campoNum('h', pre.h ?? '', 'min="0" max="240"')}</label>
        <label class="campo"><span>Min</span>${campoNum('m', pre.m ?? '', 'min="0" max="59"')}</label>
        <label class="campo"><span>Seg</span>${campoNum('sg', pre.sg ?? '', 'min="0" max="59"')}</label>
      </div>
      <label class="campo"><span>…ou termina em (data e hora)</span><input type="datetime-local" name="quando" value=""></label>
      <div class="fl-botoes"><button type="button" class="btn" data-fechar>Cancelar</button><button type="submit" class="btn ouro">Criar ⏱️</button></div>
    </form>`,
  });
  f.corpo.querySelector('[data-icones]').addEventListener('click', e => {
    const b = e.target.closest('[data-ic]'); if (!b) return;
    icone = b.dataset.ic;
    f.corpo.querySelectorAll('[data-ic]').forEach(x => x.classList.toggle('ativo', x === b));
  });
  f.corpo.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    let fim = null;
    if (d.quando) fim = new Date(d.quando).getTime();
    const seg = (+d.h || 0) * 3600 + (+d.m || 0) * 60 + (+d.sg || 0);
    if (!fim && !seg) { toast('Informe a duração ou o horário', 'erro'); return; }
    if (fim && fim <= Date.now()) { toast('Esse horário já passou', 'erro'); return; }
    T.novoTimer({ nome: d.nome || 'Cronômetro', icone, seg, fim });
    f.fechar();
  });
}

export function seletorCidade(name, sel, extra = '', vazio = 'Escolha a cidade') {
  const cs = store.get().cidades;
  return `<select name="${name}" ${extra}><option value="">${esc(vazio)}</option>${cs.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.nome)}${c.coords ? ` [${esc(c.coords)}]` : ''}</option>`).join('')}</select>`;
}

export const uni = id => UNIDADES.find(u => u.id === id);

// Grade de unidades com campo de quantidade (terra/mar)
export function gradeUnidades(valores = {}, tipo = null, mostrarRaras = store.get().config.mostrarRaras) {
  const lista = UNIDADES.filter(u => (!tipo || u.tipo === tipo) && (mostrarRaras || !u.raro || valores[u.id] > 0));
  return `<div class="uni-grade">${lista.map(u => `<div class="uni ${valores[u.id] > 0 ? 'tem' : ''}"><span class="ic">${u.icone}</span>
    <label for="u-${u.id}" title="${esc(u.nome)}">${esc(u.nome)}<small>${u.manut} ouro/h · ${u.abrev}</small></label>
    <input id="u-${u.id}" type="number" inputmode="numeric" min="0" data-uni="${u.id}" value="${valores[u.id] || ''}" placeholder="0"></div>`).join('')}</div>`;
}

// Mesma grade, só leitura: cada unidade é um botão que abre o modal de quantidade
export function gradeUnidadesInfo(valores = {}, tipo = null, mostrarRaras = store.get().config.mostrarRaras) {
  const lista = UNIDADES.filter(u => (!tipo || u.tipo === tipo) && (mostrarRaras || !u.raro || valores[u.id] > 0));
  const nf = new Intl.NumberFormat('pt-BR');
  return `<div class="uni-info">${lista.map(u => `<button class="uni-t ${valores[u.id] > 0 ? 'tem' : 'zero'}" data-uni-ed="${u.id}" aria-label="${esc(u.nome)}">
    <span class="ic">${u.icone}</span><b>${valores[u.id] > 0 ? nf.format(valores[u.id]) : '0'}</b><small>${esc(u.nome)}</small></button>`).join('')}</div>`;
}

export function lerGradeUnidades(raiz) {
  const out = {};
  raiz.querySelectorAll('[data-uni]').forEach(i => { const v = +i.value; if (v > 0) out[i.dataset.uni] = v; });
  return out;
}

// Folha "colar do jogo"
export function colarFolha({ titulo = 'Colar do jogo', dica = '', aoLer }) {
  const f = folha({
    classe: 'mn-alta', titulo, sub: 'Copie a tela do jogo e cole aqui',
    html: `<p class="fl-texto pequeno">${esc(dica)}</p>
      <textarea class="entrada" data-txt rows="9" placeholder="Cole aqui (segure e toque em Colar)"></textarea>
      <div class="fl-botoes"><button type="button" class="btn" data-colar>📋 Colar da área de transferência</button><button type="button" class="btn ouro" data-ler>Ler texto</button></div>
      <div data-prev></div>`,
  });
  const ta = f.corpo.querySelector('[data-txt]');
  f.corpo.querySelector('[data-colar]').onclick = async () => { try { ta.value = await navigator.clipboard.readText(); } catch { toast('Segure no campo e toque em Colar'); } };
  f.corpo.querySelector('[data-ler]').onclick = () => { if (!ta.value.trim()) return toast('Cole o texto primeiro', 'erro'); aoLer(ta.value, f); };
  return f;
}

export const agoraLocal = () => paraDatetimeLocal(Date.now());
