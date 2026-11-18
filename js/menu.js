// =====================================================================
// MENU EM FOLHA — botão do meio da barra de baixo
// =====================================================================
import { folha, esc } from './folha.js';
import { norm } from './ui.js';

let itensFn = () => [];
export const definirItens = fn => { itensFn = fn; };

const bloco = x => `<button type="button" class="mn-bloco mn-vidro" data-item="${esc(x.id)}"><span class="ic">${x.icone}</span><b>${esc(x.nome)}</b><small>${esc(x.sub)}</small>${x.badge ? `<span class="mn-badge">${x.badge}</span>` : ''}</button>`;

async function escolher(id, ...folhas) {
  const x = itensFn().find(i => i.id === id);
  for (const f of folhas) if (f && !f.fechado) await f.fechar();
  if (x) x.abrir();
}

function abrirBusca(menu) {
  const todos = itensFn().filter(x => x.pode());
  const b = folha({
    classe: 'mn-busca-folha', titulo: 'Procurar',
    html: '<div class="mn-campo"><span>🔎</span><input type="search" placeholder="Viagem, vinho, saque, LC…" autocomplete="off" enterkeyhint="search"></div><div data-achados></div>',
  });
  const lugar = b.corpo.querySelector('[data-achados]');
  const desenhar = filtro => {
    const t = norm(filtro);
    const lista = todos.filter(x => !t || norm(`${x.nome} ${x.sub} ${x.grupo} ${x.tags || ''}`).includes(t));
    lugar.innerHTML = lista.length
      ? `<div class="mn-vidro">${lista.map(x => `<div class="mn-item" data-item="${esc(x.id)}"><span class="ic">${x.icone}</span><span class="meio"><b>${esc(x.nome)}</b><small>${esc(x.grupo)} · ${esc(x.sub)}</small></span><span>›</span></div>`).join('')}</div>`
      : `<div class="mn-vazio">Nada com "${esc(filtro)}".</div>`;
  };
  desenhar('');
  const campo = b.corpo.querySelector('input');
  campo.addEventListener('input', e => desenhar(e.target.value));
  setTimeout(() => campo.focus(), 300);
  b.corpo.addEventListener('click', e => { const it = e.target.closest('[data-item]'); if (it) escolher(it.dataset.item, b, menu); });
}

export function abrirMenu() {
  const botao = document.getElementById('mnBotao');
  botao.classList.add('aberto');
  const grupos = [];
  itensFn().filter(x => x.pode()).forEach(x => { let g = grupos.find(y => y.nome === x.grupo); if (!g) grupos.push(g = { nome: x.grupo, itens: [] }); g.itens.push(x); });
  const html = grupos.map(g => `<div class="mn-sec">${esc(g.nome)}</div><div class="mn-blocos">${g.itens.map(bloco).join('')}</div>`).join('')
    || '<div class="mn-vazio">Nada liberado para você ainda.</div>';
  const m = folha({ titulo: 'Comando Imperial', sub: 'Tudo do império na palma da mão', html: html + '<div style="height:12px"></div>', lupa: abrirBusca, aoFechar: () => botao.classList.remove('aberto') });
  m.corpo.addEventListener('click', e => { const it = e.target.closest('[data-item]'); if (it) escolher(it.dataset.item, m); });
}

export function iniciarMenu() {
  document.getElementById('mnBotao').addEventListener('click', abrirMenu);
}
