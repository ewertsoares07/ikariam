// ALVOS — caderno de espionagem, leitor de relatório e calculadora de saque
import * as store from '../store.js';
import { RECURSOS } from '../data.js';
import { saque, distancia, tempoViagem, unidadePorId } from '../calc.js';
import { lerRelatorio } from '../parser.js';
import { esc, fmt, fmtK, fmtDur, fmtDesde, folha, toast, confirmar, campoNum, campoCoords, norm } from '../ui.js';
import { colarFolha } from './comum.js';

const RES_OURO = [...RECURSOS, { id: 'ouro', nome: 'Ouro', icone: '🪙' }];

function maisPerto(coords, cidades) {
  let melhor = null;
  for (const c of cidades) {
    const d = distancia(c.coords, coords);
    if (d != null && (!melhor || d < melhor.d)) melhor = { c, d };
  }
  if (!melhor) return null;
  return { ...melhor, seg: tempoViagem({ dist: melhor.d, vel: 60 }).seg };
}

function cartaoAlvo(a, s, membro) {
  const sq = saque(a.recursos, a.saquePct ?? 100, s.config.capMercante);
  const perto = a.coords ? maisPerto(a.coords, s.cidades) : null;
  const tropas = Object.entries(a.unidades || {}).filter(([, q]) => q > 0);
  return `<div class="card" data-alvo="${a.id}">
    <div class="card-topo"><span class="ic-q">${a.cozinheiros === false ? '🍽️' : '🎯'}</span>
      <div class="cresce" style="min-width:0"><h3 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(a.nome || 'Alvo sem nome')}</h3>
      <div class="mut pequeno">${a.alianca ? `[${esc(a.alianca)}] · ` : ''}${a.coords ? `[${esc(a.coords)}]` : 'sem coordenada'}${a.relatorioEm ? ` · relatório ${esc(fmtDesde(a.relatorioEm))}` : ''}</div></div>
      <button class="icone-btn" data-editar aria-label="Editar">✏️</button></div>
    <div class="linha-chips">
      ${a.muralha != null ? `<span class="chip ${a.muralha >= 15 ? 'vermelho' : a.muralha > 0 ? 'amarelo' : 'verde'}">🧱 muralha ${a.muralha}</span>` : ''}
      ${a.cozinheiros === false ? '<span class="chip vermelho">SEM cozinheiros · dispersa</span>' : a.cozinheiros ? '<span class="chip">🍲 tem cozinheiros</span>' : ''}
      ${sq.total ? `<span class="chip ouro">💰 ${fmtK(sq.total)} · ${fmt(sq.barcos)} barcos</span>` : ''}
      ${perto ? `<span class="chip">⛵ ${fmtDur(perto.seg, true)} de ${esc(perto.c.nome)}</span>` : ''}
      ${a.compartilhado ? '<span class="chip ok">🤝 na aliança</span>' : ''}
    </div>
    ${tropas.length ? `<div class="pequeno mut" style="margin-top:8px">${tropas.slice(0, 8).map(([id, q]) => `${unidadePorId(id)?.icone || ''} ${fmt(q)}`).join(' · ')}</div>` : ''}
    ${a.notas ? `<p class="pequeno" style="margin:8px 0 0;color:var(--txt2)">${esc(a.notas)}</p>` : ''}
    <div class="grade3" style="margin-top:10px">
      <button class="btn mini" data-viagem>🧭 Viagem</button>
      <button class="btn mini" data-saque>💰 Saque</button>
      ${membro ? `<button class="btn mini" data-partilhar>🤝 Aliança</button>` : '<button class="btn mini" data-apagar>🗑️</button>'}
    </div>
  </div>`;
}

export function formAlvo(a = null, aposSalvar = null) {
  const novo = !a;
  a = a ? structuredClone(a) : store.novoAlvo();
  const f = folha({
    classe: 'mn-alta', titulo: novo ? 'Novo alvo' : a.nome, sub: 'Cole o relatório de espionagem para preencher sozinho',
    html: `<form>
      <button type="button" class="btn ouro bloco" data-colar>📋 Colar relatório do jogo</button>
      <div class="grade2">
        <label class="campo"><span>Jogador / cidade</span><input name="nome" value="${esc(a.nome)}" maxlength="50"></label>
        <label class="campo"><span>Aliança</span><input name="alianca" value="${esc(a.alianca)}" maxlength="20"></label>
        <label class="campo"><span>Coordenadas</span>${campoCoords('coords', a.coords)}</label>
        <label class="campo"><span>Muralha</span>${campoNum('muralha', a.muralha ?? '', 'min="0" max="60"')}</label>
      </div>
      <div class="campo"><span>Cozinheiros no exército?</span><div class="linha-chips" data-coz>
        ${[['sim', '🍲 Sim'], ['nao', '🚫 Não'], ['?', '❔ Não sei']].map(([v, n]) => `<button type="button" class="chip ${(a.cozinheiros === true && v === 'sim') || (a.cozinheiros === false && v === 'nao') || (a.cozinheiros == null && v === '?') ? 'ativo' : ''}" data-v="${v}">${n}</button>`).join('')}</div></div>
      <div class="campo"><span>Recursos no relatório</span></div>
      <div class="grade3">${RES_OURO.map(r => `<label class="campo"><span>${r.icone} ${r.nome}</span>${campoNum('r_' + r.id, a.recursos[r.id] ?? '', 'min="0"')}</label>`).join('')}</div>
      <label class="campo"><span>% saqueável</span>${campoNum('saquePct', a.saquePct ?? 100, 'min="0" max="100"')}</label>
      <label class="campo"><span>Notas</span><textarea name="notas" rows="2">${esc(a.notas)}</textarea></label>
      <div class="fl-botoes">${novo ? '<button type="button" class="btn" data-fechar>Cancelar</button>' : '<button type="button" class="btn perigo" data-apagar>🗑️ Apagar</button>'}<button class="btn ouro" type="submit">Salvar</button></div>
    </form>`,
  });
  const form = f.corpo.querySelector('form');
  let coz = a.cozinheiros;
  f.corpo.querySelector('[data-coz]').addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    coz = b.dataset.v === 'sim' ? true : b.dataset.v === 'nao' ? false : null;
    f.corpo.querySelectorAll('[data-coz] [data-v]').forEach(x => x.classList.toggle('ativo', x === b));
  });
  f.corpo.querySelector('[data-colar]').onclick = () => colarFolha({
    titulo: 'Relatório de espionagem', dica: 'Abra o relatório no jogo, selecione tudo, copie e cole. O app tira recursos, tropas, muralha e coordenada.',
    aoLer: (txt, fc) => {
      const r = lerRelatorio(txt);
      for (const [k, v] of Object.entries(r.recursos)) { const el = form.querySelector(`[name=r_${k}]`); if (el) el.value = v; }
      if (r.muralha != null) form.querySelector('[name=muralha]').value = r.muralha;
      if (r.coords && !form.querySelector('[name=coords]').value) form.querySelector('[name=coords]').value = r.coords;
      a.unidades = r.unidades; a.relatorioEm = Date.now();
      if (Object.keys(r.unidades).length) { coz = !!r.unidades.cozinheiro; f.corpo.querySelectorAll('[data-coz] [data-v]').forEach(x => x.classList.toggle('ativo', x.dataset.v === (coz ? 'sim' : 'nao'))); }
      toast(`Lido: ${Object.keys(r.recursos).length} recursos, ${Object.keys(r.unidades).length} tropas`, 'ok');
      fc.fechar();
    },
  });
  f.corpo.querySelector('[data-apagar]')?.addEventListener('click', async () => {
    if (await confirmar('Apagar alvo?', a.nome, 'Apagar', true)) { store.set(s => { s.alvos = s.alvos.filter(x => x.id !== a.id); }); f.fechar(); }
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const recursos = {};
    RES_OURO.forEach(r => { const v = d.get('r_' + r.id); if (v !== '' && v != null) recursos[r.id] = +v; });
    Object.assign(a, {
      nome: String(d.get('nome') || '').trim(), alianca: String(d.get('alianca') || '').trim(), coords: String(d.get('coords') || '').trim(),
      muralha: d.get('muralha') === '' ? null : +d.get('muralha'), cozinheiros: coz, recursos, saquePct: +d.get('saquePct') || 100,
      notas: String(d.get('notas') || ''), atualizadoEm: Date.now(),
    });
    store.set(s => { const i = s.alvos.findIndex(x => x.id === a.id); if (i >= 0) s.alvos[i] = a; else s.alvos.unshift(a); });
    toast('Alvo salvo ✔', 'ok');
    f.fechar();
    aposSalvar && aposSalvar(a);
  });
  return f;
}

function telaSaque(raiz, ctx) {
  const { s } = ctx;
  const m = (ctx.mem.saque ||= { recursos: {}, pct: 100 });
  const r = saque(m.recursos, m.pct, s.config.capMercante);
  const capC = s.config.capCargueiro || 50000;
  raiz.innerHTML = `
  <div class="tela-titulo"><div><h2>Saque</h2><p>Quantos barcos levar · ouro não ocupa porão</p></div><div class="acoes"><button class="btn mini" data-voltar>‹ Alvos</button></div></div>
  <div class="card">
    <label class="campo"><span>Puxar de um alvo</span><select name="alvo"><option value="">—</option>${s.alvos.map(a => `<option value="${a.id}">${esc(a.nome)} ${a.coords ? `[${esc(a.coords)}]` : ''}</option>`).join('')}</select></label>
    <div class="grade3" style="margin-top:10px">${RES_OURO.map(x => `<label class="campo"><span>${x.icone} ${x.nome}</span>${campoNum('r_' + x.id, m.recursos[x.id] ?? '', 'min="0"')}</label>`).join('')}</div>
    <label class="campo" style="margin-top:10px"><span>% que dá para levar</span>${campoNum('pct', m.pct, 'min="0" max="100"')}</label>
    <div class="resultado">
      <div class="mut pequeno">Saque estimado</div><div class="grande">${fmt(r.total)}</div>
      <div class="linha"><span>Navios mercantes (${fmt(s.config.capMercante)})</span><b>${fmt(r.barcos)}</b></div>
      <div class="linha"><span>ou Cargueiros (${fmt(capC)})</span><b>${fmt(Math.ceil(r.total / capC))}</b></div>
      ${r.ouro ? `<div class="linha"><span>🪙 Ouro (vai junto, sem espaço)</span><b>${fmt(r.ouro)}</b></div>` : ''}
    </div>
  </div>`;
  raiz.addEventListener('click', e => { if (e.target.closest('[data-voltar]')) ctx.ir('alvos'); });
  raiz.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'alvo') { const a = s.alvos.find(x => x.id === t.value); if (a) { m.recursos = { ...a.recursos }; m.pct = a.saquePct ?? 100; } }
    else if (t.name === 'pct') m.pct = +t.value;
    else if (t.name?.startsWith('r_')) m.recursos[t.name.slice(2)] = t.value === '' ? undefined : +t.value;
    ctx.atualizar();
  });
}

export function render(raiz, ctx) {
  const { s, cloud, ir, sub } = ctx;
  if (sub === 'saque') return telaSaque(raiz, ctx);
  const membro = ['membro', 'oficial', 'admin'].includes(cloud.papel());
  const busca = ctx.mem.busca || '';
  const lista = s.alvos.filter(a => !busca || norm(`${a.nome} ${a.alianca} ${a.coords} ${a.notas}`).includes(norm(busca)));
  raiz.innerHTML = `
  <div class="tela-titulo"><div><h2>Alvos</h2><p>${s.alvos.length} no caderno de espionagem</p></div>
    <div class="acoes"><button class="btn mini" data-ir-saque>💰</button><button class="btn ouro mini" data-novo>＋ Alvo</button></div></div>
  ${s.alvos.length > 3 ? `<input class="entrada" type="search" data-busca placeholder="🔎 Procurar por nome, aliança, coordenada…" value="${esc(busca)}" style="margin-bottom:12px">` : ''}
  ${lista.map(a => cartaoAlvo(a, s, membro)).join('') || `<div class="card"><div class="vazio"><span class="grande">🕵️</span>Nenhum alvo ainda.<br>Espione no jogo, copie o relatório e cole aqui.</div><button class="btn ouro bloco" data-novo>📋 Colar primeiro relatório</button></div>`}`;

  if (sub === 'novo') { history.replaceState(null, '', '#/alvos'); setTimeout(() => formAlvo(), 50); }
  raiz.querySelector('[data-busca]')?.addEventListener('input', e => {
    ctx.mem.busca = e.target.value;
    const q = norm(e.target.value);
    raiz.querySelectorAll('[data-alvo]').forEach(el => { const a = s.alvos.find(x => x.id === el.dataset.alvo); el.classList.toggle('oculto', !!q && !norm(`${a.nome} ${a.alianca} ${a.coords} ${a.notas}`).includes(q)); });
  });
  raiz.addEventListener('click', async e => {
    const t = e.target;
    if (t.closest('[data-novo]')) return formAlvo();
    if (t.closest('[data-ir-saque]')) return ir('alvos', 'saque');
    const card = t.closest('[data-alvo]'); if (!card) return;
    const a = s.alvos.find(x => x.id === card.dataset.alvo);
    if (t.closest('[data-editar]')) return formAlvo(a);
    if (t.closest('[data-viagem]')) { sessionStorage.setItem('ikariam_destino', a.coords || ''); return ir('militar', 'viagem'); }
    if (t.closest('[data-saque]')) { const mm = (ctx.mem.saque ||= {}); mm.recursos = { ...a.recursos }; mm.pct = a.saquePct ?? 100; return ir('alvos', 'saque'); }
    if (t.closest('[data-apagar]') && await confirmar('Apagar alvo?', a.nome, 'Apagar', true)) return store.set(st => { st.alvos = st.alvos.filter(x => x.id !== a.id); });
    if (t.closest('[data-partilhar]')) {
      try {
        const { id, compartilhado, ...dados } = a;
        await cloud.salvar('alvosAlianca', a.idAlianca || null, { ...dados, origemId: id }).then(idA => store.set(st => { const x = st.alvos.find(y => y.id === a.id); x.compartilhado = true; x.idAlianca = idA; }));
        toast('🤝 Alvo enviado para a aliança', 'ok');
      } catch (err) { toast(cloud.traduzir(err), 'erro'); }
    }
  });
}
