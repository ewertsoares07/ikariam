// IMPÉRIO — as cidades, o vinho de cada taverna e a segurança dos portos
import * as store from '../store.js';
import * as T from '../timers.js';
import { PAPEIS, CHECKLIST_MOVEL } from '../data.js';
import { vinhoAgora, reposicaoVinho, corrupcao, nivelSemCorrupcao, lerCoords, habitantesAgora, humor, resumoExercito } from '../calc.js';
import { esc, fmt, fmtK, fmtPct, fmtQuando, folha, modal, toast, confirmar, campoCoords, pedirNumero, pedirTexto, pedirCampos } from '../ui.js';
import { focarCidade } from './militar.js';
import { icone } from '../icones.js';

let aberta = null;
let filtro = 'todas';
let ordem = 'minha';

const papel = id => PAPEIS.find(p => p.id === id);
const corNivel = { verde: 'verde', ok: 'ok', amarelo: 'amarelo', vermelho: 'vermelho' };
const textoCurto = { verde: '+7 dias', ok: '2 a 7 dias', amarelo: '< 48h', vermelho: '⚠️ < 12h' };
const sinal = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n));
const BALAO_HAB = 'Na Prefeitura do jogo: habitantes, limite de moradia e satisfação. O app projeta sozinho: cresce satisfação × 0,02 por hora e cada habitante novo tira 1 de satisfação.';
const BALAO_VINHO = 'Informe o vinho no armazém e quanto a taverna consome por hora. O app desconta sozinho e avisa antes de secar.';
const BALAO_CORR = 'A Residência (ou o Palácio, na capital) precisa ter nível igual ao número de colônias. Abaixo disso, a corrupção tira satisfação e produção.';
const BALAO_ALARME = '1 Lança-Chamas ou 1 Trirreme parado no porto força 1 rodada naval e trava a pilhagem rápida. Não deixe Submergível parado: é caro.';

function estadoHab(h) {
  if (!h || h.sat == null) return null;
  const hm = h.humor;
  const cresce = `${sinal(+h.cresceH.toFixed(2))}/h`;
  switch (h.estado) {
    case 'cheia': return { cor: 'verde', t: 'Prefeitura lotada', d: h.sat > 0 ? `Sobram ${fmt(h.sat)} de satisfação: suba a Prefeitura para crescer mais.` : 'Lotada e sem folga de satisfação.' };
    case 'crescendo': return { cor: hm.cor, t: `Crescendo ${cresce}`, d: h.cheiaEm ? `Lota ${fmtQuando(h.cheiaEm)}` : `Estabiliza perto de ${fmt(h.equilibrio)} habitantes`, fim: h.cheiaEm };
    case 'trava': return { cor: 'amarelo', t: `Crescendo ${cresce}, mas para em ${fmt(h.equilibrio)}`, d: `Faltam ${fmt(h.max - h.equilibrio)} de satisfação para lotar: sirva mais vinho ou amplie o museu.` };
    case 'parada': return { cor: 'ok', t: 'População parada', d: 'Satisfação zerada: sirva mais vinho na taverna ou amplie o museu.' };
    case 'caindo': return { cor: 'vermelho', t: `Perdendo ${fmt(Math.abs(h.cresceH), 1)} por hora`, d: 'Satisfação negativa: aumente o vinho servido já, senão os trabalhadores vão embora.' };
    default: return null;
  }
}

const TACA_REF = 7 * 86400; // taça cheia = 7 dias de vinho
const iconePapel = c => (c.capital ? 'louros' : papel(c.papel)?.svg || 'templo');
const tropasFora = c => c.militar?.fora && Object.values(c.militar.unidades || {}).some(n => n > 0);

// Taça de vinho animada: o timers.js baixa o líquido a cada segundo (data-taca)
export const tacaHtml = (v, cls = '') => {
  const nivel = Math.min(1, v.segRest / TACA_REF);
  return `<span class="taca ${cls} nv-${v.nivel}" data-taca data-zera="${v.zeraEm}" data-ref="${TACA_REF}" data-nv="${v.nivel}" style="--nivel:${nivel.toFixed(4)}" aria-hidden="true">
    <span class="taca-bojo"><i class="liq"></i></span><span class="taca-haste"></span></span>`;
};

function tagsFuncao(c) {
  const tags = [];
  if (c.capital && c.papel !== 'capital') tags.push(PAPEIS[0]);
  const p = papel(c.papel);
  if (p) tags.push(p);
  return tags.map(t => `<span class="tag-funcao tf-${t.id}">${icone(t.svg, { tam: 13 })}${esc(t.nome)}</span>`).join('');
}

function cabecalho(c, v, h) {
  const hm = h?.humor;
  return `<div class="cid-topo">
    <button class="cid-abrir" data-abrir="${c.id}" aria-expanded="${aberta === c.id}">
      <span class="ic">${icone(iconePapel(c), { tam: 24 })}</span>
      <span class="meio"><b>${esc(c.nome || 'Sem nome')}</b><small>${c.coords ? `[${esc(c.coords)}]` : 'sem coordenada'}${c.papel === 'movel' && c.movel?.ativa ? ' · <span class="ouro">no front</span>' : ''}${tropasFora(c) ? ' · tropas fora 2×' : ''}</small>
        <span class="selos">${tagsFuncao(c)}
          ${h ? `<span class="selo ${h.estado === 'cheia' ? 'verde' : ''}">👥 ${fmtK(h.atual)}${h.max ? `/${fmtK(h.max)}` : ''}</span>` : ''}
          ${hm ? `<span class="selo ${hm.cor}">${hm.icone} ${sinal(h.sat)}</span>` : ''}
        </span></span>
      <span class="cid-vinho">${v ? `${tacaHtml(v, 'mini')}<span class="contagem" data-fim="${v.zeraEm}" data-curto data-zero="SECOU">…</span>` : `<span class="taca mini vazia" aria-hidden="true"><span class="taca-bojo"></span><span class="taca-haste"></span></span><span class="mut pequeno">—</span>`}</span>
      <span class="seta">›</span></button>
    <button class="alarme-tg ${c.alarme ? 'on' : 'off'}" data-alarme-tg="${c.id}" aria-pressed="${!!c.alarme}" aria-label="${c.alarme ? 'Barco alarme no porto: tocar para tirar' : 'Sem barco alarme: tocar para marcar'}"
      title="${c.alarme ? 'Barco alarme no porto' : 'Sem barco alarme'}">${icone('escudoAlerta', { tam: 22 })}</button>
  </div>`;
}

const dado = (acao, rotulo, valor, sub = '', cls = '') =>
  `<button class="dado ${valor == null ? 'falta' : ''} ${cls}" data-a="${acao}"><span>${rotulo}</span><b>${valor ?? 'tocar p/ pôr'}</b>${sub ? `<small>${sub}</small>` : ''}</button>`;

function corpo(c, v, h, s) {
  const total = s.cidades.length;
  const cap = s.config.capMercante || 500;
  const corr = c.residencia != null ? corrupcao(c.residencia, total) : null;
  const necessario = nivelSemCorrupcao(total);
  const p = papel(c.papel);
  const eh = estadoHab(h);
  const pct = h?.ocupacao != null ? Math.round(h.ocupacao * 100) : null;
  const estoqueBruto = v ? Math.floor(v.restante) : c.vinho?.estoque;
  const satV = h?.sat ?? c.habitantes?.satisfacao ?? null;
  const hmV = humor(satV);
  const checks = CHECKLIST_MOVEL.filter(it => c.movel?.checklist?.[it.id]).length;

  return `<div class="cid-corpo" data-cidade="${c.id}">
    <div class="painel">
      <div class="painel-t">👥 Habitantes <i class="info-i" data-balao-t="Habitantes e satisfação" data-balao="${esc(BALAO_HAB)}">i</i>
        <span class="dir"><button class="btn mini egeu" data-a="prefeitura">🏛️ Prefeitura</button></span></div>
      ${pct != null ? `<div class="barra-p ${h.estado === 'cheia' ? 'cheia' : h.estado === 'caindo' ? 'caindo' : ''}"><i style="width:${pct}%"></i></div>
      <div class="barra-leg"><span><b>${fmt(h.atual)}</b> de ${fmt(h.max)}</span><span>${pct}% · ${fmt(h.livres)} vaga${h.livres === 1 ? '' : 's'}</span></div>` : ''}
      <div class="dados">
        ${dado('hab-atual', 'Habitantes', h ? fmt(h.atual) : null, h?.em ? 'projetado agora' : '')}
        ${dado('hab-max', 'Limite', c.habitantes?.max ? fmt(c.habitantes.max) : null, 'moradias')}
        ${dado('hab-sat', 'Satisfação', satV != null ? sinal(satV) : null, hmV ? `${hmV.icone} ${hmV.nome}` : '', hmV?.cor || '')}
      </div>
      ${eh ? `<div class="humor ${eh.cor}"><span class="rosto">${h.humor.icone}</span><div class="cresce"><b>${esc(eh.t)}</b><small>${esc(eh.d)}${eh.fim ? ` · faltam <span data-fim="${eh.fim}" data-curto data-zero="lotou">…</span>` : ''}</small></div>
        ${eh.fim ? '<button class="icone-btn" data-a="alarme-hab" aria-label="Avisar quando lotar">⏰</button>' : ''}</div>` : ''}
    </div>

    <div class="painel painel-vinho">
      <div class="painel-t">${icone('taca', { tam: 16 })} Vinho e taverna <i class="info-i" data-balao-t="Vinho" data-balao="${esc(BALAO_VINHO)}">i</i>
        ${v ? `<span class="dir"><span class="chip ${corNivel[v.nivel]}">${textoCurto[v.nivel]}</span></span>` : ''}</div>
      ${v ? `<div class="vinho-monitor">
        ${tacaHtml(v, 'grande')}
        <div class="vinho-info">
          <small>Seca em</small><span class="contagem" data-fim="${v.zeraEm}" data-zero="SECOU">…</span>
          <span class="barra-vinho nv-${v.nivel}" data-taca data-zera="${v.zeraEm}" data-ref="${TACA_REF}" data-nv="${v.nivel}" style="--nivel:${Math.min(1, v.segRest / TACA_REF).toFixed(4)}"><i></i></span>
          <small>Zera ${esc(fmtQuando(v.zeraEm))} · barra cheia = 7 dias</small>
        </div></div>` : ''}
      <div class="dados d2">
        ${dado('vinho-estoque', 'No armazém', estoqueBruto != null ? fmt(estoqueBruto) : null, c.vinho?.em ? `atualizado ${fmtQuando(c.vinho.em)}` : '')}
        ${dado('vinho-consumo', 'Consumo / hora', c.vinho?.consumo ? fmt(c.vinho.consumo) : null, c.vinho?.consumo ? `${fmt(c.vinho.consumo * 24)} por dia` : '')}
      </div>
      ${v ? `<div class="md-rotulo" style="margin:12px 2px 6px">Repor até</div>
      <div class="repor">${[7, 14, 30].map(d => { const r = reposicaoVinho(c.vinho.consumo, d, v.restante, cap); return `<button class="repor-btn ${r.precisa ? '' : 'feito'}" data-a="repor-${d}" aria-label="Repor vinho para ${d} dias: ${r.barcos} barcos">
          <span class="repor-d">${d}d</span><span class="repor-b">${icone('mercante', { tam: 22 })}<b>${r.precisa ? fmt(r.barcos) : '✓'}</b></span><small>${r.precisa ? `${fmtK(r.precisa)} vinho` : 'já tem'}</small></button>`; }).join('')}</div>
      <div class="acoes-c"><button class="btn vinho" data-a="abastecer">${icone('anfora', { tam: 18 })} Abastecer</button><button class="btn" data-a="alarme-vinho">⏰ Alarme 3h antes</button></div>`
      : '<p class="pequeno mut" style="margin:8px 2px 0">Toque nos quadros para pôr o estoque e o consumo: o app conta sozinho até a próxima vez.</p>'}
    </div>

    <div class="painel">
      <div class="painel-t">🛡️ Segurança e gestão</div>
      <div class="dados d2">
        <button class="dado ${c.alarme ? 'liga' : 'desliga'}" data-a="alarme"><span>Barco alarme <i class="info-i" data-balao="${esc(BALAO_ALARME)}">i</i></span><b>${c.alarme ? '🔔 No porto' : '🔕 Sem barco'}</b><small>toque para trocar</small></button>
        ${dado('residencia', c.capital ? 'Palácio' : 'Residência', c.residencia != null ? `Nível ${c.residencia}` : null, `precisa ${necessario}`)}
      </div>
      <div class="humor ${corr == null ? '' : corr > 0 ? 'vermelho' : 'verde'}"><span class="rosto">${corr == null ? '⚖️' : corr > 0 ? '💸' : '✅'}</span>
        <div class="cresce"><b>Corrupção ${corr == null ? '—' : fmtPct(corr, 1)}</b><small>${corr == null ? 'Ponha o nível do prédio para calcular' : corr > 0 ? `Suba para o nível ${necessario} para zerar` : 'Zerada nesta cidade'}</small></div>
        <i class="info-i" data-balao-t="Corrupção" data-balao="${esc(BALAO_CORR)}">i</i></div>
    </div>

    ${c.papel === 'movel' ? `<div class="painel painel-movel ${c.movel?.ativa ? 'ativa' : ''}">
      <div class="painel-t">${icone('tenda', { tam: 16 })} Cidade Móvel <span class="dir"><span class="chip ${checks === CHECKLIST_MOVEL.length ? 'verde' : 'amarelo'}">${checks}/${CHECKLIST_MOVEL.length} prontos</span></span></div>
      <div class="movel-passos">${CHECKLIST_MOVEL.map(it => { const ok = !!c.movel?.checklist?.[it.id]; return `<button class="passo ${ok ? 'feito' : ''}" data-a="movel-item-${it.id}" aria-pressed="${ok}">${icone(it.icone, { tam: 22 })}<small>${esc(it.texto.split(' (')[0])}</small></button>`; }).join('')}</div>
      <div class="acoes-c"><button class="btn ${c.movel?.ativa ? 'egeu' : 'ouro'}" data-a="movel-front">${icone('espadas', { tam: 18 })} ${c.movel?.ativa ? 'No front · checklist' : 'Ativar no Front'}</button><button class="btn perigo" data-a="movel-abandonar">${icone('bandeira', { tam: 18 })} Abandonar</button></div>
    </div>` : ''}

    <div class="painel">
      <div class="painel-t">📝 Notas</div>
      <button class="nota-c ${c.notas ? '' : 'vazia'}" data-a="notas">${c.notas ? esc(c.notas) : 'Toque para anotar (ex.: ilha de cristal, vizinho perigoso…)'}</button>
    </div>
    ${p ? `<p class="pequeno mut" style="margin:10px 2px 0">${p.icone} ${esc(p.dica)}</p>` : ''}
    <div class="cid-rodape">
      <button class="btn" data-a="editar"><i>✏️</i>Editar</button>
      <button class="btn" data-a="exercito"><i>🛡️</i>Exército</button>
      <button class="btn" data-a="apagar"><i>🗑️</i>Apagar</button>
    </div>
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
      if (novo) { s.cidades.push(alvo); aberta = alvo.id; }
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
  let cs = s.cidades.map(c => ({ c, v: vinhoAgora(c.vinho, agora), h: habitantesAgora(c.habitantes, agora) }));
  const total = cs.length;
  const comVinho = cs.filter(x => x.v);
  const pior = [...comVinho].sort((a, b) => a.v.segRest - b.v.segRest)[0];
  const alarmes = s.cidades.filter(c => c.alarme).length;
  const corruptas = s.cidades.filter(c => c.residencia != null && corrupcao(c.residencia, total) > 0).length;
  const comHab = cs.filter(x => x.h);
  const popTotal = comHab.reduce((a, x) => a + x.h.atual, 0);
  const popMax = comHab.reduce((a, x) => a + (x.h.max || 0), 0);
  const tristes = cs.filter(x => x.h?.sat != null && x.h.sat < 0);
  const piorHumor = [...cs.filter(x => x.h?.sat != null)].sort((a, b) => a.h.sat - b.h.sat)[0];
  const v24 = cs.filter(x => x.v && x.v.segRest < 86400);
  const semAlarme = s.cidades.filter(c => !c.alarme);
  const fora = s.cidades.filter(tropasFora);
  const ouroExtra = fora.reduce((a, c) => a + resumoExercito(c.militar.unidades).manut1x, 0);
  const presonoOk = [!v24.length, !semAlarme.length, !fora.length].filter(Boolean).length;
  if (filtro === 'urgente') cs = cs.filter(x => x.v && (x.v.nivel === 'vermelho' || x.v.nivel === 'amarelo'));
  if (filtro === 'alarme') cs = cs.filter(x => !x.c.alarme);
  if (filtro === 'vinho24') cs = cs.filter(x => x.v && x.v.segRest < 86400);
  if (filtro === 'fora') cs = cs.filter(x => tropasFora(x.c));
  if (filtro === 'humor') cs = cs.filter(x => x.h?.sat != null && (x.h.sat < 0 || x.h.estado === 'trava' || x.h.estado === 'parada'));
  if (ordem === 'vinho') cs.sort((a, b) => (a.v ? a.v.segRest : 1e12) - (b.v ? b.v.segRest : 1e12));
  if (aberta && !s.cidades.some(c => c.id === aberta)) aberta = null;

  raiz.innerHTML = `
  <div class="tela-titulo"><div><h2>Império</h2><p>${total} cidade${total === 1 ? '' : 's'} · toque numa cidade para ver tudo</p></div>
    <div class="acoes"><button class="btn mini" data-varias>☰ Várias</button><button class="btn ouro mini" data-nova>＋ Cidade</button></div></div>
  ${total ? `
  <div class="presono ${presonoOk === 3 ? 'tudo-ok' : ''}">
    <div class="presono-t">${icone('ampulheta', { tam: 16 })}<b>Checklist pré-sono</b><span class="chip ${presonoOk === 3 ? 'verde' : 'amarelo'}">${presonoOk}/3 ok</span></div>
    <div class="pilulas">
      <button class="pilula ${v24.length ? 'ruim' : 'ok'} ${filtro === 'vinho24' ? 'ativa' : ''}" data-filtro="vinho24" aria-pressed="${filtro === 'vinho24'}">${icone('taca', { tam: 22 })}<b>${v24.length}</b><small>${v24.length === 1 ? 'cidade' : 'cidades'} &lt; 24h de vinho</small></button>
      <button class="pilula ${semAlarme.length ? 'aviso' : 'ok'} ${filtro === 'alarme' ? 'ativa' : ''}" data-filtro="alarme" aria-pressed="${filtro === 'alarme'}">${icone('escudoAlerta', { tam: 22 })}<b>${semAlarme.length}</b><small>${semAlarme.length === 1 ? 'porto' : 'portos'} sem Barco Alarme</small></button>
      <button class="pilula ${fora.length ? 'aviso' : 'ok'} ${filtro === 'fora' ? 'ativa' : ''}" data-filtro="fora" aria-pressed="${filtro === 'fora'}">${icone('ouro', { tam: 22 })}<b>${fora.length}</b><small>${fora.length ? `tropas fora · +${fmtK(ouroExtra)} ouro/h` : 'tropas fora pagando 2×'}</small></button>
    </div>
  </div>
  <div class="grade2" style="margin-bottom:12px">
    <div class="kpi ${pior ? corNivel[pior.v.nivel] === 'ok' ? '' : corNivel[pior.v.nivel] : ''}" data-balao-t="Menor vinho" data-balao="${esc(pior ? `${pior.c.nome} é a próxima taverna a secar.` : 'Ponha o vinho e o consumo de cada cidade para o app contar.')}"><span>Menor vinho</span><b>${pior ? `<em data-fim="${pior.v.zeraEm}" data-curto>…</em>` : '—'}</b><span>${pior ? esc(pior.c.nome) : 'sem dados'}</span></div>
    <div class="kpi ${comHab.length ? 'ouro' : ''}" data-balao-t="População do império" data-balao="${esc(comHab.length ? `${fmt(popTotal)} habitantes em ${comHab.length} cidade(s)${popMax ? `, de ${fmt(popMax)} moradias (${Math.round(popTotal / popMax * 100)}% ocupado)` : ''}.` : 'Abra uma cidade e toque em 🏛️ Prefeitura para pôr os habitantes.')}"><span>Habitantes</span><b>${comHab.length ? fmtK(popTotal) : '—'}</b><span>${popMax ? `de ${fmtK(popMax)} · ${Math.round(popTotal / popMax * 100)}%` : 'sem dados'}</span></div>
    <div class="kpi ${piorHumor ? piorHumor.h.humor.cor === 'ok' ? '' : piorHumor.h.humor.cor : ''}" data-balao-t="Satisfação" data-balao="${esc(tristes.length ? `${tristes.length} cidade(s) perdendo gente: ${tristes.map(x => x.c.nome).join(', ')}.` : 'Nenhuma cidade com satisfação negativa.')}"><span>Pior humor</span><b>${piorHumor ? `${piorHumor.h.humor.icone} ${sinal(piorHumor.h.sat)}` : '—'}</b><span>${piorHumor ? esc(piorHumor.c.nome) : 'sem dados'}</span></div>
    <div class="kpi ${alarmes === total ? 'verde' : 'amarelo'}" data-balao-t="Barco alarme" data-balao="${esc(BALAO_ALARME)}"><span>Barco alarme</span><b>${alarmes}/${total}</b><span>portos protegidos</span></div>
    <div class="kpi ${corruptas ? 'vermelho' : 'verde'}" data-balao-t="Corrupção" data-balao="${esc(BALAO_CORR)}"><span>Corrupção</span><b>${corruptas ? `${corruptas} cidade(s)` : 'zero'}</b><span>nível ${nivelSemCorrupcao(total)} em todas</span></div>
    <button class="kpi ouro" style="text-align:left;color:inherit" data-cap><span>Barco mercante ✎</span><b>${fmt(s.config.capMercante)}</b><span>de carga cada</span></button>
  </div>
  <div class="flex quebra" style="margin-bottom:10px">
    <div class="linha-chips cresce">
      ${[['todas', 'Todas'], ['urgente', '🍇 Urgentes'], ['humor', '😟 Satisfação']].map(([id, n]) => `<button class="chip ${filtro === id ? 'ativo' : ''}" data-filtro="${id}">${n}</button>`).join('')}
    </div>
    <button class="chip" data-ordem>${ordem === 'vinho' ? '⏳ por vinho' : '📌 minha ordem'}</button>
  </div>
  ${cs.map(({ c, v, h }) => `<div class="cid ${aberta === c.id ? 'aberta' : ''} ${c.papel === 'movel' ? 'cid-movel' : c.papel === 'ancora' ? 'cid-ancora' : ''} ${c.capital ? 'cid-capital' : ''} ${c.movel?.ativa && c.papel === 'movel' ? 'no-front' : ''}" id="cid-${c.id}">${cabecalho(c, v, h)}${corpo(c, v, h, s)}</div>`).join('') || `<div class="vazio">Nenhuma cidade neste filtro.${filtro !== 'todas' ? '<br><button class="btn mini" data-filtro="todas" style="margin-top:8px">Ver todas</button>' : ''}</div>`}
  ` : `<div class="card"><div class="vazio"><span class="grande">🏘️</span>Nenhuma cidade ainda.<br>Adicione uma por uma ou várias de uma vez.</div>
    <div class="grade2"><button class="btn ouro" data-nova>＋ Cidade</button><button class="btn" data-varias>☰ Várias</button></div></div>`}`;

  const alterar = (id, fn) => store.set(st => { const c = st.cidades.find(x => x.id === id); if (c) fn(c, st); });

  raiz.addEventListener('click', async e => {
    const t = e.target;
    const ab = t.closest('[data-abrir]');
    if (ab) return alternar(raiz, ab.dataset.abrir);
    if (t.closest('[data-nova]')) return formCidade();
    if (t.closest('[data-varias]')) return formVarias();
    if (t.closest('[data-cap]')) {
      const n = await pedirNumero({ titulo: '🚢 Barco mercante', sub: 'Carga de cada barco', valor: s.config.capMercante, min: 1, sufixo: 'carga', atalhos: [500, 750, 1000, 1250, 1500].map(x => ({ rotulo: x === 500 ? 'Base' : 'Porto', valor: x })) });
      if (n != null) store.set(st => { st.config.capMercante = n; });
      return;
    }
    const fl = t.closest('[data-filtro]'); if (fl) { filtro = fl.classList.contains('pilula') && filtro === fl.dataset.filtro ? 'todas' : fl.dataset.filtro; return ctx.atualizar(); }
    const tg = t.closest('[data-alarme-tg]');
    if (tg) {
      const c = store.cidade(tg.dataset.alarmeTg); if (!c) return;
      tg.classList.add('trocando');
      return acao('alarme', c, { alterar, ir, s: store.get() });
    }
    if (t.closest('[data-ordem]')) { ordem = ordem === 'vinho' ? 'minha' : 'vinho'; return ctx.atualizar(); }
    const btn = t.closest('[data-a]');
    const id = t.closest('[data-cidade]')?.dataset.cidade;
    const c = id && store.cidade(id);
    if (!btn || !c) return;
    await acao(btn.dataset.a, c, { alterar, ir, s: store.get() });
  });
}

// Abre uma cidade e fecha a anterior (sanfona com uma só aberta)
function alternar(raiz, id) {
  const ant = aberta;
  if (ant) { const a = raiz.querySelector('#cid-' + ant); a?.classList.remove('aberta'); a?.querySelector('[data-abrir]')?.setAttribute('aria-expanded', 'false'); }
  if (ant === id) { aberta = null; return; }
  aberta = id;
  const el = raiz.querySelector('#cid-' + id);
  if (!el) return;
  el.classList.add('aberta');
  el.querySelector('[data-abrir]')?.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect();
    const topo = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topo-h')) || 58;
    if (r.top < topo + 8 || r.top > window.innerHeight * 0.45) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

async function acao(a, c, { alterar, ir, s }) {
  const agora = Date.now();
  const h = habitantesAgora(c.habitantes, agora);
  const v = vinhoAgora(c.vinho, agora);
  const total = s.cidades.length;
  // guarda os habitantes projetados como novo ponto de partida
  const baseHab = () => ({ atual: h ? h.atual : c.habitantes.atual, max: c.habitantes.max, satisfacao: h ? h.sat : c.habitantes.satisfacao, em: agora });

  if (a.startsWith('repor-')) return abastecer(c, v, s, alterar, +a.slice(6));
  if (a.startsWith('movel-item-')) {
    const it = a.slice(11), novo = !c.movel?.checklist?.[it];
    alterar(c.id, x => { x.movel.checklist[it] = novo; if (it === 'alarme') x.alarme = novo; });
    return toast(`${novo ? '✓' : '○'} ${CHECKLIST_MOVEL.find(x => x.id === it)?.texto.split(' (')[0]}`, novo ? 'ok' : '');
  }
  switch (a) {
    case 'prefeitura': {
      const r = await pedirCampos({
        titulo: '🏛️ Prefeitura', sub: c.nome, colunas: 1,
        dica: 'Copie os números da Prefeitura no jogo. Satisfação pode ser negativa.',
        campos: [
          { name: 'atual', rotulo: 'Habitantes agora', valor: h?.atual ?? c.habitantes?.atual ?? '', placeholder: 'ex.: 1.840' },
          { name: 'max', rotulo: 'Capacidade (moradias)', valor: c.habitantes?.max ?? '', placeholder: 'ex.: 2.256' },
          { name: 'satisfacao', rotulo: 'Satisfação', valor: h?.sat ?? c.habitantes?.satisfacao ?? '', placeholder: 'ex.: 196 ou -20', negativo: true },
        ],
      });
      if (!r) return;
      if (r.atual == null) return toast('Informe pelo menos os habitantes', 'erro');
      alterar(c.id, x => { x.habitantes = { atual: Math.max(0, r.atual), max: r.max > 0 ? r.max : null, satisfacao: r.satisfacao, em: Date.now() }; });
      return toast(`👥 ${c.nome} atualizada`, 'ok');
    }
    case 'hab-atual': {
      const n = await pedirNumero({ titulo: '👥 Habitantes', sub: c.nome, rotulo: 'Quantos moram agora', valor: h?.atual ?? c.habitantes?.atual ?? '', min: 0, passos: [-100, -10, 10, 100], sufixo: 'hab.' });
      if (n == null) return;
      alterar(c.id, x => { x.habitantes = { ...baseHab(), atual: n }; });
      return toast('👥 Habitantes salvos', 'ok');
    }
    case 'hab-max': {
      const n = await pedirNumero({ titulo: '🏠 Capacidade', sub: c.nome, rotulo: 'Limite de moradias da Prefeitura', valor: c.habitantes?.max ?? '', min: 0, limpar: true, sufixo: 'moradias' });
      if (n === undefined) return;
      alterar(c.id, x => { x.habitantes = { ...baseHab(), max: n || null, atual: h ? h.atual : x.habitantes.atual }; });
      return toast('🏠 Capacidade salva', 'ok');
    }
    case 'hab-sat': {
      const n = await pedirNumero({ titulo: '😊 Satisfação', sub: c.nome, rotulo: 'Satisfação na Prefeitura', valor: h?.sat ?? c.habitantes?.satisfacao ?? '', negativo: true, passos: [-50, -10, 10, 50],
        dica: 'Eufórica ≥ 300 · Feliz ≥ 50 · Neutra ≥ 0 · abaixo de 0 a cidade perde gente.' });
      if (n == null) return;
      alterar(c.id, x => { x.habitantes = { ...baseHab(), atual: h ? h.atual : x.habitantes.atual, satisfacao: n }; });
      return toast(`${humor(n).icone} Satisfação salva`, 'ok');
    }
    case 'alarme-hab':
      if (h?.cheiaEm) T.novoTimer({ nome: `${c.nome}: Prefeitura lotada`, icone: '👥', fim: h.cheiaEm, tipo: 'habitantes', ref: c.id });
      return;
    case 'vinho-estoque': {
      const n = await pedirNumero({ titulo: '🍇 Vinho no armazém', sub: c.nome, valor: v ? Math.floor(v.restante) : c.vinho?.estoque ?? '', min: 0, passos: [-1000, 1000, 5000], sufixo: 'vinho' });
      if (n == null) return;
      alterar(c.id, x => { x.vinho = { ...x.vinho, estoque: n, em: Date.now() }; });
      return toast(c.vinho?.consumo ? '🍇 Vinho atualizado' : '🍇 Agora ponha o consumo por hora', 'ok');
    }
    case 'vinho-consumo': {
      const n = await pedirNumero({ titulo: '🍷 Consumo da taverna', sub: c.nome, rotulo: 'Vinho servido por hora', valor: c.vinho?.consumo ?? '', min: 0, passos: [-10, 10, 50], sufixo: '/ hora' });
      if (n == null) return;
      alterar(c.id, x => { x.vinho = { estoque: v ? Math.floor(v.restante) : x.vinho.estoque, consumo: n || null, em: Date.now() }; });
      return toast('🍷 Consumo salvo', 'ok');
    }
    case 'abastecer': return abastecer(c, v, s, alterar);
    case 'alarme-vinho': {
      const fim = v.zeraEm - 3 * 3600e3;
      if (fim <= Date.now()) return toast('Faltam menos de 3h: abasteça já!', 'erro');
      return T.novoTimer({ nome: `Vinho de ${c.nome} seca em 3h`, icone: '🍇', fim, tipo: 'vinho', ref: c.id });
    }
    case 'alarme':
    { const novo = !c.alarme;
      alterar(c.id, x => { x.alarme = novo; if (x.papel === 'movel') x.movel.checklist.alarme = novo; });
      return toast(novo ? '🔔 Barco alarme no porto' : '🔕 Porto sem barco alarme', novo ? 'ok' : ''); }
    case 'residencia': {
      const nec = nivelSemCorrupcao(total);
      const n = await pedirNumero({ titulo: c.capital ? '🏛️ Palácio' : '🏛️ Residência do Governador', sub: c.nome, rotulo: 'Nível do prédio', valor: c.residencia ?? '', min: 0, max: 60, passos: [-1, 1], limpar: true,
        atalhos: [{ rotulo: 'Sem corrupção', valor: nec, texto: `Nível ${nec}` }], dica: `Com ${total} cidades, nível <b>${nec}</b> zera a corrupção.` });
      if (n === undefined) return;
      alterar(c.id, x => { x.residencia = n; });
      return toast(n == null ? 'Nível apagado' : `Nível ${n} · corrupção ${fmtPct(corrupcao(n, total), 1)}`, 'ok');
    }
    case 'movel-check': return checklistMovel(c);
    case 'movel-front':
      if (!c.movel?.ativa) { alterar(c.id, x => { x.movel.ativa = true; }); toast('⚔️ Cidade móvel ativa no front', 'ok'); }
      return checklistMovel(c);
    case 'movel-ativa':
    { const novo = !c.movel?.ativa;
      alterar(c.id, x => { x.movel.ativa = novo; });
      return toast(novo ? '⚔️ Móvel ativa na guerra' : '⏸️ Móvel pausada', 'ok'); }
    case 'movel-abandonar':
      if (await confirmar('Abandonar cidade móvel?', `Limpa coordenada, checklist e exército de ${c.nome}. O slot continua no império para a próxima guerra.`, 'Abandonar', true))
        alterar(c.id, x => { x.coords = ''; x.movel = { ativa: false, checklist: {} }; x.militar = { fora: false, unidades: {} }; x.alarme = false; x.vinho = { estoque: null, consumo: null, em: null }; });
      return;
    case 'notas': {
      const txt = await pedirTexto({ titulo: '📝 Notas', sub: c.nome, valor: c.notas || '', multilinha: true, placeholder: 'Ex.: ilha de cristal, vizinho perigoso…' });
      if (txt == null) return;
      alterar(c.id, x => { x.notas = txt; });
      return toast('📝 Notas salvas', 'ok');
    }
    case 'editar': return formCidade(c);
    case 'exercito': focarCidade(c.id); return ir('militar', 'exercito');
    case 'apagar':
      if (await confirmar('Apagar cidade?', `${c.nome} sai do app (não do jogo).`, 'Apagar', true)) { store.set(st => { st.cidades = st.cidades.filter(x => x.id !== c.id); }); toast('🗑️ Cidade apagada'); }
      return;
  }
}

async function abastecer(c, v, s, alterar, dias = null) {
  if (!v) return toast('Ponha o estoque e o consumo primeiro', 'erro');
  const cap = s.config.capMercante || 500;
  const atalhos = [3, 7, 14, 30].map(d => { const r = reposicaoVinho(c.vinho.consumo, d, v.restante, cap); return { rotulo: `${d} dias`, valor: r.precisa, sub: `${fmt(r.barcos)} barco${r.barcos === 1 ? '' : 's'}` }; }).filter(x => x.valor > 0);
  const pre = dias ? reposicaoVinho(c.vinho.consumo, dias, v.restante, cap) : null;
  if (pre && !pre.precisa) return toast(`🍇 ${c.nome} já tem vinho para ${dias} dias`, 'ok');
  const n = await pedirNumero({
    titulo: '🚢 Abastecer vinho', sub: pre ? `${c.nome} · repor até ${dias} dias` : c.nome, rotulo: 'Quanto vinho chegou', min: 0, somar: true, base: Math.floor(v.restante),
    valor: pre ? pre.precisa : null, atalhos, passos: [cap, cap * 5, cap * 10], botao: 'Abasteci', sufixo: 'vinho',
    dica: pre ? `Mande <b>${fmt(pre.barcos)} barco${pre.barcos === 1 ? '' : 's'} mercante${pre.barcos === 1 ? '' : 's'}</b> (${fmt(cap)} cada) e toque em Abasteci quando chegar.` : atalhos.length ? 'Toque num prazo para preencher o que falta até lá.' : '',
  });
  if (!n) return;
  alterar(c.id, x => { const w = vinhoAgora(x.vinho); x.vinho = { ...x.vinho, estoque: Math.floor((w ? w.restante : 0) + n), em: Date.now() }; });
  toast(`🍇 +${fmt(n)} em ${c.nome}`, 'ok');
}

// "Ativar no Front": checklist marcável da cidade móvel (Barco Alarme fica ligado ao do porto)
function checklistMovel(c) {
  const desenhar = () => {
    const cc = store.cidade(c.id);
    const feitos = CHECKLIST_MOVEL.filter(it => cc.movel?.checklist?.[it.id]).length;
    return `<div class="movel-prog"><span style="width:${Math.round(feitos / CHECKLIST_MOVEL.length * 100)}%"></span></div>
      <div class="mn-vidro md-lista">${CHECKLIST_MOVEL.map(it => { const ok = cc.movel?.checklist?.[it.id]; return `<div class="mn-item ${ok ? 'feito' : ''}" data-it="${it.id}"><span class="st">${ok ? '✓' : ''}</span><span class="ic">${icone(it.icone, { tam: 22 })}</span><span class="meio"><b>${esc(it.texto)}</b></span></div>`; }).join('')}</div>
      <div class="fl-botoes">${cc.movel?.ativa ? '<button class="btn" data-pausar>⏸️ Tirar do front</button>' : ''}<button class="btn ouro" data-fechar>${feitos === CHECKLIST_MOVEL.length ? 'Pronta para a guerra ⚔️' : 'Pronto'}</button></div>`;
  };
  const f = modal({ titulo: '⚔️ Ativar no Front', sub: `${c.nome} · implantação da cidade móvel`, html: `<div data-l>${desenhar()}</div>` });
  f.corpo.addEventListener('click', e => {
    if (e.target.closest('[data-pausar]')) { store.set(st => { st.cidades.find(y => y.id === c.id).movel.ativa = false; }); toast('⏸️ Móvel fora do front'); f.fechar(); return; }
    const it = e.target.closest('[data-it]'); if (!it) return;
    store.set(st => { const x = st.cidades.find(y => y.id === c.id); const novo = !x.movel.checklist[it.dataset.it]; x.movel.checklist[it.dataset.it] = novo; if (it.dataset.it === 'alarme') x.alarme = novo; });
    f.corpo.querySelector('[data-l]').innerHTML = desenhar();
  });
}
