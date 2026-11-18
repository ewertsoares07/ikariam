// =====================================================================
// AJUDANTES DE TELA: formatação, avisos, diálogos, cópia e download
// =====================================================================
import { folha, esc } from './folha.js';
export { esc };

export const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
export const fmt = (n, dec = 0) => (n == null || !Number.isFinite(+n) ? '—' : (dec ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: dec }) : nf0).format(+n));
export function fmtK(n) {
  if (n == null || !Number.isFinite(+n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e6) return nf1.format(n / 1e6) + 'M';
  if (a >= 1e4) return nf1.format(n / 1e3) + 'k';
  return nf0.format(n);
}
export const fmtPct = (x, dec = 0) => (x == null ? '—' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: dec }).format(x * 100) + '%');

export function fmtDur(seg, curto = false) {
  seg = Math.max(0, Math.round(seg || 0));
  const d = Math.floor(seg / 86400), h = Math.floor((seg % 86400) / 3600), m = Math.floor((seg % 3600) / 60), s = seg % 60;
  const p2 = n => String(n).padStart(2, '0');
  if (d) return curto ? `${d}d ${h}h` : `${d}d ${h}h ${p2(m)}m`;
  if (h) return curto ? `${h}h ${p2(m)}m` : `${h}h ${p2(m)}m ${p2(s)}s`;
  if (m) return `${m}m ${p2(s)}s`;
  return `${s}s`;
}

export const fmtHora = ms => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const fmtHoraSeg = ms => new Date(ms).toLocaleTimeString('pt-BR');
export function fmtQuando(ms) {
  const d = new Date(ms), hoje = new Date();
  const dia = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const diff = Math.round((dia - base) / 864e5);
  const rot = diff === 0 ? 'hoje' : diff === 1 ? 'amanhã' : diff === -1 ? 'ontem' : d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
  return `${rot} às ${fmtHora(ms)}`;
}
export const fmtDesde = ms => {
  if (!ms) return 'nunca';
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'agora mesmo';
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
};

// Valor para <input type="datetime-local"> no fuso do aparelho
export const paraDatetimeLocal = ms => { const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };

// ---------- Avisos ----------
let toastTimer;
export function toast(msg, tipo = '') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.className = 'toast ' + tipo;
  el.textContent = msg;
  requestAnimationFrame(() => el.classList.add('vis'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('vis'), 2600);
}

export const vibrar = p => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

export async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); toast('Copiado ✔', 'ok'); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = texto; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    ta.remove(); toast(ok ? 'Copiado ✔' : 'Não deu para copiar', ok ? 'ok' : 'erro'); return ok;
  }
}

export function baixar(nome, conteudo, tipo = 'application/json') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nome });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------- Diálogos em folha ----------
export function confirmar(titulo, texto, ok = 'Confirmar', perigo = false) {
  return new Promise(res => {
    let resp = false;
    const f = folha({
      titulo, html: `<p class="fl-texto">${esc(texto)}</p>
      <div class="fl-botoes"><button class="btn fantasma" data-fechar>Cancelar</button><button class="btn ${perigo ? 'perigo' : 'ouro'}" data-ok>${esc(ok)}</button></div>`,
      aoFechar: () => res(resp),
    });
    f.corpo.querySelector('[data-ok]').addEventListener('click', () => { resp = true; f.fechar(); });
  });
}

// Lê todos os campos com name="" de um container
export function lerCampos(raiz) {
  const out = {};
  raiz.querySelectorAll('[name]').forEach(el => {
    if (el.type === 'checkbox') out[el.name] = el.checked;
    else if (el.type === 'number' || el.dataset.num !== undefined) out[el.name] = el.value === '' ? null : +el.value;
    else out[el.name] = el.value;
  });
  return out;
}

// Campo numérico que abre o teclado numérico do celular
export const campoNum = (name, valor, extra = '') =>
  `<input type="number" inputmode="numeric" name="${name}" value="${valor ?? ''}" ${extra}>`;

export const campoCoords = (name, valor, extra = '') =>
  `<input type="text" inputmode="decimal" name="${name}" value="${esc(valor ?? '')}" placeholder="00:00" maxlength="7" autocomplete="off" data-coords ${extra}>`;

// Máscara XX:YY enquanto digita
document.addEventListener('input', e => {
  const el = e.target;
  if (!el.matches || !el.matches('[data-coords]')) return;
  const dig = el.value.replace(/\D/g, '').slice(0, 6);
  if (el.value.includes(':')) return;
  if (dig.length > 2 && dig.length <= 4) el.value = dig.slice(0, 2) + ':' + dig.slice(2);
  else if (dig.length > 4) el.value = dig.slice(0, 3) + ':' + dig.slice(3);
});

export { folha };
