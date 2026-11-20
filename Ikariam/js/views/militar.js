// MILITAR — exército por cidade, simulador de combate, viagem, waving/LC tank e flancos
import * as store from '../store.js';
import * as T from '../timers.js';
import { UNIDADES, LC_PRESETS, POSEIDON_BONUS, VEL_MERCANTE, ORIGENS_ROTA } from '../data.js';
import { resumoExercito, somarExercitos, distancia, tempoViagem, lerCoords, velocidadeGrupo, barcosParaPeso, flancoNaval, horaPartida, unidadePorId, generaisUnidade } from '../calc.js';
import { lerUnidades } from '../parser.js';
import { esc, fmt, fmtDur, fmtHora, fmtQuando, toast, copiar, confirmar, campoNum, campoCoords, paraDatetimeLocal, folha, pedirNumero } from '../ui.js';
import { gradeUnidades, gradeUnidadesInfo, lerGradeUnidades, colarFolha, seletorCidade, opcoesTimer } from './comum.js';
import { render as simulador } from './simulador.js';
import { icone, iconeUnidade, iconeEm } from '../icones.js';

const ABAS = [['exercito', 'elmo', 'Exército'], ['simulador', 'espadas', 'Simulador'], ['viagem', 'rota', 'Viagem'], ['waving', 'ondas', 'Waving'], ['flancos', 'trirreme', 'Flancos']];
let cidadeSel = null;
let visao = 'cidade';
export const focarCidade = id => { cidadeSel = id; visao = 'cidade'; };

export function render(raiz, ctx) {
  const pedido = ctx.sub === 'prebatalha' ? 'simulador' : ctx.sub; // atalho antigo do menu
  const sub = ABAS.some(a => a[0] === pedido) ? pedido : 'exercito';
  raiz.innerHTML = `<div class="tela-titulo"><div><h2>Militar</h2><p>Tropas, viagens e táticas de guerra</p></div></div>
    <div class="seg">${ABAS.map(([id, ic, n]) => `<button class="${id === sub ? 'ativo' : ''}" data-aba="${id}">${icone(ic, { tam: 16 })} ${n}</button>`).join('')}</div>
    <div data-conteudo></div>`;
  raiz.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b) ctx.ir('militar', b.dataset.aba); });
  const alvo = raiz.querySelector('[data-conteudo]');
  ({ exercito, viagem, waving, simulador, flancos })[sub](alvo, ctx);
}

// ---------------- EXÉRCITO ----------------
function exercito(raiz, ctx) {
  const { s } = ctx;
  if (!s.cidades.length) { raiz.innerHTML = `<div class="card"><div class="vazio"><span class="grande">🛡️</span>Cadastre suas cidades no Império primeiro.</div><button class="btn ouro bloco" data-ir-imp>Ir para o Império</button></div>`; raiz.querySelector('[data-ir-imp]').onclick = () => ctx.ir('imperio'); return; }
  if (!cidadeSel || !s.cidades.some(c => c.id === cidadeSel)) cidadeSel = (s.cidades.find(c => c.capital) || s.cidades[0]).id;
  const total = somarExercitos(s.cidades.map(c => c.militar?.unidades));
  let gen = 0, m1 = 0, mReal = 0;
  s.cidades.forEach(c => { const r = resumoExercito(c.militar?.unidades, c.militar?.fora); gen += r.generais; m1 += r.manut1x; mReal += r.manutReal; });
  const c = s.cidades.find(x => x.id === cidadeSel);
  const rc = resumoExercito(c.militar.unidades, c.militar.fora);
  const cap = s.config.capMercante || 500;
  const guerra = !!s.config.modoGuerra;
  const mult = guerra ? 2 : 1;
  const animar = ctx.mem.trocouGuerra; ctx.mem.trocouGuerra = false;

  raiz.innerHTML = `
  <div class="chave-guerra ${guerra ? 'guerra' : 'paz'} ${animar ? 'trocou' : ''}">
    <button type="button" class="chave" data-guerra role="switch" aria-checked="${guerra}" aria-label="Manutenção: ${guerra ? 'Guerra, tropas mobilizadas (2×)' : 'Paz, tropas estacionadas (1×)'}">
      <span class="chave-lado lado-paz">${icone('louros', { tam: 18 })}<b>Paz</b><small>estacionado · 1×</small></span>
      <span class="chave-lado lado-guerra">${icone('espadas', { tam: 18 })}<b>Guerra</b><small>mobilizado · 2×</small></span>
      <i class="chave-bola" aria-hidden="true"></i>
    </button>
  </div>
  <div class="grade2" style="margin-bottom:10px">
    <div class="kpi ouro"><span>Generais do império</span><b>${fmt(gen, 1)}</b><span>recursos ÷ 50</span></div>
    <div class="kpi kpi-manut ${guerra ? 'vermelho' : 'verde'}"><span>${icone('ouro', { tam: 13 })} Ouro / hora · ${mult}×</span><b class="valor-troca">${fmt(m1 * mult)}</b><span>${guerra ? `+${fmt(m1)} na guerra` : 'tudo estacionado'} · real ${fmt(mReal)}</span></div>
  </div>
  <div class="seg"><button class="${visao === 'cidade' ? 'ativo' : ''}" data-visao="cidade">Por cidade</button><button class="${visao === 'geral' ? 'ativo' : ''}" data-visao="geral">Visão geral (soma)</button></div>
  ${visao === 'geral' ? visaoGeral(total, mult) : `
  <div class="linha-chips" style="margin-bottom:10px;flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px">${s.cidades.map(x => { const n = Object.values(x.militar?.unidades || {}).reduce((a, b) => a + b, 0); return `<button class="chip ${x.id === cidadeSel ? 'ativo' : ''}" data-cid="${x.id}">${x.capital ? '👑 ' : ''}${esc(x.nome)}${n ? ` · ${fmt(n)}` : ''}${x.militar?.fora ? ' ✈️' : ''}</button>`; }).join('')}</div>
  <div class="card">
    <div class="card-topo"><span class="ic-q">🏛️</span><h3>${esc(c.nome)}</h3><div class="dir"><button class="btn mini" data-colar>📋 Colar do jogo</button></div></div>
    <button class="dado ${c.militar.fora ? 'desliga' : 'liga'}" data-fora style="margin-bottom:10px"><span>Onde estão as tropas <i class="info-i" data-balao="Atacando, ocupando ou estacionadas longe de casa, a manutenção dobra (2×).">i</i></span><b>${c.militar.fora ? '✈️ Fora de casa · 2×' : '🏠 Em casa · 1×'}</b><small>toque para trocar</small></button>
    <div class="grade3" style="margin-bottom:10px">
      <div class="kpi"><span>Generais</span><b>${fmt(rc.generais, 1)}</b></div>
      <div class="kpi ${guerra ? 'vermelho' : ''}"><span>Ouro / h · ${mult}×</span><b class="valor-troca">${fmt(rc.manut1x * mult)}</b></div>
      <div class="kpi"><span>Barcos p/ levar</span><b>${fmt(barcosParaPeso(rc.peso, cap))}</b></div>
    </div>
    <div class="sec-t">🗡️ Terra</div>${gradeUnidadesInfo(c.militar.unidades, 'terra')}
    <div class="sec-t">⚓ Mar</div>${gradeUnidadesInfo(c.militar.unidades, 'mar')}
    <div class="grade3" style="margin-top:12px"><button class="btn mini" data-tudo>✏️ Editar tudo</button><button class="btn mini" data-copiar>📤 Copiar</button><button class="btn mini" data-zerar>🧹 Zerar</button></div>
    <p class="pequeno mut" style="margin:8px 2px 0">Toque numa unidade para mudar a quantidade. Peso de transporte: Wiki (navio = ${fmt(cap)}).</p>
  </div>`}`;

  raiz.addEventListener('click', async e => {
    const t = e.target;
    const v = t.closest('[data-visao]'); if (v) { visao = v.dataset.visao; return ctx.atualizar(); }
    if (t.closest('[data-guerra]')) {
      const novo = !store.get().config.modoGuerra;
      ctx.mem.trocouGuerra = true;
      store.set(st => { st.config.modoGuerra = novo; });
      return toast(novo ? '⚔️ Guerra: manutenção mobilizada (2×)' : '🕊️ Paz: manutenção estacionada (1×)', 'ok');
    }
    const ch = t.closest('[data-cid]'); if (ch) { cidadeSel = ch.dataset.cid; return ctx.atualizar(); }
    if (t.closest('[data-colar]')) {
      colarFolha({ titulo: `Tropas de ${c.nome}`, dica: 'No jogo, abra Quartel/Estaleiro ou a Visão Militar, selecione a tabela, copie e cole. O app acha os nomes e números.', aoLer: (txt, f) => {
        const u = lerUnidades(txt);
        const n = Object.keys(u).length;
        if (!n) return toast('Não achei unidades nesse texto', 'erro');
        f.corpo.querySelector('[data-prev]').innerHTML = `<div class="resultado"><b>${n} tipo(s) encontrados</b>${Object.entries(u).map(([id, q]) => `<div class="linha"><span>${unidadePorId(id).icone} ${esc(unidadePorId(id).nome)}</span><b>${fmt(q)}</b></div>`).join('')}</div>
          <div class="fl-botoes"><button class="btn" data-somar>＋ Somar</button><button class="btn ouro" data-trocar>Substituir</button></div>`;
        f.corpo.querySelector('[data-trocar]').onclick = () => { store.set(st => { st.cidades.find(x => x.id === c.id).militar.unidades = u; }); f.fechar(); toast('Exército atualizado ✔', 'ok'); };
        f.corpo.querySelector('[data-somar]').onclick = () => { store.set(st => { const m = st.cidades.find(x => x.id === c.id).militar; m.unidades = somarExercitos([m.unidades, u]); }); f.fechar(); toast('Somado ✔', 'ok'); };
      } });
      return;
    }
    if (t.closest('[data-copiar]')) {
      const linhas = Object.entries(c.militar.unidades).filter(([, q]) => q > 0).map(([id, q]) => `${unidadePorId(id)?.nome}: ${fmt(q)}`);
      return copiar(`🏛️ ${c.nome} [${c.coords}]\n${linhas.join('\n')}\nGenerais: ${fmt(rc.generais, 1)} · Ouro/h: ${fmt(rc.manutReal)}`);
    }
    if (t.closest('[data-fora]')) { const fora = !c.militar.fora; store.set(st => { st.cidades.find(x => x.id === c.id).militar.fora = fora; }); return toast(fora ? '✈️ Tropas fora: manutenção 2×' : '🏠 Tropas em casa', 'ok'); }
    const ue = t.closest('[data-uni-ed]');
    if (ue) {
      const u = unidadePorId(ue.dataset.uniEd);
      const atual = c.militar.unidades[u.id] || 0;
      const n = await pedirNumero({ titulo: `${u.icone} ${u.nome}`, sub: `${c.nome} · ${u.manut} ouro/h cada`, rotulo: 'Quantidade', valor: atual || '', min: 0, passos: [-100, -10, 10, 100], limpar: true });
      if (n === undefined) return;
      store.set(st => { const m = st.cidades.find(x => x.id === c.id).militar; if (n > 0) m.unidades[u.id] = n; else delete m.unidades[u.id]; });
      return toast(`${u.icone} ${u.nome}: ${fmt(n || 0)}`, 'ok');
    }
    if (t.closest('[data-tudo]')) {
      const f = folha({ classe: 'mn-alta', titulo: `Tropas de ${c.nome}`, sub: 'Preencha várias de uma vez',
        html: `<div class="sec-t">🗡️ Terra</div>${gradeUnidades(c.militar.unidades, 'terra')}<div class="sec-t">⚓ Mar</div>${gradeUnidades(c.militar.unidades, 'mar')}
        <div class="fl-botoes"><button class="btn" data-fechar>Cancelar</button><button class="btn ouro" data-ok>Salvar</button></div>` });
      f.corpo.querySelector('[data-ok]').onclick = () => { const u = lerGradeUnidades(f.corpo); store.set(st => { st.cidades.find(x => x.id === c.id).militar.unidades = u; }); f.fechar(); toast('🛡️ Exército salvo', 'ok'); };
      return;
    }
    if (t.closest('[data-zerar]') && await confirmar('Zerar exército?', `Apaga as tropas cadastradas em ${c.nome} (só no app).`, 'Zerar', true))
      store.set(st => { st.cidades.find(x => x.id === c.id).militar.unidades = {}; });
  });
}

function visaoGeral(total, mult = 1) {
  const grupo = tipo => UNIDADES.filter(u => u.tipo === tipo && total[u.id] > 0);
  const linha = u => `<tr><td><span class="ic-tab">${iconeUnidade(u.id, { tam: 18 })}</span>${esc(u.nome)}</td><td class="n">${fmt(total[u.id])}</td><td class="n">${fmt(total[u.id] * generaisUnidade(u), 1)}</td><td class="n valor-troca">${fmt(total[u.id] * u.manut * mult)}</td></tr>`;
  const tab = (titulo, lista) => lista.length ? `<div class="sec-t">${titulo}</div><table class="tabela"><tr><th>Unidade</th><th class="n">Qtd</th><th class="n">Gen.</th><th class="n">Ouro/h ${mult}×</th></tr>${lista.map(linha).join('')}</table>` : '';
  const conteudo = tab('🗡️ Terra', grupo('terra')) + tab('⚓ Mar', grupo('mar'));
  return `<div class="card">${conteudo || '<div class="vazio">Nenhuma tropa cadastrada ainda.</div>'}<p class="pequeno mut" style="margin:10px 2px 0">${mult === 2 ? 'Guerra: tropas mobilizadas pagam o dobro (2×).' : 'Paz: custo estacionado (1×). Tropas fora de casa pagam o dobro.'}</p></div>`;
}

// ---------------- ROTA MARÍTIMA VISUAL ----------------
const iconeOrigem = c => (c ? ORIGENS_ROTA[c.capital ? 'capital' : c.papel] || 'templo' : 'templo');
function rotaHtml({ orig, dest, r, r0, poseidon, cidadeOrigem, naval }) {
  const p = lerCoords(orig), q = lerCoords(dest);
  const W = 320, H = 150, pad = 30;
  let a, b;
  if (p.x === q.x && p.y === q.y) { a = { x: W / 2 - 55, y: H / 2 + 12 }; b = { x: W / 2 + 55, y: H / 2 - 12 }; }
  else {
    const dx = q.x - p.x, dy = q.y - p.y;
    const k = Math.min((W - 2 * pad) / Math.max(Math.abs(dx), 1e-9), (H - 2 * pad) / Math.max(Math.abs(dy), 1e-9), 46);
    a = { x: W / 2 - (dx * k) / 2, y: H / 2 - (dy * k) / 2 };
    b = { x: W / 2 + (dx * k) / 2, y: H / 2 + (dy * k) / 2 };
  }
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, len = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
  const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len, curva = Math.min(28, len * 0.22);
  let c = { x: mx + nx * curva, y: my + ny * curva };
  if (c.y < 10 || c.y > H - 10) c = { x: mx - nx * curva, y: my - ny * curva };
  const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)} Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
  const dur = Math.min(12, Math.max(3, r.seg / 900)).toFixed(1);
  const corte = r0 && poseidon ? Math.round((1 - r.seg / r0.seg) * 100) : 0;
  return `<div class="rota-mapa">
    <svg class="rota-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Rota de ${esc(orig)} até ${esc(dest)}">
      <path class="rota-sombra" d="${d}"/><path class="rota-linha" d="${d}"/>
      <g class="rota-ponto origem" transform="translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})"><circle r="13"/>${iconeEm(iconeOrigem(cidadeOrigem), -9, -9, 18)}</g>
      <g class="rota-ponto destino" transform="translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})"><circle r="13"/>${iconeEm('alvo', -9, -9, 18)}</g>
      <g class="rota-barco"><g transform="${b.x < a.x ? 'scale(-1 1)' : ''}">${iconeEm(naval ? 'trirreme' : 'mercante', -16, -26, 32)}</g>
        <animateMotion dur="${dur}s" repeatCount="indefinite" path="${d}" calcMode="spline" keyTimes="0;1" keySplines=".45 0 .55 1"/></g>
    </svg>
    <div class="rota-rotulos"><span>${icone(iconeOrigem(cidadeOrigem), { tam: 14 })} ${esc(cidadeOrigem ? cidadeOrigem.nome : 'Origem')} <small>[${esc(orig)}]</small></span><span>${icone('alvo', { tam: 14 })} <small>[${esc(dest)}]</small></span></div>
    <div class="rota-rodape">
      <div class="rota-tempo-box"><small>Tempo de viagem</small><b class="rota-tempo" data-tempo-anim>${fmtDur(r.seg)}</b>
        ${corte ? `<span class="rota-corte">−${corte}% com Poseidon</span>` : '<span class="rota-corte off">toque no tridente para acelerar</span>'}</div>
      <button type="button" class="tridente-btn ${poseidon ? 'ligado' : ''}" data-tridente aria-label="Milagre de Poseidon: nível ${poseidon}. Tocar para subir">
        ${icone('tridente', { tam: 28 })}<span>Poseidon<b>${poseidon ? `Nv ${poseidon} · +${Math.round(POSEIDON_BONUS[poseidon] * 100)}%` : 'desligado'}</b></span></button>
    </div>
  </div>`;
}

// ---------------- VIAGEM ----------------
function viagem(raiz, ctx) {
  const { s, mem } = ctx;
  const v = (mem.viagem ||= { origem: '', origemCoords: '', destino: '', unidades: ['mercante'], poseidon: 0, tritao: 0, oligarquia: s.config.oligarquia, evento: 0, reducao: 0, impacto: '', carga: '' });
  const pre = sessionStorage.getItem('ikariam_destino');
  if (pre != null) { v.destino = pre; sessionStorage.removeItem('ikariam_destino'); }
  const tipos = [{ id: 'mercante', nome: 'Navio mercante', icone: '🚢', vel: VEL_MERCANTE }, ...UNIDADES.filter(u => !u.raro || s.config.mostrarRaras)];
  const calcular = () => {
    const orig = v.origem ? store.cidade(v.origem)?.coords : v.origemCoords;
    const dist = distancia(orig, v.destino);
    const ids = v.unidades.filter(id => id !== 'mercante');
    const mesmaIlha = dist === 0.5;
    const vel = ids.length ? velocidadeGrupo(ids, !mesmaIlha) : VEL_MERCANTE;
    const r = dist != null ? tempoViagem({ dist, vel, poseidon: +v.poseidon, tritao: +v.tritao, oligarquia: v.oligarquia, eventoPct: +v.evento, reducaoPct: +v.reducao }) : null;
    return { dist, vel, r, orig };
  };
  const { dist, vel, r, orig } = calcular();
  const agora = Date.now();
  const impactoMs = v.impacto ? new Date(v.impacto).getTime() : null;
  const partida = impactoMs && r ? horaPartida(impactoMs, r.seg) : null;
  const cap = s.config.capMercante || 500, capC = s.config.capCargueiro || 50000;
  const carga = +v.carga || 0;
  const cidadeOrigem = v.origem ? store.cidade(v.origem) : null;
  const naval = v.unidades.some(id => UNIDADES.find(u => u.id === id)?.tipo === 'mar');
  const r0 = r && +v.poseidon ? tempoViagem({ dist, vel, poseidon: 0, tritao: +v.tritao, oligarquia: v.oligarquia, eventoPct: +v.evento, reducaoPct: +v.reducao }) : null;
  // Atalhos de origem: Capital, Âncoras e Móvel
  const origensRapidas = s.cidades.filter(c => c.coords && (c.capital || c.papel === 'ancora' || c.papel === 'movel'));

  raiz.innerHTML = `
  <div class="card">
    <h3><span class="ic-q">${icone('rota', { tam: 18 })}</span>Rota</h3>
    ${origensRapidas.length ? `<div class="linha-chips" style="margin-bottom:10px">${origensRapidas.map(c => `<button class="chip ${v.origem === c.id ? 'ativo' : ''}" data-origem-rapida="${c.id}">${icone(iconeOrigem(c), { tam: 14 })} ${esc(c.nome)}</button>`).join('')}</div>` : ''}
    <div class="grade2">
      <label class="campo"><span>Saindo de</span>${seletorCidade('origem', v.origem, '', 'Digitar coordenada')}</label>
      <label class="campo ${v.origem ? 'oculto' : ''}"><span>Coordenada de origem</span>${campoCoords('origemCoords', v.origemCoords)}</label>
      <label class="campo"><span>Destino</span>${campoCoords('destino', v.destino)}</label>
      <label class="campo"><span>Alvo salvo</span><select name="alvo"><option value="">—</option>${s.alvos.filter(a => a.coords).map(a => `<option value="${esc(a.coords)}">${esc(a.nome)} [${esc(a.coords)}]</option>`).join('')}</select></label>
    </div>
    <div class="sec-t">Quem vai (o mais lento define a velocidade)</div>
    <div class="linha-chips">${tipos.map(u => `<button class="chip ${v.unidades.includes(u.id) ? 'ativo' : ''}" data-u="${u.id}">${u.icone} ${esc(u.abrev || u.nome)} · ${u.vel}</button>`).join('')}</div>
    <div class="sec-t">Bônus de velocidade</div>
    <div class="grade2">
      <label class="campo"><span>Milagre de Poseidon</span><select name="poseidon">${POSEIDON_BONUS.map((b, i) => `<option value="${i}" ${+v.poseidon === i ? 'selected' : ''}>${i ? `Nível ${i} (+${Math.round(b * 100)}%)` : 'Desligado'}</option>`).join('')}</select></label>
      <label class="campo"><span>Tritão</span><select name="tritao">${[0, 1, 2, 3].map(i => `<option value="${i}" ${+v.tritao === i ? 'selected' : ''}>${i ? `+${i * 100}%` : 'Não'}</option>`).join('')}</select></label>
      <label class="campo"><span>Evento (+%)</span>${campoNum('evento', v.evento || '', 'min="0" max="500" placeholder="0"')}</label>
      <label class="campo"><span>Redução extra (%)</span>${campoNum('reducao', v.reducao || '', 'min="0" max="90" placeholder="0"')}</label>
    </div>
    <label class="marcar" style="margin-top:8px"><input type="checkbox" name="oligarquia" ${v.oligarquia ? 'checked' : ''}> Governo Oligarquia (+10% de velocidade)</label>
    <details class="ajuda"><summary>Como o app calcula</summary>Tempo = distância × 1200 ÷ velocidade (minutos). Mesma ilha conta 0,5. Tropas de terra cruzando o mar vão no navio mercante (máx. 60). O Arquivo de Cartas Náuticas corta mais em viagens longas: compare com o tempo do jogo e ponha a diferença em "Redução extra".</details>
  </div>

  <div class="card destaque">
    <h3><span class="ic-q">${icone('mercante', { tam: 18 })}</span>Rota marítima</h3>
    ${r ? `${rotaHtml({ orig, dest: v.destino, r, r0, poseidon: +v.poseidon, cidadeOrigem, naval })}
    <div class="resultado">
      <div class="linha"><span>Distância</span><b>${dist === 0.5 ? 'mesma ilha (0,5)' : fmt(dist, 2) + ' ilhas'}</b></div>
      <div class="linha"><span>Velocidade</span><b>${fmt(vel)} → ${fmt(r.velEf, 1)}</b></div>
      <div class="linha"><span>Saindo agora, chega</span><b>${fmtHora(agora + r.seg * 1000)}</b></div>
      <div class="linha"><span>Ida e volta, retorna</span><b>${esc(fmtQuando(agora + r.seg * 2000))}</b></div>
    </div>
    <div class="grade2" style="margin-top:10px"><button class="btn ouro" data-timer-chegada>⏱️ Alarme da chegada</button><button class="btn" data-timer-volta>🔁 Alarme da volta</button></div>` : `<div class="vazio">${orig ? 'Informe o destino' : 'Escolha a origem e o destino'} (formato 00:00).</div>`}
  </div>

  <div class="card">
    <h3><span class="ic-q">🎯</span>Quero chegar às…</h3>
    <label class="campo"><span>Hora do impacto</span><input type="datetime-local" name="impacto" value="${esc(v.impacto || '')}"></label>
    ${partida ? `<div class="resultado">
      <div class="mut pequeno">Parta ${esc(fmtQuando(partida))}</div>
      <div class="grande">${partida > agora ? `<span data-fim="${partida}">…</span>` : 'já passou!'}</div>
      <div class="linha"><span>Chega</span><b>${esc(fmtQuando(impactoMs))}</b></div></div>
      ${partida > agora ? '<button class="btn ouro bloco" style="margin-top:10px" data-timer-partida>⏱️ Alarme 2 min antes de partir</button>' : ''}` : '<p class="pequeno mut" style="margin:8px 2px 0">Preencha a rota e a hora: o app diz quando mandar a frota.</p>'}
  </div>

  <div class="card">
    <h3><span class="ic-q">📦</span>Carga</h3>
    <label class="campo"><span>Quantidade de recursos</span>${campoNum('carga', v.carga || '', 'min="0" placeholder="ex.: 120000"')}</label>
    ${carga ? `<div class="resultado"><div class="linha"><span>Navios mercantes (${fmt(cap)})</span><b>${fmt(Math.ceil(carga / cap))}${s.config.mercantes ? ` de ${fmt(s.config.mercantes)}` : ''}</b></div>
      <div class="linha"><span>ou Cargueiros (${fmt(capC)})</span><b>${fmt(Math.ceil(carga / capC))}${s.config.cargueiros ? ` de ${fmt(s.config.cargueiros)}` : ''}</b></div></div>` : ''}
  </div>`;

  const atualiza = () => ctx.atualizar();
  // Tridente: o tempo "desce" até o novo valor e o barco acelera
  if (v.animDe != null && r) {
    const el = raiz.querySelector('[data-tempo-anim]');
    const de = v.animDe, para = r.seg;
    v.animDe = null;
    if (el && de !== para) {
      el.classList.add(para < de ? 'caindo' : 'subindo');
      raiz.querySelector('[data-tridente]')?.classList.add('onda');
      const t0 = performance.now();
      const passo = agoraMs => {
        const k = Math.min(1, (agoraMs - t0) / 900), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmtDur(Math.round(de + (para - de) * e));
        if (k < 1) requestAnimationFrame(passo);
      };
      el.textContent = fmtDur(de);
      requestAnimationFrame(passo);
    }
  }
  raiz.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'alvo') { v.destino = t.value; return atualiza(); }
    if (t.name === 'oligarquia') v.oligarquia = t.checked;
    else if (t.name && t.name in v) v[t.name] = t.value;
    atualiza();
  });
  raiz.addEventListener('click', e => {
    const or = e.target.closest('[data-origem-rapida]');
    if (or) { v.origem = or.dataset.origemRapida; return atualiza(); }
    if (e.target.closest('[data-tridente]')) {
      v.animDe = r ? r.seg : null;
      v.poseidon = (+v.poseidon + 1) % POSEIDON_BONUS.length;
      return atualiza();
    }
    const u = e.target.closest('[data-u]');
    if (u) {
      const id = u.dataset.u;
      if (id === 'mercante') v.unidades = ['mercante'];
      else { v.unidades = v.unidades.filter(x => x !== 'mercante'); v.unidades.includes(id) ? (v.unidades = v.unidades.filter(x => x !== id)) : v.unidades.push(id); if (!v.unidades.length) v.unidades = ['mercante']; }
      return atualiza();
    }
    if (!r) return;
    const nomeDest = `[${v.destino}]`;
    if (e.target.closest('[data-timer-chegada]')) T.novoTimer({ nome: `Chegada em ${nomeDest}`, icone: '⛵', seg: r.seg, tipo: 'viagem' });
    if (e.target.closest('[data-timer-volta]')) T.novoTimer({ nome: `Frota volta de ${nomeDest}`, icone: '🔁', seg: r.seg * 2, tipo: 'viagem' });
    if (e.target.closest('[data-timer-partida]')) T.novoTimer({ nome: `PARTIR para ${nomeDest}`, icone: '🚀', fim: partida - 120000, tipo: 'partida' });
  });
}

// ---------------- WAVING ----------------
// Anéis de cronômetro: o arco esvazia a cada segundo (timers.js) e pulsa nos últimos 5 min
const ANEIS = [
  { id: 'municao', nome: 'Munição', sub: 'rotação de 45 min', min: 45, svg: 'balas', emoji: '💣', tipo: 'municao', titulo: 'Rotação de munição' },
  { id: 'disperso', nome: 'Reagrupamento', sub: 'volta em 60 min', min: 60, svg: 'reagrupar', emoji: '🔁', tipo: 'disperso', titulo: 'Exército inimigo volta' },
  { id: 'lc15', nome: 'LC Tank', sub: '12 LCs · 1 rodada', min: 15, svg: 'fogo', emoji: '🔥', tipo: 'lc', titulo: 'LC Tank 1 rodada' },
  { id: 'lc30', nome: 'LC Tank', sub: '43 LCs · 2 rodadas', min: 30, svg: 'fogo', emoji: '🔥', tipo: 'lc', titulo: 'LC Tank 2 rodadas' },
];
function timerDoAnel(a, timers, agora) {
  const casa = t => t.ref === 'anel-' + a.id || (t.tipo === a.tipo && Math.round((t.fim - t.inicio) / 60000) === a.min);
  return timers.filter(t => casa(t) && t.fim > agora - 90000).sort((x, y) => x.fim - y.fim)[0] || null;
}
function anelHtml(a, t, agora) {
  const resta = t ? Math.min(1, Math.max(0, (t.fim - agora) / Math.max(1, t.fim - t.inicio))) : 1;
  const viva = t && t.fim > agora;
  return `<button class="anel-card ${t ? 'ativo' : ''}" data-anel="${a.id}" aria-label="${esc(a.nome)} ${a.min} min: ${t ? 'abrir opções' : 'iniciar'}">
    <span class="anel ${t ? '' : 'parado'} ${viva && t.fim - agora <= 300000 ? 'pulsa' : ''} ${t && !viva ? 'zerou' : ''}" ${t ? `data-anel-ini="${t.inicio}" data-anel-fim="${t.fim}"` : ''} style="--resta:${resta.toFixed(4)}">
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle class="anel-fundo" cx="50" cy="50" r="43"/><circle class="anel-marcas" cx="50" cy="50" r="43" pathLength="60"/>
        <circle class="anel-arco" cx="50" cy="50" r="43" pathLength="100"/></svg>
      <span class="anel-meio">${icone(a.svg, { tam: 22 })}<b ${t ? `data-fim="${t.fim}" data-curto data-zero="fim!"` : ''}>${t ? '…' : `${a.min}m`}</b></span>
    </span>
    <b class="anel-nome">${esc(a.nome)}</b><small>${t ? (viva ? `até ${fmtHora(t.fim)}` : 'terminou') : esc(a.sub)}</small></button>`;
}

function waving(raiz, ctx) {
  const mem = (ctx.mem.waving ||= { alvo: '', ondas: 4, intervalo: 15 });
  const agora = Date.now();
  const timers = ctx.s.timers;
  const ativosAneis = ANEIS.map(a => timerDoAnel(a, timers, agora));
  raiz.innerHTML = `
  <div class="card aneis-card">
    <div class="card-topo"><span class="ic-q">${icone('ampulheta', { tam: 18 })}</span><h3>Cronômetros de guerra</h3><div class="dir"><span class="chip ${ativosAneis.some(Boolean) ? 'ouro' : ''}">${ativosAneis.filter(Boolean).length} ativos</span></div></div>
    <div class="aneis">${ANEIS.map((a, i) => anelHtml(a, ativosAneis[i], agora)).join('')}</div>
    <p class="pequeno mut" style="margin:10px 2px 0">Toque num anel parado para começar; num anel correndo para adiar, levar à agenda ou apagar. Nos últimos 5 minutos ele pulsa.</p>
  </div>
  <div class="card">
    <h3><span class="ic-q">🔥</span>Lança-Chamas Tank</h3>
    <p class="dica">O dano do Lança-Foguetes passa muito da vida do LC e o excedente se perde: uma parede barata de LC protege os Aríetes a Vapor.</p>
    ${LC_PRESETS.map(p => `<div class="check aviso" style="align-items:center"><span class="st" style="width:44px;height:44px;font-size:1rem;background:rgba(242,204,96,.14);color:var(--ouro-cl)">${p.qtd}</span>
      <div class="cresce"><b>${esc(p.titulo)}</b><small>${esc(p.texto)}</small></div><button class="btn mini" data-lc="${p.id}">⏱️ ${p.timerMin}m</button></div>`).join('')}
  </div>
  <div class="card">
    <h3><span class="ic-q">💣</span>Rotação de munição · 45 min</h3>
    <p class="dica">Morteiros e Carabineiros têm munição para 3 rodadas. Mande a reposição na 3ª rodada; <b>só depois que ela chegar</b> recue a leva velha (o jogo não troca sozinho).</p>
    <label class="campo"><span>Alvo (opcional)</span><input name="alvo" value="${esc(mem.alvo)}" placeholder="ex.: 93:24 Fulano"></label>
    <div class="grade2" style="margin-top:10px"><button class="btn ouro" data-t="municao">💣 Iniciar 45 min</button><button class="btn" data-t="rodada">⚔️ Rodada 15 min</button></div>
  </div>
  <div class="card">
    <h3><span class="ic-q">${icone('reagrupar', { tam: 18 })}</span>Alvo dispersou agora · reagrupamento</h3>
    <p class="dica">Sem Cozinheiros, o exército que perde a moral dispersa e volta à cidade em exatos 60 min. Ataque com tudo no retorno para zerar de vez.</p>
    <button class="btn perigo bloco" data-t="disperso">🔁 Dispersou agora · 60 min</button>
  </div>
  <div class="card">
    <h3><span class="ic-q">🌊</span>Ondas em sequência</h3>
    <div class="grade2"><label class="campo"><span>Quantas levas</span>${campoNum('ondas', mem.ondas, 'min="1" max="12"')}</label><label class="campo"><span>A cada (min)</span>${campoNum('intervalo', mem.intervalo, 'min="1" max="120"')}</label></div>
    <button class="btn bloco" style="margin-top:10px" data-ondas>🌊 Criar cronômetros das levas</button>
  </div>`;
  const nomeAlvo = () => (mem.alvo ? ` · ${mem.alvo}` : '');
  raiz.addEventListener('input', e => { if (e.target.name in mem) mem[e.target.name] = e.target.value; });
  raiz.addEventListener('click', e => {
    const an = e.target.closest('[data-anel]');
    if (an) {
      const i = ANEIS.findIndex(x => x.id === an.dataset.anel), a = ANEIS[i], t = ativosAneis[i];
      if (t && t.fim > Date.now()) return opcoesTimer(t.id);
      if (t) T.removerTimer(t.id);
      return T.novoTimer({ nome: a.titulo + nomeAlvo(), icone: a.emoji, seg: a.min * 60, tipo: a.tipo, ref: 'anel-' + a.id });
    }
    const lc = e.target.closest('[data-lc]');
    if (lc) { const p = LC_PRESETS.find(x => x.id === lc.dataset.lc); return T.novoTimer({ nome: `LC Tank ${p.qtd}${nomeAlvo()}`, icone: '🔥', seg: p.timerMin * 60, tipo: 'lc' }); }
    const b = e.target.closest('[data-t]');
    if (b) {
      const k = b.dataset.t;
      const d = { municao: ['Rotação de munição', '💣', 45], rodada: ['Rodada de batalha', '⚔️', 15], disperso: ['Exército inimigo volta', '🔁', 60] }[k];
      return T.novoTimer({ nome: d[0] + nomeAlvo(), icone: d[1], seg: d[2] * 60, tipo: k });
    }
    if (e.target.closest('[data-ondas]')) {
      const n = Math.min(12, Math.max(1, +mem.ondas || 1)), iv = Math.max(1, +mem.intervalo || 15);
      for (let i = 1; i <= n; i++) T.novoTimer({ nome: `Leva ${i}/${n}${nomeAlvo()}`, icone: '🌊', seg: (i - 1) * iv * 60 + 5, tipo: 'onda' });
    }
  });
}

// ---------------- FLANCOS NAVAIS ----------------
function flancos(raiz, ctx) {
  const m = (ctx.mem.flanco ||= { vida: 154, upAtk: 0, forja: 1, armForja: 0, upArm: 0 });
  const r = flancoNaval({ vida: +m.vida, upAtk: +m.upAtk, forja: +m.forja, armForja: +m.armForja, upArm: +m.upArm });
  raiz.innerHTML = `
  <div class="card">
    <h3><span class="ic-q">⛵</span>Trirreme × Trirreme</h3>
    <p class="dica">Nos flancos, trirreme só luta contra trirreme. Fórmula do informe do fórum "Perdas navais nos flancos": quantos trirremes seus derrubam 1 inimigo por rodada.</p>
    <div class="grade2">
      <label class="campo"><span>Vida do Trirreme inimigo</span>${campoNum('vida', m.vida, 'min="1"')}</label>
      <label class="campo"><span>Seu upgrade de ataque</span>${campoNum('upAtk', m.upAtk, 'min="0"')}</label>
      <label class="campo"><span>Sua Forja (multiplicador)</span><input type="number" inputmode="decimal" step="0.01" name="forja" value="${m.forja}"></label>
      <label class="campo"><span>Armadura de Forja do inimigo</span>${campoNum('armForja', m.armForja, 'min="0"')}</label>
      <label class="campo"><span>Upgrade de armadura inimigo</span>${campoNum('upArm', m.upArm, 'min="0"')}</label>
    </div>
    <div class="resultado">
      <div class="mut pequeno">N = Vida ÷ [(1500 + UpAtk×10) × Forja − ArmForja − 180 − UpArm×10]</div>
      <div class="grande">${r.n == null ? 'dano não passa a armadura' : fmt(r.n, 3)}</div>
      <div class="linha"><span>Divisor</span><b>${fmt(r.divisor, 1)}</b></div>
    </div>
    <p class="pequeno mut" style="margin:8px 2px 0">A Wiki mostra 154 de vida por trirreme. Se o guia usa a vida do slot inteiro, troque o valor acima.</p>
  </div>`;
  raiz.addEventListener('input', e => { if (e.target.name in m) { m[e.target.name] = e.target.value; } });
  raiz.addEventListener('change', () => ctx.atualizar());
}
