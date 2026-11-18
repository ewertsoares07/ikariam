// =====================================================================
// COMANDO IMPERIAL 2.0 — inicialização, rotas, barra de baixo e menu
// =====================================================================
import * as store from './store.js';
import * as timers from './timers.js';
import { cloud } from './cloud.js';
import { iniciarMenu, definirItens } from './menu.js';
import { vinhoAgora } from './calc.js';
import { esc, toast } from './ui.js';
import { fecharTodas, folhaAberta } from './folha.js';

import * as inicio from './views/inicio.js';
import * as imperio from './views/imperio.js';
import * as militar from './views/militar.js';
import * as alvos from './views/alvos.js';
import * as cronometros from './views/cronometros.js';
import * as pve from './views/pve.js';
import * as guias from './views/guias.js';
import * as alianca from './views/alianca.js';
import * as sistema from './views/sistema.js';

const VIEWS = { inicio, imperio, militar, alvos, cronometros, pve, guias, alianca, sistema };
const NAV = ['inicio', 'imperio', 'militar', 'alvos'];
const memorias = {}; // valores digitados nas calculadoras sobrevivem às trocas de tela

let rotaAtual = { rota: 'inicio', sub: '' };

export const ir = (rota, sub = '') => { const h = '#/' + rota + (sub ? '/' + sub : ''); if (location.hash !== h) location.hash = h; else desenhar(); };

function lerRota() {
  const [rota, sub] = location.hash.replace(/^#\/?/, '').split('/');
  return { rota: VIEWS[rota] ? rota : 'inicio', sub: sub || '' };
}

// ---------- Desenho ----------
let agendado = false;
function agendarDesenho() { if (agendado) return; agendado = true; requestAnimationFrame(() => { agendado = false; desenhar(true); }); }

function desenhar(manterScroll = false) {
  const { rota, sub } = rotaAtual;
  const view = VIEWS[rota];
  const tela = document.getElementById('tela');
  const y = window.scrollY;
  const raiz = document.createElement('section');
  if (!manterScroll) raiz.className = 'entrar';
  const ctx = { s: store.get(), sub, ir, atualizar: agendarDesenho, cloud, mem: (memorias[rota] ||= {}), app: { instalar, podeInstalar, instalado } };
  try { view.render(raiz, ctx); }
  catch (e) { console.error(e); raiz.innerHTML = `<div class="card"><h3>😵 Algo deu errado nesta tela</h3><p class="mut">${esc(e.message)}</p></div>`; }
  tela.replaceChildren(raiz);
  if (manterScroll) window.scrollTo(0, y);
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('ativo', b.dataset.rota === rota));
  atualizarCasca();
  timers.tick();
}

function atualizarCasca() {
  const s = store.get();
  const agora = Date.now();
  const ativos = s.timers.filter(t => t.fim > agora).length;
  const pt = document.getElementById('pontoTimers');
  pt.textContent = ativos; pt.classList.toggle('oculto', !ativos);

  const vinhos = s.cidades.map(c => ({ c, v: vinhoAgora(c.vinho, agora) })).filter(x => x.v);
  const criticas = vinhos.filter(x => x.v.nivel === 'vermelho');
  const amarelas = vinhos.filter(x => x.v.nivel === 'amarelo');
  const pi = document.getElementById('pontoImperio');
  pi.textContent = criticas.length + amarelas.length; pi.classList.toggle('oculto', !(criticas.length + amarelas.length));

  const banner = document.getElementById('banner');
  if (criticas.length) {
    const nomes = criticas.map(x => x.c.nome).slice(0, 3).join(', ');
    banner.innerHTML = `<div class="banner">🍇 Vinho crítico: ${esc(nomes)}${criticas.length > 3 ? ` +${criticas.length - 3}` : ''} (menos de 12h)<button data-ver-vinho>Ver</button></div>`;
    banner.querySelector('[data-ver-vinho]').onclick = () => ir('imperio');
  } else banner.innerHTML = '';

  const c = cloud.estado;
  const sub = [`${s.cidades.length} cidade${s.cidades.length === 1 ? '' : 's'}`, ativos ? `${ativos} alarme${ativos > 1 ? 's' : ''}` : null,
    c.usuario ? (c.sincronizando ? 'sincronizando…' : c.online ? 'nuvem ok' : 'offline') : (navigator.onLine ? 'só no aparelho' : 'offline')].filter(Boolean).join(' · ');
  document.getElementById('topoSub').textContent = sub;

  const bc = document.getElementById('btnConta');
  if (c.usuario?.photoURL) bc.innerHTML = `<img src="${esc(c.usuario.photoURL)}" alt="" referrerpolicy="no-referrer"><span class="ponto verde ${c.online ? '' : 'oculto'}"></span>`;
  else bc.innerHTML = c.usuario ? '👤' : '☁️';
}

// ---------- Itens do menu em folha ----------
function itensMenu() {
  const s = store.get();
  const agora = Date.now();
  const ativos = s.timers.filter(t => t.fim > agora).length;
  const vinhoAlerta = s.cidades.filter(c => { const v = vinhoAgora(c.vinho, agora); return v && (v.nivel === 'vermelho' || v.nivel === 'amarelo'); }).length;
  const papel = cloud.papel();
  const membro = ['membro', 'oficial', 'admin'].includes(papel);
  const sempre = () => true;
  const it = (grupo, id, icone, nome, sub, rota, extra = {}) => ({ grupo, id, icone, nome, sub, pode: sempre, abrir: () => ir(...rota), ...extra });
  return [
    it('Dia a dia', 'inicio', '🏛️', 'Início', 'Checklist pré-sono', ['inicio']),
    it('Dia a dia', 'imperio', '🏘️', 'Império', 'Cidades e vinho', ['imperio'], { badge: vinhoAlerta, tags: 'vinho taverna corrupcao barco alarme' }),
    it('Dia a dia', 'timers', '⏱️', 'Cronômetros', 'Alarmes e agenda', ['cronometros'], { badge: ativos, tags: 'timer alarme' }),
    it('Guerra', 'exercito', '🛡️', 'Exército', 'Tropas e generais', ['militar', 'exercito'], { tags: 'tropas manutencao ouro generais' }),
    it('Guerra', 'viagem', '🧭', 'Viagem', 'Ida, volta e partida', ['militar', 'viagem'], { tags: 'tempo navio poseidon tritao' }),
    it('Guerra', 'waving', '🌊', 'Waving', 'LC Tank e munição', ['militar', 'waving'], { tags: 'lanca chamas municao dispersou' }),
    it('Guerra', 'prebatalha', '⚖️', 'Pré-batalha', 'Checa a composição', ['militar', 'prebatalha'], { tags: 'simulador impasse recuo' }),
    it('Guerra', 'flancos', '⛵', 'Flancos', 'Trirreme × Trirreme', ['militar', 'flancos'], { tags: 'trirreme naval formula' }),
    it('Saque e PvE', 'alvos', '🎯', 'Alvos', 'Espionagem', ['alvos'], { tags: 'espiao relatorio' }),
    it('Saque e PvE', 'saque', '💰', 'Saque', 'Barcos para levar', ['alvos', 'saque'], { tags: 'pilhagem barcos' }),
    it('Saque e PvE', 'barbaros', '🪓', 'Bárbaros', 'Nível por ilha', ['pve', 'barbaros'], { tags: 'vila barbara vikings' }),
    it('Saque e PvE', 'pirataria', '🏴‍☠️', 'Pirataria', 'Missões da fortaleza', ['cronometros', 'pirataria']),
    it('Saque e PvE', 'abissal', '🐙', 'Abissal', 'Emboscada · 1.000 peso', ['pve', 'abissal'], { tags: 'evento emboscada' }),
    it('Guias', 'oficina', '⚙️', 'Oficina', 'O que melhorar', ['guias', 'oficina'], { tags: 'upgrade horizontes infinitos' }),
    it('Guias', 'combate', '📜', 'Combate', 'Prioridades e regras', ['guias', 'combate'], { tags: 'prioridade alvo linha' }),
    it('Guias', 'milagres', '🗿', 'Milagres', 'Recarga dos templos', ['cronometros', 'milagres'], { tags: 'poseidon hefesto colosso' }),
    it('Aliança', 'ops', '⚔️', 'Operações', 'Ataque sincronizado', ['alianca', 'ops'], { pode: () => membro }),
    it('Aliança', 'alvosAli', '🗺️', 'Alvos da aliança', 'Compartilhados', ['alianca', 'alvos'], { pode: () => membro }),
    it('Aliança', 'mural', '📣', 'Mural', 'Avisos do líder', ['alianca', 'mural'], { pode: () => membro }),
    it('Aliança', 'membros', '👥', 'Membros', 'Aprovar e cargos', ['alianca', 'membros'], { pode: () => papel === 'admin', badge: cloud.estado.pendentes || 0 }),
    it('Aliança', 'entrarAli', '🤝', 'Aliança', 'Entrar com Google', ['sistema', 'conta'], { pode: () => !membro }),
    it('Sistema', 'conta', '☁️', 'Conta e nuvem', cloud.estado.usuario ? 'Conectado' : 'Entrar com Google', ['sistema', 'conta']),
    it('Sistema', 'backup', '💾', 'Backup', 'Exportar e importar', ['sistema', 'backup'], { tags: 'whatsapp codigo json v1' }),
    it('Sistema', 'config', '🎛️', 'Ajustes', 'Barcos, sons e tema', ['sistema', 'config'], { tags: 'tema capacidade som' }),
  ];
}

// ---------- Instalar como app ----------
let pedidoInstalar = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalar = e; agendarDesenho(); });
window.addEventListener('appinstalled', () => { pedidoInstalar = null; toast('App instalado 🎉', 'ok'); });
export const podeInstalar = () => !!pedidoInstalar;
export async function instalar() {
  if (!pedidoInstalar) return false;
  pedidoInstalar.prompt();
  const r = await pedidoInstalar.userChoice.catch(() => null);
  pedidoInstalar = null; agendarDesenho();
  return r?.outcome === 'accepted';
}
export const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// ---------- Tema ----------
export function aplicarTema() {
  const papiro = store.get().config.tema === 'papiro';
  document.body.classList.toggle('papiro', papiro);
  document.querySelector('meta[name="theme-color"]').content = papiro ? '#1b4b6b' : '#0d2333';
}

// ---------- Partida ----------
function iniciar() {
  aplicarTema();
  definirItens(itensMenu);
  iniciarMenu();
  document.querySelectorAll('.nav-item').forEach(b => b.addEventListener('click', () => ir(b.dataset.rota)));
  document.getElementById('btnTimers').onclick = () => ir('cronometros');
  document.getElementById('btnConta').onclick = () => ir('sistema', 'conta');

  window.addEventListener('hashchange', async () => {
    if (folhaAberta()) await fecharTodas();
    rotaAtual = lerRota();
    desenhar();
    window.scrollTo(0, 0);
  });
  rotaAtual = lerRota();

  store.on((s, origem) => {
    if (origem === 'timer') { atualizarCasca(); return; }
    aplicarTema();
    agendarDesenho();
    if (origem !== 'nuvem') cloud.agendarEnvio();
  });
  cloud.on(() => agendarDesenho());
  cloud.iniciar();

  setInterval(timers.tick, 1000);
  // a cada minuto redesenha (vinho, semáforos), mas nunca enquanto você digita
  setInterval(() => { const a = document.activeElement; if (!a || !a.matches('input, textarea, select')) agendarDesenho(); }, 60000);
  window.addEventListener('online', () => { cloud.aoVoltarOnline(); agendarDesenho(); });
  window.addEventListener('offline', agendarDesenho);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { timers.tick(); agendarDesenho(); } });

  desenhar();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const novo = reg.installing;
        novo?.addEventListener('statechange', () => { if (novo.state === 'installed' && navigator.serviceWorker.controller) toast('Nova versão pronta: feche e abra o app ✨'); });
      });
    }).catch(e => console.warn('SW', e));
  }
}

iniciar();
