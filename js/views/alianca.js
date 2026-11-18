// ALIANÇA — operações sincronizadas, alvos compartilhados, mural e membros
import * as store from '../store.js';
import * as T from '../timers.js';
import { PAPEIS_USUARIO } from '../config.js';
import { distancia, tempoViagem, horaPartida } from '../calc.js';
import { esc, fmt, fmtK, fmtDur, fmtQuando, folha, toast, confirmar, campoCoords, paraDatetimeLocal } from '../ui.js';

const ABAS = [['ops', '⚔️ Operações'], ['alvos', '🗺️ Alvos'], ['mural', '📣 Mural'], ['membros', '👥 Membros']];
const VELS = [[60, '🚢 60 · mercante/hoplita'], [40, '⛵ 40 · trirreme/LC/AV/gigante'], [30, '💥 30 · BM/LF/reparador'], [20, '🎈 20 · balão/porta-balões']];
const ms = t => (t?.toMillis ? t.toMillis() : +t || 0);
const escolhas = {}; // opId → { cidade, vel }

export function render(raiz, ctx) {
  const { cloud } = ctx;
  const papel = cloud.papel();
  const nivel = PAPEIS_USUARIO[papel]?.nivel ?? -1;
  const abas = ABAS.filter(([id]) => id !== 'membros' || papel === 'admin');
  const sub = abas.some(a => a[0] === ctx.sub) ? ctx.sub : 'ops';
  if (!cloud.estado.usuario) {
    raiz.innerHTML = `<div class="tela-titulo"><div><h2>Aliança</h2><p>Jogue junto, no mesmo relógio</p></div></div>
      <div class="card destaque"><div class="vazio"><span class="grande">🤝</span>Entre com o Google para ver as operações, os alvos e o mural da aliança.</div><button class="btn ouro bloco" data-entrar>Entrar com Google</button></div>`;
    raiz.querySelector('[data-entrar]').onclick = () => ctx.ir('sistema', 'conta');
    return;
  }
  if (nivel < 1) {
    raiz.innerHTML = `<div class="tela-titulo"><div><h2>Aliança</h2></div></div><div class="card"><div class="vazio"><span class="grande">⏳</span>Seu acesso está aguardando o líder aprovar.<br><span class="pequeno">Mande uma mensagem para ele com o e-mail <b>${esc(cloud.estado.usuario.email)}</b>.</span></div></div>`;
    return;
  }
  raiz.innerHTML = `<div class="tela-titulo"><div><h2>Aliança</h2><p>${esc(PAPEIS_USUARIO[papel].icone)} você é ${esc(PAPEIS_USUARIO[papel].nome.toLowerCase())}</p></div></div>
    <div class="seg">${abas.map(([id, n]) => `<button class="${id === sub ? 'ativo' : ''}" data-aba="${id}">${n}${id === 'membros' && cloud.estado.pendentes ? ` · ${cloud.estado.pendentes}` : ''}</button>`).join('')}</div><div data-c></div>`;
  raiz.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b) ctx.ir('alianca', b.dataset.aba); });
  ({ ops, alvos, mural, membros })[sub](raiz.querySelector('[data-c]'), ctx, nivel);
}

const carregando = info => (!info.carregado ? '<div class="vazio">Carregando da nuvem…</div>' : info.erro ? `<div class="alerta erro">${esc(info.erro)}</div>` : '');

// ---------------- OPERAÇÕES ----------------
function formOp(ctx, op = null) {
  const f = folha({
    titulo: op ? 'Editar operação' : 'Nova operação', sub: 'Todos recebem a hora de partida certa',
    html: `<form>
      <label class="campo"><span>Nome</span><input name="nome" value="${esc(op?.nome || '')}" required maxlength="50" placeholder="Ex.: Limpeza em 93:24"></label>
      <div class="grade2"><label class="campo"><span>Alvo</span>${campoCoords('alvo', op?.alvo || '')}</label>
      <label class="campo"><span>Tipo</span><select name="tipo">${['Naval', 'Terrestre', 'Misto'].map(t => `<option ${op?.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <label class="campo"><span>Hora do impacto</span><input type="datetime-local" name="impacto" required value="${op ? paraDatetimeLocal(op.impacto) : ''}"></label>
      <label class="campo"><span>Instruções</span><textarea name="notas" rows="3" placeholder="Ex.: 1ª onda LC 43, depois AV. Cozinheiros obrigatórios.">${esc(op?.notas || '')}</textarea></label>
      <div class="fl-botoes"><button type="button" class="btn" data-fechar>Cancelar</button><button class="btn ouro" type="submit">Publicar</button></div></form>`,
  });
  f.corpo.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const impacto = new Date(d.impacto).getTime();
    if (!impacto) return;
    try { await ctx.cloud.salvar('ops', op?.id || null, { nome: d.nome, alvo: d.alvo, tipo: d.tipo, impacto, notas: d.notas }); toast('⚔️ Operação publicada', 'ok'); f.fechar(); }
    catch (er) { toast(ctx.cloud.traduzir(er), 'erro'); }
  });
}

function ops(raiz, ctx, nivel) {
  const { cloud, s } = ctx;
  const lista = cloud.lista('ops');
  const info = cloud.info('ops');
  const agora = Date.now();
  const visiveis = lista.filter(o => o.impacto > agora - 6 * 3600e3).sort((a, b) => a.impacto - b.impacto);
  raiz.innerHTML = `
  ${nivel >= 2 ? '<button class="btn ouro bloco" style="margin-bottom:12px" data-nova>＋ Nova operação</button>' : ''}
  ${carregando(info)}
  ${visiveis.map(op => {
    const esc_ = escolhas[op.id] ||= { cidade: (s.cidades.find(c => c.capital) || s.cidades[0])?.id || '', vel: op.tipo === 'Terrestre' ? 60 : 40 };
    const cidade = store.cidade(esc_.cidade);
    const dist = cidade ? distancia(cidade.coords, op.alvo) : null;
    const r = dist != null ? tempoViagem({ dist, vel: +esc_.vel, oligarquia: s.config.oligarquia }) : null;
    const partida = r ? horaPartida(op.impacto, r.seg) : null;
    const parts = cloud.lista(`ops/${op.id}/participantes`);
    const eu = parts.find(p => p.id === cloud.estado.usuario.uid);
    const passou = op.impacto < agora;
    return `<div class="card ${passou ? '' : 'destaque'}" data-op="${op.id}">
      <div class="card-topo"><span class="ic-q">${op.tipo === 'Naval' ? '⚓' : op.tipo === 'Terrestre' ? '🗡️' : '⚔️'}</span>
        <div class="cresce" style="min-width:0"><h3>${esc(op.nome)}</h3><div class="mut pequeno">[${esc(op.alvo || '?')}] · por ${esc(op.autorNome || '?')}</div></div>
        ${nivel >= 2 ? '<button class="icone-btn" data-editar>✏️</button>' : ''}</div>
      <div class="resultado" style="margin-top:0">
        <div class="mut pequeno">Impacto ${esc(fmtQuando(op.impacto))}</div>
        <div class="grande">${passou ? 'já aconteceu' : `<span data-fim="${op.impacto}">…</span>`}</div>
      </div>
      ${op.notas ? `<p class="pequeno" style="color:var(--txt2);white-space:pre-wrap">${esc(op.notas)}</p>` : ''}
      ${!passou ? `<div class="sec-t">🧭 Minha partida</div>
      <div class="grade2"><label class="campo"><span>Saindo de</span><select data-cidade>${s.cidades.map(c => `<option value="${c.id}" ${c.id === esc_.cidade ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select></label>
      <label class="campo"><span>Mais lento do grupo</span><select data-vel>${VELS.map(([v, n]) => `<option value="${v}" ${+esc_.vel === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
      ${partida ? `<div class="flex entre" style="margin-top:10px"><div><div class="mut pequeno">Parta ${esc(fmtQuando(partida))} · viagem ${fmtDur(r.seg, true)}</div><b class="contagem" style="font-size:1.3rem;color:${partida < agora ? 'var(--vermelho)' : 'var(--ouro-cl)'}">${partida < agora ? 'atrasado!' : `<span data-fim="${partida}">…</span>`}</b></div>
        ${partida > agora ? '<button class="btn mini" data-alarme>⏱️ Alarme</button>' : ''}</div>` : '<p class="pequeno mut">Cadastre a coordenada da cidade no Império.</p>'}
      <button class="btn ${eu ? '' : 'ouro'} bloco" style="margin-top:10px" data-vou>${eu ? '✅ Confirmado · atualizar' : '🙋 Eu vou'}</button>` : ''}
      ${parts.length ? `<div class="sec-t">👥 Confirmados (${parts.length})</div>${parts.sort((a, b) => (a.partida || 0) - (b.partida || 0)).map(p => `<div class="item"><span class="ic">🛡️</span><span class="meio"><b>${esc(p.nome)}</b><small>${esc(p.cidade || '')} · vel ${esc(p.vel || '?')}</small></span><span class="fim"><b class="pequeno">${p.partida ? esc(fmtQuando(p.partida)) : '—'}</b></span></div>`).join('')}` : ''}
    </div>`;
  }).join('') || (info.carregado ? '<div class="card"><div class="vazio"><span class="grande">🕊️</span>Nenhuma operação marcada.</div></div>' : '')}`;

  raiz.addEventListener('change', e => {
    const card = e.target.closest('[data-op]'); if (!card) return;
    const es = escolhas[card.dataset.op];
    if (e.target.matches('[data-cidade]')) es.cidade = e.target.value;
    if (e.target.matches('[data-vel]')) es.vel = +e.target.value;
    ctx.atualizar();
  });
  raiz.addEventListener('click', async e => {
    if (e.target.closest('[data-nova]')) return formOp(ctx);
    const card = e.target.closest('[data-op]'); if (!card) return;
    const op = lista.find(o => o.id === card.dataset.op);
    if (e.target.closest('[data-editar]')) {
      const f = folha({ titulo: op.nome, html: '<div class="fl-botoes"><button class="btn" data-ed>✏️ Editar</button><button class="btn perigo" data-del>🗑️ Apagar</button></div>' });
      f.corpo.querySelector('[data-ed]').onclick = async () => { await f.fechar(); formOp(ctx, op); };
      f.corpo.querySelector('[data-del]').onclick = async () => { await f.fechar(); if (await confirmar('Apagar operação?', op.nome, 'Apagar', true)) cloud.apagar('ops', op.id).catch(er => toast(cloud.traduzir(er), 'erro')); };
      return;
    }
    const es = escolhas[op.id];
    const cidade = store.cidade(es.cidade);
    const dist = cidade ? distancia(cidade.coords, op.alvo) : null;
    const r = dist != null ? tempoViagem({ dist, vel: es.vel, oligarquia: s.config.oligarquia }) : null;
    const partida = r ? horaPartida(op.impacto, r.seg) : null;
    if (e.target.closest('[data-alarme]') && partida) return T.novoTimer({ nome: `PARTIR: ${op.nome}`, icone: '🚀', fim: Math.max(Date.now() + 5000, partida - 120000), tipo: 'op', ref: op.id });
    if (e.target.closest('[data-vou]')) {
      try { await cloud.salvar(`ops/${op.id}/participantes`, cloud.estado.usuario.uid, { nome: s.config.nomeJogador || cloud.estado.usuario.nome, cidade: cidade ? `${cidade.nome} [${cidade.coords}]` : '', partida, vel: es.vel, status: 'vou' }); toast('🙋 Presença confirmada', 'ok'); }
      catch (er) { toast(cloud.traduzir(er), 'erro'); }
    }
  });
}

// ---------------- ALVOS DA ALIANÇA ----------------
function alvos(raiz, ctx, nivel) {
  const { cloud } = ctx;
  const lista = cloud.lista('alvosAlianca');
  const info = cloud.info('alvosAlianca');
  raiz.innerHTML = `<p class="pequeno mut" style="margin:0 4px 10px">Para compartilhar, abra um alvo seu em <b>Alvos</b> e toque em 🤝 Aliança.</p>
  ${carregando(info)}
  ${[...lista].sort((a, b) => ms(b.atualizadoEm) - ms(a.atualizadoEm)).map(a => {
    const total = ['madeira', 'vinho', 'marmore', 'cristal', 'enxofre'].reduce((x, k) => x + (+a.recursos?.[k] || 0), 0);
    const meu = a.autorUid === cloud.estado.usuario.uid;
    return `<div class="card" data-a="${a.id}"><div class="card-topo"><span class="ic-q">${a.cozinheiros === false ? '🍽️' : '🎯'}</span>
      <div class="cresce" style="min-width:0"><h3>${esc(a.nome || '?')}</h3><div class="mut pequeno">${a.alianca ? `[${esc(a.alianca)}] · ` : ''}[${esc(a.coords || '?')}] · por ${esc(a.autorNome || '?')}</div></div></div>
      <div class="linha-chips">${a.muralha != null ? `<span class="chip">🧱 ${a.muralha}</span>` : ''}${a.cozinheiros === false ? '<span class="chip vermelho">sem cozinheiros</span>' : ''}${total ? `<span class="chip ouro">💰 ${fmtK(total)}</span>` : ''}</div>
      ${a.notas ? `<p class="pequeno" style="color:var(--txt2)">${esc(a.notas)}</p>` : ''}
      <div class="grade2" style="margin-top:10px"><button class="btn mini" data-copiar>📥 Para meus alvos</button>${meu || nivel >= 2 ? '<button class="btn mini" data-apagar>🗑️ Tirar</button>' : '<span></span>'}</div></div>`;
  }).join('') || (info.carregado ? '<div class="card"><div class="vazio"><span class="grande">🗺️</span>Ninguém compartilhou alvos ainda.</div></div>' : '')}`;
  raiz.addEventListener('click', async e => {
    const card = e.target.closest('[data-a]'); if (!card) return;
    const a = lista.find(x => x.id === card.dataset.a);
    if (e.target.closest('[data-copiar]')) {
      store.set(s => { s.alvos.unshift(store.novoAlvo({ nome: a.nome, alianca: a.alianca, coords: a.coords, muralha: a.muralha ?? null, cozinheiros: a.cozinheiros ?? null, recursos: a.recursos || {}, unidades: a.unidades || {}, notas: a.notas || '', relatorioEm: a.relatorioEm || null })); });
      toast('Copiado para seus alvos ✔', 'ok');
    }
    if (e.target.closest('[data-apagar]') && await confirmar('Tirar da aliança?', a.nome, 'Tirar', true)) cloud.apagar('alvosAlianca', a.id).catch(er => toast(cloud.traduzir(er), 'erro'));
  });
}

// ---------------- MURAL ----------------
function mural(raiz, ctx, nivel) {
  const { cloud } = ctx;
  const lista = cloud.lista('mural');
  const info = cloud.info('mural');
  const ord = [...lista].sort((a, b) => (b.fixado ? 1 : 0) - (a.fixado ? 1 : 0) || ms(b.criadoEm) - ms(a.criadoEm));
  raiz.innerHTML = `
  ${nivel >= 2 ? `<div class="card"><h3><span class="ic-q">📣</span>Novo aviso</h3>
    <label class="campo"><span>Título</span><input class="entrada" data-tit maxlength="60"></label>
    <label class="campo" style="margin-top:8px"><span>Mensagem</span><textarea class="entrada" data-txt rows="3"></textarea></label>
    <label class="marcar" style="margin-top:8px"><input type="checkbox" data-fix> 📌 Fixar no topo</label>
    <button class="btn ouro bloco" style="margin-top:10px" data-postar>Publicar</button></div>` : ''}
  ${carregando(info)}
  ${ord.map(m => `<div class="card ${m.fixado ? 'destaque' : ''}" data-m="${m.id}"><div class="card-topo"><span class="ic-q">${m.fixado ? '📌' : '📣'}</span>
    <div class="cresce"><h3>${esc(m.titulo || 'Aviso')}</h3><div class="mut pequeno">${esc(m.autorNome || '')} · ${m.criadoEm ? esc(fmtQuando(ms(m.criadoEm))) : 'agora'}</div></div>
    ${nivel >= 2 ? '<button class="icone-btn" data-apagar>🗑️</button>' : ''}</div>
    <p style="margin:0;white-space:pre-wrap;color:var(--txt2)">${esc(m.texto || '')}</p></div>`).join('') || (info.carregado ? '<div class="card"><div class="vazio">Sem avisos por enquanto.</div></div>' : '')}`;
  raiz.addEventListener('click', async e => {
    if (e.target.closest('[data-postar]')) {
      const titulo = raiz.querySelector('[data-tit]').value.trim(), texto = raiz.querySelector('[data-txt]').value.trim();
      if (!texto) return toast('Escreva a mensagem', 'erro');
      try { await cloud.salvar('mural', null, { titulo, texto, fixado: raiz.querySelector('[data-fix]').checked }); toast('📣 Publicado', 'ok'); }
      catch (er) { toast(cloud.traduzir(er), 'erro'); }
    }
    const card = e.target.closest('[data-m]');
    if (card && e.target.closest('[data-apagar]') && await confirmar('Apagar aviso?', '', 'Apagar', true)) cloud.apagar('mural', card.dataset.m).catch(er => toast(cloud.traduzir(er), 'erro'));
  });
}

// ---------------- MEMBROS (só o líder) ----------------
function membros(raiz, ctx) {
  const { cloud } = ctx;
  const lista = cloud.lista('usuarios');
  const info = cloud.info('usuarios');
  const ordem = { pendente: 0, admin: 1, oficial: 2, membro: 3 };
  const ord = [...lista].sort((a, b) => (ordem[a.papel] ?? 9) - (ordem[b.papel] ?? 9) || String(a.nome).localeCompare(b.nome));
  raiz.innerHTML = `<div class="card"><h3><span class="ic-q">👥</span>Quem pode entrar</h3>
    <p class="dica">Quem entra com Google aparece aqui como "Aguardando". Aprove os membros da aliança; oficiais podem criar operações e avisos.</p>
    ${carregando(info)}
    ${ord.map(u => { const p = PAPEIS_USUARIO[u.papel] || PAPEIS_USUARIO.pendente; const eu = u.id === cloud.estado.usuario.uid; return `<div class="item" data-u="${u.id}">
      <span class="ic">${u.foto ? `<img src="${esc(u.foto)}" alt="" referrerpolicy="no-referrer" style="width:100%;height:100%;border-radius:12px;object-fit:cover">` : p.icone}</span>
      <span class="meio"><b>${esc(u.nome || '?')}${eu ? ' (você)' : ''}</b><small>${esc(u.email || '')} · ${p.icone} ${p.nome}</small></span>
      ${eu || u.papel === 'admin' ? '' : `<select class="entrada" style="width:120px;padding:6px" data-papel>${['pendente', 'membro', 'oficial'].map(k => `<option value="${k}" ${u.papel === k ? 'selected' : ''}>${PAPEIS_USUARIO[k].icone} ${PAPEIS_USUARIO[k].nome}</option>`).join('')}</select>`}
    </div>`; }).join('')}</div>`;
  raiz.addEventListener('change', async e => {
    const li = e.target.closest('[data-u]');
    if (li && e.target.matches('[data-papel]')) {
      try { await cloud.definirPapel(li.dataset.u, e.target.value); toast('Cargo atualizado ✔', 'ok'); }
      catch (er) { toast(cloud.traduzir(er), 'erro'); }
    }
  });
}
