// =====================================================================
// MODAIS E BALÕES
// - modal(): caixa central elegante (usa a mesma base da folha: voltar do
//   Android, tocar fora e arrastar fecham)
// - pedirNumero / pedirTexto / pedirCampos / escolher: edições rápidas
// - balões: qualquer elemento com data-balao="texto" (e data-balao-t="título")
//   mostra uma dica flutuante ao tocar
// =====================================================================
import { folha, esc } from './folha.js';

export function modal({ titulo = '', sub = '', html = '', classe = '', aoFechar = null, aoAbrir = null }) {
  return folha({ classe: 'md ' + classe, titulo, sub, html, aoFechar, aoAbrir });
}

// Lê número digitado do jeito do jogo: "25.000", "25 000", "1,5k", "-40"
export function lerNumero(txt) {
  let t = String(txt ?? '').trim().toLowerCase().replace(/\s/g, '');
  if (!t) return null;
  let mult = 1;
  if (/k$/.test(t)) { mult = 1e3; t = t.slice(0, -1); } else if (/m$/.test(t)) { mult = 1e6; t = t.slice(0, -1); }
  if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  t = t.replace(',', '.');
  const n = Number(t) * mult;
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

const nf = new Intl.NumberFormat('pt-BR');
const fmtCurto = n => (Math.abs(n) >= 1000 ? (n > 0 ? '+' : '−') + nf.format(Math.abs(n) / 1000) + 'k' : (n > 0 ? '+' : '−') + nf.format(Math.abs(n)));

function focarDepois(f, sel) {
  setTimeout(() => { const el = f.corpo.querySelector(sel); if (el) { el.focus({ preventScroll: true }); el.select && el.select(); } }, 320);
}

// Retorna o número, null (se "limpar" for permitido e usado) ou undefined (cancelou)
export function pedirNumero({
  titulo, sub = '', rotulo = '', valor = null, min = null, max = null, sufixo = '', dica = '',
  passos = [], atalhos = [], botao = 'Salvar', negativo = false, limpar = false, somar = false, base = 0,
}) {
  return new Promise(res => {
    let resp;
    const f = modal({
      titulo, sub,
      html: `<form class="md-num" novalidate>
        ${dica ? `<p class="md-dica">${dica}</p>` : ''}
        ${rotulo ? `<div class="md-rotulo">${esc(rotulo)}</div>` : ''}
        <div class="md-visor">
          ${negativo ? '<button type="button" class="md-passo" data-sinal aria-label="Trocar sinal">±</button>' : ''}
          <input type="text" inputmode="${negativo ? 'text' : 'numeric'}" autocomplete="off" data-v value="${valor ?? ''}" placeholder="0" aria-label="${esc(rotulo || titulo)}">
          ${sufixo ? `<span class="md-suf">${esc(sufixo)}</span>` : ''}
        </div>
        ${somar ? '<div class="md-previa" data-previa></div>' : ''}
        ${passos.length ? `<div class="md-chips">${passos.map(p => `<button type="button" class="md-chip" data-passo="${p}">${fmtCurto(p)}</button>`).join('')}</div>` : ''}
        ${atalhos.length ? `<div class="md-atalhos">${atalhos.map((a, i) => `<button type="button" class="md-atalho" data-atalho="${i}"><small>${esc(a.rotulo)}</small><b>${esc(a.texto ?? nf.format(a.valor))}</b>${a.sub ? `<small>${esc(a.sub)}</small>` : ''}</button>`).join('')}</div>` : ''}
        <div class="fl-botoes">
          ${limpar ? '<button type="button" class="btn" data-limpar>Limpar</button>' : '<button type="button" class="btn" data-fechar>Cancelar</button>'}
          <button type="submit" class="btn ouro">${esc(botao)}</button>
        </div>
      </form>`,
      aoFechar: () => res(resp),
    });
    const inp = f.corpo.querySelector('[data-v]');
    const previa = f.corpo.querySelector('[data-previa]');
    const atual = () => lerNumero(inp.value) || 0;
    const mostrar = () => {
      if (!previa) return;
      const n = lerNumero(inp.value);
      previa.innerHTML = n ? `Fica <b>${nf.format(Math.max(0, base + n))}</b>${sufixo ? ' ' + esc(sufixo) : ''}` : `Agora: <b>${nf.format(base)}</b>`;
    };
    mostrar();
    inp.addEventListener('input', mostrar);
    f.corpo.addEventListener('click', e => {
      const p = e.target.closest('[data-passo]');
      if (p) { inp.value = String(atual() + +p.dataset.passo); if (!negativo && +inp.value < 0) inp.value = '0'; mostrar(); vibrarCurto(); return; }
      const a = e.target.closest('[data-atalho]');
      if (a) { inp.value = String(atalhos[+a.dataset.atalho].valor); mostrar(); f.corpo.querySelectorAll('[data-atalho]').forEach(x => x.classList.toggle('ativo', x === a)); vibrarCurto(); return; }
      if (e.target.closest('[data-sinal]')) { inp.value = String(-atual()); mostrar(); return; }
      if (e.target.closest('[data-limpar]')) { resp = null; f.fechar(); }
    });
    f.corpo.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      let n = lerNumero(inp.value);
      if (n == null) { if (limpar) { resp = null; f.fechar(); } else tremer(inp); return; }
      if (Number.isNaN(n)) return tremer(inp);
      if (min != null) n = Math.max(min, n);
      if (max != null) n = Math.min(max, n);
      resp = n; f.fechar();
    });
    focarDepois(f, '[data-v]');
  });
}

export function pedirTexto({ titulo, sub = '', valor = '', placeholder = '', multilinha = false, botao = 'Salvar', max = 500 }) {
  return new Promise(res => {
    let resp;
    const f = modal({
      titulo, sub,
      html: `<form>
        ${multilinha ? `<textarea class="entrada" data-v rows="5" maxlength="${max}" placeholder="${esc(placeholder)}">${esc(valor)}</textarea>`
          : `<input class="entrada" data-v maxlength="${max}" value="${esc(valor)}" placeholder="${esc(placeholder)}">`}
        <div class="fl-botoes"><button type="button" class="btn" data-fechar>Cancelar</button><button type="submit" class="btn ouro">${esc(botao)}</button></div>
      </form>`,
      aoFechar: () => res(resp),
    });
    f.corpo.querySelector('form').addEventListener('submit', e => { e.preventDefault(); resp = f.corpo.querySelector('[data-v]').value.trim(); f.fechar(); });
    focarDepois(f, '[data-v]');
  });
}

// campos: [{ name, rotulo, valor, tipo: 'num'|'texto', negativo, placeholder, sufixo }]
export function pedirCampos({ titulo, sub = '', dica = '', campos = [], botao = 'Salvar', colunas = 2 }) {
  return new Promise(res => {
    let resp;
    const f = modal({
      titulo, sub,
      html: `<form novalidate>
        ${dica ? `<p class="md-dica">${dica}</p>` : ''}
        <div class="${colunas === 1 ? '' : 'grade' + colunas}" style="${colunas === 1 ? 'display:grid;gap:10px' : ''}">
        ${campos.map(c => `<label class="campo"><span>${esc(c.rotulo)}</span><input name="${c.name}" ${c.tipo === 'texto' ? '' : `inputmode="${c.negativo ? 'text' : 'numeric'}"`} autocomplete="off" value="${esc(c.valor ?? '')}" placeholder="${esc(c.placeholder ?? '')}"></label>`).join('')}
        </div>
        <div class="fl-botoes"><button type="button" class="btn" data-fechar>Cancelar</button><button type="submit" class="btn ouro">${esc(botao)}</button></div>
      </form>`,
      aoFechar: () => res(resp),
    });
    f.corpo.querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      const out = {};
      for (const c of campos) {
        const el = e.target.elements[c.name];
        if (c.tipo === 'texto') { out[c.name] = el.value.trim(); continue; }
        const n = lerNumero(el.value);
        if (Number.isNaN(n)) return tremer(el);
        out[c.name] = n;
      }
      resp = out; f.fechar();
    });
    focarDepois(f, 'input');
  });
}

// opcoes: [{ id, icone, nome, sub, perigo }]
export function escolher({ titulo, sub = '', opcoes = [] }) {
  return new Promise(res => {
    let resp;
    const f = modal({
      titulo, sub, classe: 'md-centro',
      html: `<div class="mn-vidro">${opcoes.map(o => `<div class="mn-item ${o.perigo ? 'perigo' : ''}" data-op="${esc(o.id)}"><span class="ic">${o.icone || '•'}</span><span class="meio"><b>${esc(o.nome)}</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span>›</div>`).join('')}</div>`,
      aoFechar: () => res(resp),
    });
    f.corpo.addEventListener('click', e => { const o = e.target.closest('[data-op]'); if (o) { resp = o.dataset.op; f.fechar(); } });
  });
}

function tremer(el) { el.classList.remove('md-erro'); void el.offsetWidth; el.classList.add('md-erro'); vibrarCurto(); }
function vibrarCurto() { try { navigator.vibrate && navigator.vibrate(8); } catch {} }

// ---------------------------------------------------------------------
// BALÕES (dicas flutuantes)
// ---------------------------------------------------------------------
let balaoEl = null, balaoAlvo = null, balaoTimer = null;

export function fecharBalao() {
  clearTimeout(balaoTimer);
  if (!balaoEl) return;
  const el = balaoEl; balaoEl = null; balaoAlvo = null;
  el.classList.remove('vis');
  setTimeout(() => el.remove(), 200);
}

export function balao(alvo, texto, titulo = '') {
  fecharBalao();
  const el = document.createElement('div');
  el.className = 'balao';
  el.setAttribute('role', 'tooltip');
  el.innerHTML = `${titulo ? `<b>${esc(titulo)}</b>` : ''}${esc(texto).replace(/\n/g, '<br>')}`;
  document.body.appendChild(el);
  const r = alvo.getBoundingClientRect();
  const w = el.offsetWidth, h = el.offsetHeight, m = 10;
  const cabeCima = r.top - h - 14 > 60;
  let left = r.left + r.width / 2 - w / 2;
  left = Math.max(m, Math.min(window.innerWidth - w - m, left));
  const top = cabeCima ? r.top - h - 12 : r.bottom + 12;
  el.style.left = left + 'px'; el.style.top = top + 'px';
  el.style.setProperty('--seta', `${Math.max(14, Math.min(w - 14, r.left + r.width / 2 - left))}px`);
  el.classList.add(cabeCima ? 'cima' : 'baixo');
  requestAnimationFrame(() => el.classList.add('vis'));
  balaoEl = el; balaoAlvo = alvo;
  balaoTimer = setTimeout(fecharBalao, 5000);
}

document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('[data-balao]');
  if (a) {
    e.stopPropagation(); e.preventDefault();
    if (balaoAlvo === a) return fecharBalao();
    return balao(a, a.dataset.balao, a.dataset.balaoT || '');
  }
  if (balaoEl) fecharBalao();
}, true);
window.addEventListener('scroll', () => balaoEl && fecharBalao(), { passive: true, capture: true });
window.addEventListener('resize', () => balaoEl && fecharBalao());
