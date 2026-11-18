// PvE — Vila dos Bárbaros por ilha e Emboscada Abissal
import * as store from '../store.js';
import * as T from '../timers.js';
import { UNIDADES } from '../data.js';
import { melhorAbissal, unidadePorId } from '../calc.js';
import { esc, fmt, toast, escolher, pedirCampos } from '../ui.js';

const ABAS = [['barbaros', '🪓 Bárbaros'], ['abissal', '🐙 Emboscada Abissal']];

export function render(raiz, ctx) {
  const sub = ctx.sub === 'abissal' ? 'abissal' : 'barbaros';
  raiz.innerHTML = `<div class="tela-titulo"><div><h2>PvE</h2><p>Bárbaros e eventos</p></div></div>
    <div class="seg">${ABAS.map(([id, n]) => `<button class="${id === sub ? 'ativo' : ''}" data-aba="${id}">${n}</button>`).join('')}</div><div data-c></div>`;
  raiz.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b) ctx.ir('pve', b.dataset.aba); });
  (sub === 'abissal' ? abissal : barbaros)(raiz.querySelector('[data-c]'), ctx);
}

function barbaros(raiz, ctx) {
  const { s } = ctx;
  const ilhas = new Map();
  s.cidades.forEach(c => { const k = c.coords || `sem-${c.id}`; if (!ilhas.has(k)) ilhas.set(k, { coords: c.coords, cidades: [], b: c.barbaros }); ilhas.get(k).cidades.push(c); });
  raiz.innerHTML = `<div class="card"><h3><span class="ic-q">🪓</span>Vila dos Bárbaros por ilha</h3>
    <p class="dica">Cada ilha tem a sua vila. Marque a vitória e o nível sobe sozinho. Nos níveis altos aparece muralha e frota bárbara: leve cerco e trirremes.</p>
    ${[...ilhas.values()].map(i => `<div class="card" style="background:rgba(255,255,255,.03);box-shadow:none" data-ilha="${esc(i.coords || '')}" data-ref="${i.cidades[0].id}">
      <div class="card-topo"><span class="ic-q">🏝️</span><div class="cresce"><b>${i.coords ? `[${esc(i.coords)}]` : 'Sem coordenada'}</b><div class="mut pequeno">${i.cidades.map(c => esc(c.nome)).join(' · ')}</div></div>
        <span class="chip ouro" style="font-size:.85rem">Nível ${i.b.nivel}</span></div>
      <div class="grade3"><button class="btn mini" data-menos>−1</button><button class="btn ouro mini" data-venci>🏆 Venci</button><button class="btn mini" data-mais>+1</button></div>
      <div class="dados d2" style="margin-top:8px">
        <button class="dado ${i.b.muralha ? 'desliga' : ''}" data-campo="muralha"><span>Muralha</span><b>${i.b.muralha ? '🧱 Tem' : 'Não tem'}</b><small>toque para trocar</small></button>
        <button class="dado ${i.b.frota ? 'desliga' : ''}" data-campo="frota"><span>Frota bárbara</span><b>${i.b.frota ? '⛵ Tem' : 'Não tem'}</b><small>toque para trocar</small></button>
      </div>
      ${i.b.muralha ? '<div class="alerta aviso" style="margin-top:8px">Vila com muralha: leve Morteiros/Aríetes, senão a frente bate na parede.</div>' : ''}
      <div class="pequeno mut" style="margin-top:6px">${fmt(i.b.vitorias || 0)} vitória(s) registradas</div>
    </div>`).join('') || '<div class="vazio">Cadastre suas cidades com coordenada no Império.</div>'}</div>`;
  const alterarIlha = (coords, ref, fn) => store.set(st => st.cidades.forEach(c => { if ((coords && c.coords === coords) || c.id === ref) fn(c.barbaros); }));
  raiz.addEventListener('click', e => {
    const card = e.target.closest('[data-ilha]'); if (!card) return;
    const { ilha, ref } = card.dataset;
    if (e.target.closest('[data-venci]')) { alterarIlha(ilha, ref, b => { b.nivel = Math.min(60, (b.nivel || 1) + 1); b.vitorias = (b.vitorias || 0) + 1; }); toast('🏆 Vitória registrada', 'ok'); }
    if (e.target.closest('[data-mais]')) alterarIlha(ilha, ref, b => { b.nivel = Math.min(60, (b.nivel || 1) + 1); });
    if (e.target.closest('[data-menos]')) alterarIlha(ilha, ref, b => { b.nivel = Math.max(1, (b.nivel || 1) - 1); });
    const campo = e.target.closest('[data-campo]')?.dataset.campo;
    if (campo) alterarIlha(ilha, ref, b => { b[campo] = !b[campo]; });
  });
}

function abissal(raiz, ctx) {
  const { s } = ctx;
  const linhas = s.abissal.length ? s.abissal : [];
  const r = melhorAbissal(linhas.map(l => ({ ...l, nome: unidadePorId(l.id)?.nome || l.id })), 1000);
  raiz.innerHTML = `<div class="card"><h3><span class="ic-q">🐙</span>Emboscada Abissal</h3>
    <p class="dica">Limite de <b>1.000 de peso</b> por ataque, 1 rodada, tudo morre no fim. Oficina e milagres não contam. Dano = quantidade × dano base × eficácia.</p>
    ${linhas.map((l, i) => { const u = unidadePorId(l.id); return `<div class="card" style="background:rgba(255,255,255,.03);box-shadow:none;padding:10px" data-linha="${i}">
      <div class="flex"><span class="ic-q">${u?.icone || '❔'}</span><b class="cresce">${esc(u?.nome || l.id)}</b><button class="icone-btn" data-tirar aria-label="Tirar">✕</button></div>
      <div class="dados" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-top:8px">
        <button class="dado ${l.peso == null ? 'falta' : ''}" data-ed><span>Peso</span><b>${l.peso ?? '—'}</b></button>
        <button class="dado ${l.dano == null ? 'falta' : ''}" data-ed><span>Dano</span><b>${l.dano ?? '—'}</b></button>
        <button class="dado" data-ed><span>Efic.</span><b>${l.efic ?? 100}%</b></button>
        <button class="dado ${l.disponivel == null ? 'falta' : ''}" data-ed><span>Tenho</span><b>${l.disponivel != null ? fmt(l.disponivel) : '—'}</b></button>
      </div></div>`; }).join('') || '<div class="vazio">Adicione as unidades que você pode mandar. A eficácia muda conforme a fraqueza do monstro (80% a 120%).</div>'}
    <button class="btn bloco" data-add>＋ Adicionar unidade</button>
    ${r.itens.length ? `<div class="resultado"><div class="mut pequeno">Melhor ataque dentro de 1.000 de peso</div><div class="grande">${fmt(r.dano)} de dano</div>
      ${r.itens.map(i => `<div class="linha"><span>${esc(i.nome)}</span><b>${fmt(i.qtd)} (${fmt(i.peso)} peso)</b></div>`).join('')}
      <div class="linha"><span>Peso usado</span><b>${fmt(r.peso)} / 1.000</b></div></div>` : ''}
    <p class="pequeno mut" style="margin:8px 2px 0">Dica do evento: evite unidades de defesa (ex.: Hoplitas) se tiver alternativas de dano base alto.</p>
  </div>`;
  raiz.addEventListener('click', async e => {
    if (e.target.closest('[data-add]')) {
      const id = await escolher({ titulo: '🐙 Adicionar unidade', sub: 'Quem vai na emboscada', opcoes: UNIDADES.filter(u => !s.abissal.some(l => l.id === u.id)).map(u => ({ id: u.id, icone: u.icone, nome: u.nome, sub: `peso ${u.peso ?? '?'} · ${u.tipo === 'mar' ? 'mar' : 'terra'}` })) });
      if (!id) return;
      const u = unidadePorId(id);
      store.set(st => { st.abissal.push({ id: u.id, peso: u.peso || null, dano: null, efic: 100, disponivel: null }); });
      return;
    }
    const lin = e.target.closest('[data-ed]')?.closest('[data-linha]');
    if (lin) {
      const i = +lin.dataset.linha, l = s.abissal[i], u = unidadePorId(l.id);
      const r = await pedirCampos({ titulo: `${u?.icone || ''} ${u?.nome || l.id}`, sub: 'Emboscada Abissal', dica: 'Dano base da unidade e eficácia contra o monstro da vez (80% a 120%).',
        campos: [{ name: 'peso', rotulo: 'Peso', valor: l.peso }, { name: 'dano', rotulo: 'Dano', valor: l.dano }, { name: 'efic', rotulo: 'Eficácia %', valor: l.efic ?? 100 }, { name: 'disponivel', rotulo: 'Tenho', valor: l.disponivel }] });
      if (r) store.set(st => { Object.assign(st.abissal[i], r); });
    }
  });
  raiz.addEventListener('click', e => { const l = e.target.closest('[data-tirar]')?.closest('[data-linha]'); if (l) store.set(st => { st.abissal.splice(+l.dataset.linha, 1); }); });
}
