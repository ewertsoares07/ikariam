// =====================================================================
// FOLHA QUE SOBE DE BAIXO (padrão "menu em folha azul" do SPYC)
// Fecha arrastando para baixo, tocando fora, no X ou no voltar do Android.
// =====================================================================
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const abertas = [];
let ignorarPop = 0;
// Um único ouvinte do "voltar": fecha só a folha do topo
window.addEventListener('popstate', () => {
  if (ignorarPop > 0) { ignorarPop--; return; }
  const topo = abertas[abertas.length - 1];
  if (topo) topo.sair();
});

export function folha({ classe = '', titulo = '', sub = '', html = '', lupa = null, aoFechar = null, aoAbrir = null }) {
  const el = document.createElement('div');
  el.className = 'mn-fundo ' + classe;
  el.innerHTML = `<div class="mn-folha" role="dialog" aria-modal="true" aria-label="${esc(titulo)}"><div class="mn-puxador"></div>
    <div class="mn-topo"><h3>${esc(titulo)}${sub ? `<small>${esc(sub)}</small>` : ''}</h3>
    ${lupa ? '<button type="button" class="mn-x" data-lupa aria-label="Procurar"><svg viewBox="0 0 24 24" width="18" height="18"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' : ''}
    <button type="button" class="mn-x" data-fechar aria-label="Fechar">✕</button></div>
    <div class="mn-corpo">${html}</div></div>`;
  document.body.appendChild(el);
  const f = { el, corpo: el.querySelector('.mn-corpo'), fechado: false };
  const sair = () => new Promise(ok => {
    if (f.fechado) return ok();
    f.fechado = true;
    const i = abertas.indexOf(f); if (i >= 0) abertas.splice(i, 1);
    el.classList.add('saindo'); el.classList.remove('aberta');
    setTimeout(() => { el.remove(); aoFechar && aoFechar(); ok(); }, 260);
  });
  f.sair = sair;
  f.fechar = () => {
    if (f.fechado) return Promise.resolve();
    if (history.state && history.state.mnFolha) { ignorarPop++; history.back(); }
    return sair();
  };
  history.pushState({ mnFolha: true }, '', location.href);
  abertas.push(f);
  el.addEventListener('click', e => {
    if (e.target === el || e.target.closest('[data-fechar]')) f.fechar();
    else if (e.target.closest('[data-lupa]') && lupa) lupa(f);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('aberta')));
  arrastarParaFechar(f);
  aoAbrir && aoAbrir(f);
  return f;
}

export const folhaAberta = () => abertas.length > 0;
export async function fecharTodas() { for (const f of [...abertas].reverse()) await f.fechar(); }

function arrastarParaFechar(f) {
  const caixa = f.el.querySelector('.mn-folha');
  let y0 = 0, x0 = 0, t0 = 0, dy = 0, arrastando = false, decidido = false, peloCorpo = false;
  caixa.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    const alvo = e.target;
    peloCorpo = !alvo.closest('.mn-puxador, .mn-topo');
    if (alvo.closest('input, textarea, select, [data-sem-arrasto]') || (peloCorpo && f.corpo.scrollTop > 0)) { decidido = true; arrastando = false; return; }
    y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; t0 = Date.now(); dy = 0; arrastando = false; decidido = false;
  }, { passive: true });
  caixa.addEventListener('touchmove', e => {
    if (decidido && !arrastando) return;
    const y = e.touches[0].clientY, x = e.touches[0].clientX, d = y - y0;
    if (!decidido) {
      if (Math.abs(d) < 8 && Math.abs(x - x0) < 8) return;
      decidido = true;
      arrastando = d > 0 && Math.abs(d) > Math.abs(x - x0) && (!peloCorpo || f.corpo.scrollTop <= 0);
      if (!arrastando) return;
      caixa.style.transition = 'none';
    }
    dy = Math.max(0, d);
    caixa.style.transform = `translateY(${dy}px)`;
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  const soltar = () => {
    if (!arrastando) { decidido = false; return; }
    arrastando = false; decidido = false;
    const rapido = dy / Math.max(1, Date.now() - t0) > 0.6;
    caixa.style.transition = '';
    if (dy > Math.min(140, caixa.offsetHeight * 0.3) || (rapido && dy > 40)) { caixa.style.transform = 'translateY(100%)'; f.fechar(); }
    else caixa.style.transform = '';
  };
  caixa.addEventListener('touchend', soltar);
  caixa.addEventListener('touchcancel', soltar);
}
