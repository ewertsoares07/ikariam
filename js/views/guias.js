// GUIAS — Oficina (Horizontes Infinitos) e regras de combate do meta
import { OFICINA, LINHAS, REGRAS_COMBATE, LC_PRESETS } from '../data.js';
import { esc } from '../ui.js';

const ABAS = [['oficina', '⚙️ Oficina'], ['combate', '📜 Combate']];

const tabela = (lista, cor) => lista.map(x => `<div class="check ${cor}"><span class="st">${cor === 'ok' ? '✓' : cor === 'ruim' ? '✕' : '•'}</span><div><b>${esc(x.u)} · ${esc(x.o)}</b><small>${esc(x.por)}</small></div></div>`).join('');

export function render(raiz, ctx) {
  const sub = ctx.sub === 'combate' ? 'combate' : 'oficina';
  raiz.innerHTML = `<div class="tela-titulo"><div><h2>Guias</h2><p>O meta resumido do fórum</p></div></div>
    <div class="seg">${ABAS.map(([id, n]) => `<button class="${id === sub ? 'ativo' : ''}" data-aba="${id}">${n}</button>`).join('')}</div>
    ${sub === 'oficina' ? `
    <div class="card"><h3><span class="ic-q">⚔️</span>Vale a pena · PvP</h3><p class="dica">A Oficina não tem limite de nível: invista onde decide batalha.</p>${tabela(OFICINA.pvp, 'ok')}</div>
    <div class="card"><h3><span class="ic-q">🪓</span>Vale a pena · PvE (bárbaros)</h3><p class="dica">Bárbaros não têm milagres (Hefesto): basta passar o dano deles.</p>${tabela(OFICINA.pve, 'aviso')}</div>
    <div class="card"><h3><span class="ic-q">💤</span>Inútil ou situacional</h3>${tabela(OFICINA.evitar, 'ruim')}</div>
    <p class="rodape-app">Fontes: guias do fórum BR "O que melhorar na Oficina?" e Dossiê do projeto.</p>` : `
    <div class="card"><h3><span class="ic-q">⚙️</span>Regras do motor de combate</h3>${REGRAS_COMBATE.map(r => `<div class="check aviso"><span class="st">${r.icone}</span><div><b>${esc(r.titulo)}</b><small>${esc(r.texto)}</small></div></div>`).join('')}</div>
    <div class="card"><h3><span class="ic-q">🗡️</span>Prioridades · Terra</h3>${LINHAS.terra.map(l => `<div class="item"><span class="ic">${l.icone}</span><span class="meio"><b>${esc(l.nome)}</b><small style="white-space:normal">${esc(l.alvo)}</small></span></div>`).join('')}
      <p class="pequeno mut" style="margin:6px 2px 0">Linha de frente: Hoplitas → Espartanos → Gigantes a Vapor. Muralha exige cerco.</p></div>
    <div class="card"><h3><span class="ic-q">⚓</span>Prioridades · Mar</h3>${LINHAS.mar.map(l => `<div class="item"><span class="ic">${l.icone}</span><span class="meio"><b>${esc(l.nome)}</b><small style="white-space:normal">${esc(l.alvo)}</small></span></div>`).join('')}</div>
    <div class="card"><h3><span class="ic-q">🔥</span>LC Tank em uma linha</h3>${LC_PRESETS.map(p => `<div class="item"><span class="ic">${p.qtd}</span><span class="meio"><b>${esc(p.titulo)}</b><small style="white-space:normal">${esc(p.texto)}</small></span></div>`).join('')}</div>
    <p class="rodape-app">Fontes: "[Guia] Campo de batalha e suas prioridades", "[Guia] Lança Chamas Tank" (Gaelll) · fórum BR.</p>`}`;
  raiz.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b) ctx.ir('guias', b.dataset.aba); });
}
