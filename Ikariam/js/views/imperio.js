// IMPÉRIO — as cidades, o vinho de cada taverna e a segurança dos portos
import * as store from '../store.js';
import * as T from '../timers.js';
import { PAPEIS, CHECKLIST_MOVEL } from '../data.js';
import { vinhoAgora, reposicaoVinho, corrupcao, nivelSemCorrupcao, lerCoords } from '../calc.js';
import { esc, fmt, fmtPct, fmtQuando, folha, toast, confirmar, campoNum, campoCoords } from '../ui.js';
import { focarCidade } from './militar.js';

const abertas = new Set();
let filtro = 'todas';
let ordem = 'minha';

const papel = id => PAPEIS.find(p => p.id === id);
const corNivel = { verde: 'verde', ok: 'ok', amarelo: 'amarelo', vermelho: 'vermelho' };
const textoNivel = { verde: 'mais de 7 dias', ok: 'entre 2 e 7 dias', amarelo: 'menos de 48h', vermelho: 'CRÍTICO: menos de 12h' };

function cabecalho(c, v) {
  const p = papel(c.papel);
  return `<button class="cid-topo" data-abrir="${c.id}">
    <span class="ic">${c.capital ? '👑' : p ? p.icone : '🏛️'}</span>
    <span class="meio"><b>${esc(c.nome || 'Sem nome')}</b><small>${c.coords ? `[${esc(c.coords)}]` : 'sem coordenada'} · ${esc(p ? p.nome : c.capital ? 'Capital' : 'sem papel')}${c.papel === 'movel' && c.movel?.ativa ? ' · 🟢 em guerra' : ''}</small></span>
    <span class="fim" style="text-align:right">
      ${v ? `<span class="flex" style="justify-content:flex-end;gap:6px"><span class="semaforo ${corNivel[v.nivel]}"></span><span class="contagem pequeno" data-fim="${v.zeraEm}" data-curto data-zero="SECOU">…</span></span>` : '<span class="mut pequeno">🍇 —</span>'}
      <span class="pequeno mut" style="display:block">${c.alarme ? '🔔 alarme' : '🔕 sem alarme'}</span>
    </span>
    <span class="seta">›</span></button>`;
}

function corpo(c, v, s) {
  const total = s.cidades.length;
  const cap = s.config.capMercante || 500;
  const corr = c.residencia != null ? corrupcao(c.residencia, total) : null;
  const necessario = nivelSemCorrupcao(total);
  const p = papel(c.papel);
  return `<div class="cid-corpo" data-cidade="${c.id}">
    <div class="sec-t">🍇 Vinho e taverna</div>
    <div class="grade2">
      <label class="campo"><span>Vinho no armazém</span>${campoNum('estoque', v ? Math.floor(v.restante) : c.vinho?.estoque ?? '', 'min="0" placeholder="ex.: 25000"')}</label>
      <label class="campo"><span>Consumo / hora</span>${campoNum('consumo', c.vinho?.consumo ?? '', 'min="0" placeholder="ex.: 240"')}</label>
    </div>
    <button class="btn egeu bloco" style="margin-top:8px" data-salvar-vinho>✓ Atualizar vinho agora</button>
    ${v ? `<div class="resultado">
      <div class="flex entre"><span class="mut pequeno">Seca em</span><span class="chip ${corNivel[v.nivel]}">${textoNivel[v.nivel]}</span></div>
      <div class="grande contagem" data-fim="${v.zeraEm}" data-zero="SECOU">…</div>
      <div class="linha"><span>Zera ${esc(fmtQuando(v.zeraEm))}</span><b>${fmt(v.restante)} restantes</b></div>
      <div class="linha"><span>Atualizado</span><b>${esc(fmtQuando(c.vinho.em))}</b></div>
    </div>
    <div class="sec-t">🚢 Reposição a partir da capital</div>
    <div class="grade3">${[7, 14, 30].map(d => { const r = reposicaoVinho(c.vinho.consumo, d, v.restante, cap); return `<button class="kpi" data-repor="${r.precisa}" style="text-align:left"><span>${d} dias</span><b>${fmt(r.precisa)}</b><span>${fmt(r.barcos)} barcos</span></button>`; }).join('')}</div>
    <p class="pequeno mut" style="margin:6px 2px 0">Toque num prazo para registrar que o vinho chegou. Barco = ${fmt(cap)} de carga.</p>
    <div class="flex" style="margin-top:8px">
      ${campoNum('chegou', '', 'class="entrada cresce" placeholder="Chegou quanto vinho?" min="0"')}
      <button class="btn mini" data-chegou>＋ Abasteci</button>
    </div>
    <button class="btn fantasma mini bloco" style="margin-top:8px" data-alarme-vinho>⏰ Alarme 3h antes de secar</button>` : '<p class="pequeno mut" style="margin:8px 2px 0">Preencha só quando abastecer: o app conta sozinho até a próxima vez.</p>'}

    <div class="sec-t">🛡️ Segurança e gestão</div>
    <label class="marcar"><input type="checkbox" data-alarme ${c.alarme ? 'checked' : ''}>
      <span class="cresce">Barco Alarme no porto<small class="mut" style="display:block;font-weight:600">1 Lança-Chamas ou 1 Trirreme força 1 rodada naval e trava pilhagem rápida. Não deixe Submergível parado: é caro.</small></span></label>
    <div class="grade2" style="margin-top:8px">
      <label class="campo"><span>${c.capital ? 'Nível do Palácio' : 'Nível da Residência'}</span>${campoNum('residencia', c.residencia ?? '', 'min="0" max="60" placeholder="0"')}</label>
      <div class="kpi ${corr == null ? '' : corr > 0 ? 'vermelho' : 'verde'}"><span>Corrupção</span><b>${corr == null ? '—' : fmtPct(corr, 1)}</b><span>precisa nível ${necessario}</span></div>
    </div>

    ${c.papel === 'movel' ? `
    <div class="sec-t">🧭 Cidade móvel</div>
    ${CHECKLIST_MOVEL.map(it => `<label class="marcar" style="margin-bottom:6px"><input type="checkbox" data-movel="${it.id}" ${c.movel?.checklist?.[it.id] ? 'checked' : ''}> ${esc(it.texto)}</label>`).join('')}
    <div class="grade2" style="margin-top:6px">
      <button class="btn ${c.movel?.ativa ? '' : 'ouro'}" data-movel-ativa>${c.movel?.ativa ? '⏸️ Pausar' : '⚔️ Ativar na guerra'}</button>
      <button class="btn perigo" data-movel-abandonar>🏳️ Abandonar móvel</button>
    </div>` : ''}

    <div class="sec-t">📝 Notas</div>
    <textarea class="entrada" name="notas" rows="2" placeholder="Ex.: ilha de cristal, vizinho perigoso…">${esc(c.notas || '')}</textarea>
    <div class="grade3" style="margin-top:10px">
      <button class="btn mini" data-editar>✏️ Editar</button>
      <button class="btn mini" data-exercito>🛡️ Exército</button>
      <button class="btn mini" data-apagar>🗑️ Apagar</button>
    </div>
    ${p ? `<p class="pequeno mut" style="margin:8px 2px 0">${p.icone} ${esc(p.dica)}</p>` : ''}
  </div>`;
}

export function formCidade(c = null) {
  const novo = !c;
  c = c || store.novaCidade();
  const f = folha({
    titulo: novo ? 'Nova cidade' : 'Editar cidade', sub: novo ? 'Nome, ilha e papel no império' : c.nome,
    html: `<form>
      <label class="campo"><span>Nome</span><input name="nome" value="${esc(c.nome)}" required maxlength="40" placeholder="Ex.: SPYC"></label>
      <label class="campo"><span>Coordenadas da ilha</span>${campoCoords('coords', c.coords)}</label>
      <div class="campo"><span>Papel tático</span><div class="linha-chips" data-papeis>${PAPEIS.map(p => `<button type="button" class="chip ${c.papel === p.id ? 'ativo' : ''}" data-p="${p.id}">${p.icone} ${esc(p.nome)}</button>`).join('')}</div></div>
      <label class="marcar"><input type="checkbox" name="capital" ${c.capital ? 'checked' : ''}> 👑 É a capital (tem o Palácio)</label>
      <div class="fl-botoes"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn ouro" type="submit">${novo ? 'Adicionar' : 'Salvar'}</button></div>
    </form>`,
  });
  let papelSel = c.papel;
  f.corpo.querySelector('[data-papeis]').addEventListener('click', e => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    papelSel = papelSel === b.dataset.p ? '' : b.dataset.p;
    f.corpo.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('ativo', x.dataset.p === papelSel));
  });
  f.corpo.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(e.target);
    const nome = String(d.get('nome') || '').trim();
    if (!nome) return;
    const coordsTxt = String(d.get('coords') || '').trim();
    const cc = lerCoords(coordsTxt);
    const capital = !!d.get('capital') || papelSel === 'capital';
    store.set(s => {
      if (capital) s.cidades.forEach(x => { x.capital = false; });
      const alvo = novo ? c : s.cidades.find(x => x.id === c.id);
      Object.assign(alvo, { nome, coords: cc ? `${cc.x}:${cc.y}` : coordsTxt, papel: papelSel, capital });
      if (novo) { s.cidades.push(alvo); abertas.add(alvo.id); }
      s.cidades.sort((a, b) => (b.capital - a.capital));
    });
    toast(novo ? 'Cidade adicionada ✔' : 'Cidade salva ✔', 'ok');
    f.fechar();
  });
}

function formVarias() {
  const f = folha({
    titulo: 'Adicionar várias', sub: 'Uma cidade por linha',
    html: `<p class="fl-texto pequeno">Escreva "Nome coordenada", uma por linha. A primeira vira a capital se você ainda não tiver uma.</p>
      <textarea class="entrada" rows="8" data-txt placeholder="SPYC 96:71&#10;CCSP 96:71&#10;YCSA 95:70"></textarea>
      <div class="fl-botoes"><button class="btn" data-fechar>Cancelar</button><button class="btn ouro" data-ok>Adicionar</button></div>`,
  });
  f.corpo.querySelector('[data-ok]').onclick = () => {
    const linhas = f.corpo.querySelector('[data-txt]').value.split(/\n/).map(l => l.trim()).filter(Boolean);
    if (!linhas.length) return;
    store.set(s => {
      const temCapital = s.cidades.some(c => c.capital);
      linhas.forEach((l, i) => {
        const m = l.match(/\[?(\d{1,3})\s*:\s*(\d{1,3})\]?/);
        const nome = l.replace(/\[?\d{1,3}\s*:\s*\d{1,3}\]?/, '').trim() || `Cidade ${s.cidades.length + 1}`;
        const capital = !temCapital && i === 0;
        s.cidades.push(store.novaCidade({ nome, coords: m ? `${m[1]}:${m[2]}` : '', capital, papel: capital ? 'capital' : '' }));
      });
    });
    toast(`${linhas.length} cidade(s) adicionada(s)`, 'ok');
    f.fechar();
  };
}

export function render(raiz, ctx) {
  const { s, ir } = ctx;
  const agora = Date.now();
  let cs = s.cidades.map(c => ({ c, v: vinhoAgora(c.vinho, agora) }));
  const total = cs.length;
  const comVinho = cs.filter(x => x.v);
  const pior = [...comVinho].sort((a, b) => a.v.segRest - b.v.segRest)[0];
  const alarmes = s.cidades.filter(c => c.alarme).length;
  const corruptas = s.cidades.filter(c => c.residencia != null && corrupcao(c.residencia, total) > 0).length;
  if (filtro === 'urgente') cs = cs.filter(x => x.v && (x.v.nivel === 'vermelho' || x.v.nivel === 'amarelo'));
  if (filtro === 'alarme') cs = cs.filter(x => !x.c.alarme);
  if (ordem === 'vinho') cs.sort((a, b) => (a.v ? a.v.segRest : 1e12) - (b.v ? b.v.segRest : 1e12));

  raiz.innerHTML = `
  <div class="tela-titulo"><div><h2>Império</h2><p>${total} cidade${total === 1 ? '' : 's'} · toque numa cidade para abrir</p></div>
    <div class="acoes"><button class="btn mini" data-varias>☰ Várias</button><button class="btn ouro mini" data-nova>＋ Cidade</button></div></div>
  ${total ? `
  <div class="grade2" style="margin-bottom:12px">
    <div class="kpi ${pior ? corNivel[pior.v.nivel] === 'ok' ? '' : corNivel[pior.v.nivel] : ''}"><span>Menor vinho</span><b>${pior ? `<em data-fim="${pior.v.zeraEm}" data-curto>…</em>` : '—'}</b><span>${pior ? esc(pior.c.nome) : 'sem dados'}</span></div>
    <div class="kpi ${alarmes === total ? 'verde' : 'amarelo'}"><span>Barco alarme</span><b>${alarmes}/${total}</b><span>portos protegidos</span></div>
    <div class="kpi ${corruptas ? 'vermelho' : 'verde'}"><span>Corrupção</span><b>${corruptas ? `${corruptas} cidade(s)` : 'zero'}</b><span>nível ${nivelSemCorrupcao(total)} em todas</span></div>
    <div class="kpi ouro"><span>Barco mercante</span><b>${fmt(s.config.capMercante)}</b><span>de carga cada</span></div>
  </div>
  <div class="flex quebra" style="margin-bottom:10px">
    <div class="linha-chips cresce">
      ${[['todas', 'Todas'], ['urgente', '🍇 Urgentes'], ['alarme', '🔕 Sem alarme']].map(([id, n]) => `<button class="chip ${filtro === id ? 'ativo' : ''}" data-filtro="${id}">${n}</button>`).join('')}
    </div>
    <button class="chip" data-ordem>${ordem === 'vinho' ? '⏳ por vinho' : '📌 minha ordem'}</button>
  </div>
  ${cs.map(({ c, v }) => `<div class="cid ${abertas.has(c.id) ? 'aberta' : ''}" id="cid-${c.id}">${cabecalho(c, v)}${corpo(c, v, s)}</div>`).join('') || '<div class="vazio">Nenhuma cidade neste filtro.</div>'}
  ` : `<div class="card"><div class="vazio"><span class="grande">🏘️</span>Nenhuma cidade ainda.<br>Adicione uma por uma ou várias de uma vez.</div>
    <div class="grade2"><button class="btn ouro" data-nova>＋ Cidade</button><button class="btn" data-varias>☰ Várias</button></div></div>`}`;

  const cid = el => store.get().cidades.find(c => c.id === el.closest('[data-cidade]')?.dataset.cidade);
  const alterar = (id, fn) => store.set(st => { const c = st.cidades.find(x => x.id === id); if (c) fn(c, st); });

  raiz.addEventListener('click', async e => {
    const t = e.target;
    const ab = t.closest('[data-abrir]');
    if (ab) { const id = ab.dataset.abrir; abertas.has(id) ? abertas.delete(id) : abertas.add(id); document.getElementById('cid-' + id)?.classList.toggle('aberta'); return; }
    if (t.closest('[data-nova]')) return formCidade();
    if (t.closest('[data-varias]')) return formVarias();
    const fl = t.closest('[data-filtro]'); if (fl) { filtro = fl.dataset.filtro; return ctx.atualizar(); }
    if (t.closest('[data-ordem]')) { ordem = ordem === 'vinho' ? 'minha' : 'vinho'; return ctx.atualizar(); }
    const c = cid(t); if (!c) return;
    const box = t.closest('[data-cidade]');
    if (t.closest('[data-salvar-vinho]')) {
      const estoque = +box.querySelector('[name=estoque]').value, consumo = +box.querySelector('[name=consumo]').value;
      if (!(consumo > 0)) return toast('Informe o consumo por hora da taverna', 'erro');
      alterar(c.id, x => { x.vinho = { estoque: Math.max(0, estoque || 0), consumo, em: Date.now() }; });
      return toast('🍇 Vinho atualizado', 'ok');
    }
    const rep = t.closest('[data-repor]');
    if (rep) { box.querySelector('[name=chegou]').value = rep.dataset.repor; box.querySelector('[name=chegou]').focus(); return; }
    if (t.closest('[data-chegou]')) {
      const qtd = +box.querySelector('[name=chegou]').value;
      if (!(qtd > 0)) return toast('Quanto vinho chegou?', 'erro');
      alterar(c.id, x => { const v = vinhoAgora(x.vinho); x.vinho = { ...x.vinho, estoque: Math.floor((v ? v.restante : 0) + qtd), em: Date.now() }; });
      return toast(`🍇 +${fmt(qtd)} em ${c.nome}`, 'ok');
    }
    if (t.closest('[data-alarme-vinho]')) {
      const v = vinhoAgora(c.vinho);
      const fim = v.zeraEm - 3 * 3600e3;
      if (fim <= Date.now()) return toast('Faltam menos de 3h: abasteça já!', 'erro');
      return T.novoTimer({ nome: `Vinho de ${c.nome} seca em 3h`, icone: '🍇', fim, tipo: 'vinho', ref: c.id });
    }
    if (t.closest('[data-movel-ativa]')) return alterar(c.id, x => { x.movel.ativa = !x.movel.ativa; });
    if (t.closest('[data-movel-abandonar]')) {
      if (await confirmar('Abandonar cidade móvel?', `Limpa coordenada, checklist e exército de ${c.nome}. O slot continua no império para a próxima guerra.`, 'Abandonar', true))
        alterar(c.id, x => { x.coords = ''; x.movel = { ativa: false, checklist: {} }; x.militar = { fora: false, unidades: {} }; x.alarme = false; x.vinho = { estoque: null, consumo: null, em: null }; });
      return;
    }
    if (t.closest('[data-editar]')) return formCidade(c);
    if (t.closest('[data-exercito]')) { focarCidade(c.id); return ir('militar', 'exercito'); }
    if (t.closest('[data-apagar]')) {
      if (await confirmar('Apagar cidade?', `${c.nome} sai do app (não do jogo).`, 'Apagar', true)) store.set(st => { st.cidades = st.cidades.filter(x => x.id !== c.id); });
    }
  });

  raiz.addEventListener('change', e => {
    const t = e.target, c = cid(t); if (!c) return;
    if (t.matches('[data-alarme]')) alterar(c.id, x => { x.alarme = t.checked; });
    else if (t.matches('[name=residencia]')) alterar(c.id, x => { x.residencia = t.value === '' ? null : Math.max(0, +t.value); });
    else if (t.matches('[data-movel]')) alterar(c.id, x => { x.movel.checklist[t.dataset.movel] = t.checked; });
    else if (t.matches('[name=notas]')) alterar(c.id, x => { x.notas = t.value; });
  });
}
