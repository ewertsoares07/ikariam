// PvE — Vila dos Bárbaros por ilha e Emboscada Abissal
import * as store from '../store.js';
import * as T from '../timers.js';
import { UNIDADES } from '../data.js';
import { melhorAbissal, unidadePorId } from '../calc.js';
import { esc, fmt, campoNum, toast } from '../ui.js';

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
      <div class="grade2" style="margin-top:8px">
        <label class="marcar"><input type="checkbox" data-campo="muralha" ${i.b.muralha ? 'checked' : ''}> 🧱 Tem muralha</label>
        <label class="marcar"><input type="checkbox" data-campo="frota" ${i.b.frota ? 'checked' : ''}> ⛵ Tem frota</label>
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
  });
  raiz.addEventListener('change', e => {
    const card = e.target.closest('[data-ilha]'); const campo = e.target.dataset.campo;
    if (card && campo) alterarIlha(card.dataset.ilha, card.dataset.ref, b => { b[campo] = e.target.checked; });
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
      <div class="grade4" style="margin-top:8px">
        <label class="campo"><span>Peso</span>${campoNum('peso', l.peso ?? '', 'min="1"')}</label>
        <label class="campo"><span>Dano</span>${campoNum('dano', l.dano ?? '', 'min="0"')}</label>
        <label class="campo"><span>Efic. %</span>${campoNum('efic', l.efic ?? 100, 'min="0" max="200"')}</label>
        <label class="campo"><span>Tenho</span>${campoNum('disponivel', l.disponivel ?? '', 'min="0"')}</label>
      </div></div>`; }).join('') || '<div class="vazio">Adicione as unidades que você pode mandar. A eficácia muda conforme a fraqueza do monstro (80% a 120%).</div>'}
    <div class="flex"><select class="entrada cresce" data-add><option value="">＋ Adicionar unidade…</option>${UNIDADES.map(u => `<option value="${u.id}">${u.icone} ${esc(u.nome)}</option>`).join('')}</select></div>
    ${r.itens.length ? `<div class="resultado"><div class="mut pequeno">Melhor ataque dentro de 1.000 de peso</div><div class="grande">${fmt(r.dano)} de dano</div>
      ${r.itens.map(i => `<div class="linha"><span>${esc(i.nome)}</span><b>${fmt(i.qtd)} (${fmt(i.peso)} peso)</b></div>`).join('')}
      <div class="linha"><span>Peso usado</span><b>${fmt(r.peso)} / 1.000</b></div></div>` : ''}
    <p class="pequeno mut" style="margin:8px 2px 0">Dica do evento: evite unidades de defesa (ex.: Hoplitas) se tiver alternativas de dano base alto.</p>
  </div>`;
  raiz.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-add]') && t.value) {
      const u = unidadePorId(t.value);
      store.set(st => { st.abissal.push({ id: u.id, peso: u.peso || null, dano: null, efic: 100, disponivel: null }); });
      return;
    }
    const linha = t.closest('[data-linha]');
    if (linha && t.name) store.set(st => { st.abissal[+linha.dataset.linha][t.name] = t.value === '' ? null : +t.value; });
  });
  raiz.addEventListener('click', e => { const l = e.target.closest('[data-tirar]')?.closest('[data-linha]'); if (l) store.set(st => { st.abissal.splice(+l.dataset.linha, 1); }); });
}
