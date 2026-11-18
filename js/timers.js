// =====================================================================
// CRONÔMETROS: contagem, alarme (som + vibração + voz + notificação)
// e "levar para a agenda" (Google Agenda / .ics) para tocar mesmo com o
// app fechado — o navegador não deixa um site tocar alarme fechado.
// =====================================================================
import * as store from './store.js';
import { fmtDur, fmtQuando, esc, vibrar, baixar, toast } from './ui.js';

export function novoTimer({ nome, icone = '⏱️', seg, fim, tipo = 'livre', ref = null }) {
  const agora = Date.now();
  const t = { id: store.novoId(), nome: nome || 'Cronômetro', icone, inicio: agora, fim: fim || agora + seg * 1000, tipo, ref, alertado: false, avisado: false };
  store.set(s => { s.timers.push(t); s.timers.sort((a, b) => a.fim - b.fim); });
  pedirPermissaoNotificacao();
  toast(`⏱️ ${t.nome} · ${fmtQuando(t.fim)}`, 'ok');
  return t;
}

export const removerTimer = id => store.set(s => { s.timers = s.timers.filter(t => t.id !== id); });
export const adiarTimer = (id, min) => store.set(s => { const t = s.timers.find(x => x.id === id); if (t) { t.fim = Math.max(Date.now(), t.fim) + min * 60000; t.alertado = false; t.avisado = false; } });
export const limparConcluidos = () => store.set(s => { s.timers = s.timers.filter(t => t.fim > Date.now()); });

export const ativos = () => store.get().timers.filter(t => t.fim > Date.now());

// ---------- Atualização a cada segundo ----------
export function tick() {
  const agora = Date.now();
  document.querySelectorAll('[data-relogio]').forEach(el => { el.textContent = new Date(agora).toLocaleTimeString('pt-BR'); });
  document.querySelectorAll('[data-fim]').forEach(el => {
    const fim = +el.dataset.fim;
    const r = (fim - agora) / 1000;
    const txt = r > 0 ? fmtDur(r, el.dataset.curto !== undefined) : (el.dataset.zero || 'agora!');
    if (el.textContent !== txt) el.textContent = txt;
  });
  document.querySelectorAll('[data-barra-ini]').forEach(el => {
    const ini = +el.dataset.barraIni, fim = +el.dataset.barraFim;
    el.style.width = Math.min(100, Math.max(0, ((agora - ini) / Math.max(1, fim - ini)) * 100)) + '%';
  });
  const s = store.get();
  const antes = (s.config.avisoMin || 0) * 60000;
  let mudou = false;
  for (const t of s.timers) {
    if (!t.alertado && t.fim <= agora) { t.alertado = true; mudou = true; if (agora - t.fim < 10 * 60000) alarme(t); }
    else if (antes && !t.avisado && !t.alertado && t.fim - agora <= antes && t.fim - t.inicio > antes * 2) { t.avisado = true; mudou = true; avisoPrevio(t); }
  }
  if (mudou) store.set(() => {}, 'timer');
}

// ---------- Som (sintetizado, funciona offline) ----------
let ctx;
const audio = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
export function tocarCorneta() {
  if (!store.get().config.som) return;
  try {
    const a = audio(); if (a.state === 'suspended') a.resume();
    const t0 = a.currentTime;
    [[0, 392], [0.28, 523], [0.56, 659], [0.9, 784]].forEach(([dt, f], i) => {
      const o = a.createOscillator(), g = a.createGain(), filtro = a.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = f; filtro.type = 'lowpass'; filtro.frequency.value = 1800;
      g.gain.setValueAtTime(0, t0 + dt); g.gain.linearRampToValueAtTime(0.18, t0 + dt + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dt + (i === 3 ? 1.1 : 0.3));
      o.connect(filtro).connect(g).connect(a.destination); o.start(t0 + dt); o.stop(t0 + dt + 1.2);
    });
  } catch (e) { console.warn(e); }
}
export function tocarSino() {
  if (!store.get().config.som) return;
  try {
    const a = audio(); if (a.state === 'suspended') a.resume();
    const t0 = a.currentTime;
    [880, 1320].forEach((f, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.2, t0 + i * 0.18); g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.18 + 0.9);
      o.connect(g).connect(a.destination); o.start(t0 + i * 0.18); o.stop(t0 + i * 0.18 + 1);
    });
  } catch {}
}
export function falar(texto) {
  if (!store.get().config.voz || !('speechSynthesis' in window)) return;
  try { const u = new SpeechSynthesisUtterance(texto); u.lang = 'pt-BR'; u.rate = 1.02; speechSynthesis.speak(u); } catch {}
}

// ---------- Notificações do sistema ----------
export async function pedirPermissaoNotificacao() {
  if (!('Notification' in window) || Notification.permission !== 'default') return;
  try { await Notification.requestPermission(); } catch {}
}
async function notificar(titulo, corpo) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) reg.showNotification(titulo, { body: corpo, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'ikariam-' + titulo, renotify: true, vibrate: [300, 120, 300] });
    else new Notification(titulo, { body: corpo, icon: 'icons/icon-192.png' });
  } catch {}
}

function avisoPrevio(t) {
  tocarSino();
  vibrar([150, 80, 150]);
  const min = store.get().config.avisoMin;
  notificar(`Faltam ${min} min · ${t.nome}`, `Termina ${fmtQuando(t.fim)}`);
  toast(`🔔 Faltam ${min} min: ${t.nome}`);
}

function alarme(t) {
  if (store.get().config.vibrar) vibrar([400, 150, 400, 150, 600]);
  tocarCorneta();
  falar(`Atenção, comandante. ${t.nome}.`);
  notificar(`${t.icone || '⏱️'} ${t.nome}`, 'Cronômetro concluído agora.');
  const el = document.createElement('div');
  el.className = 'alarme-tela';
  el.innerHTML = `<div class="alarme-caixa"><div class="ic">${t.icone || '⏱️'}</div><h3>${esc(t.nome)}</h3>
    <p class="mut" style="color:#c9d8e4">Cronômetro concluído agora.</p>
    <div class="fl-botoes"><button class="btn" data-adiar>+5 min</button><button class="btn ouro" data-ok>Entendido</button></div></div>`;
  document.body.appendChild(el);
  el.querySelector('[data-ok]').onclick = () => el.remove();
  el.querySelector('[data-adiar]').onclick = () => { adiarTimer(t.id, 5); el.remove(); };
}

// ---------- Agenda (alarme mesmo com o app fechado) ----------
const utc = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function linkGoogleAgenda(t) {
  const fim = t.fim + 5 * 60000;
  const p = new URLSearchParams({ action: 'TEMPLATE', text: `${t.icone || '⏱️'} Ikariam: ${t.nome}`, dates: `${utc(t.fim)}/${utc(fim)}`, details: 'Criado pelo Comando Imperial (Ikariam Helper).' });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}

export function baixarICS(lista) {
  const linhas = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Comando Imperial//Ikariam//PT-BR', 'CALSCALE:GREGORIAN'];
  for (const t of lista) {
    linhas.push('BEGIN:VEVENT', `UID:${t.id}@comando-imperial`, `DTSTAMP:${utc(Date.now())}`, `DTSTART:${utc(t.fim)}`, `DTEND:${utc(t.fim + 5 * 60000)}`,
      `SUMMARY:Ikariam: ${String(t.nome).replace(/[,;\n]/g, ' ')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Ikariam', 'TRIGGER:PT0M', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Ikariam em 5 min', 'TRIGGER:-PT5M', 'END:VALARM', 'END:VEVENT');
  }
  linhas.push('END:VCALENDAR');
  baixar(lista.length === 1 ? 'alarme-ikariam.ics' : 'alarmes-ikariam.ics', linhas.join('\r\n'), 'text/calendar');
}
