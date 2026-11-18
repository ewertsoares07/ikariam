// SISTEMA — conta e nuvem, ajustes e sobre
import * as store from '../store.js';
import * as T from '../timers.js';
import { PAPEIS_USUARIO } from '../config.js';
import { VERSAO_APP } from '../data.js';
import { esc, fmt, fmtDesde, toast, confirmar, pedirNumero, pedirTexto } from '../ui.js';

const ABAS = [['conta', '☁️ Conta'], ['config', '🎛️ Ajustes'], ['sobre', 'ℹ️ Sobre']];

export function render(raiz, ctx) {
  const sub = ABAS.some(a => a[0] === ctx.sub) ? ctx.sub : 'conta';
  raiz.innerHTML = `<div class="tela-titulo"><div><h2>Sistema</h2><p>Conta, nuvem e ajustes</p></div></div>
    <div class="seg">${ABAS.map(([id, n]) => `<button class="${id === sub ? 'ativo' : ''}" data-aba="${id}">${n}</button>`).join('')}</div><div data-c></div>`;
  raiz.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b) ctx.ir('sistema', b.dataset.aba); });
  ({ conta, config, sobre })[sub](raiz.querySelector('[data-c]'), ctx);
}

function cardInstalar(ctx) {
  const { app } = ctx;
  if (app.instalado()) return `<div class="card"><div class="flex"><span class="ic-q">📲</span><div class="cresce"><b>App instalado</b><div class="mut pequeno">Abrindo em tela cheia e funcionando offline.</div></div><span class="chip verde">✓</span></div></div>`;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="card destaque"><h3><span class="ic-q">📲</span>Instalar no celular</h3>
    ${app.podeInstalar() ? '<p class="dica">Fica com ícone na tela inicial, abre em tela cheia e funciona sem internet.</p><button class="btn ouro bloco" data-instalar>Instalar agora</button>'
      : ios ? '<p class="dica">No iPhone: toque em <b>Compartilhar</b> (quadrado com seta) › <b>Adicionar à Tela de Início</b>.</p>'
      : '<p class="dica">No Android (Chrome): menu ⋮ › <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p>'}</div>`;
}

function conta(raiz, ctx) {
  const { cloud, s } = ctx;
  const e = cloud.estado;
  const u = e.usuario;
  const p = PAPEIS_USUARIO[cloud.papel()];
  raiz.innerHTML = `
  ${u ? `<div class="card">
    <div class="flex"><span class="topo-btn" style="width:54px;height:54px;border-radius:16px">${u.photoURL ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">` : '👤'}</span>
      <div class="cresce"><b style="font-size:1.05rem">${esc(u.nome)}</b><div class="mut pequeno">${esc(u.email)}</div></div>
      <span class="chip ${cloud.papel() === 'pendente' ? 'amarelo' : 'ouro'}">${p ? `${p.icone} ${p.nome}` : ''}</span></div>
    ${cloud.papel() === 'pendente' ? '<div class="alerta aviso" style="margin-top:12px">Seu acesso à aliança aguarda aprovação do líder. Seu império já está salvo na nuvem.</div>' : ''}
    <div class="resultado">
      <div class="linha"><span>Nuvem</span><b>${e.sincronizando ? '🔄 sincronizando…' : e.online ? '🟢 conectada' : '📴 offline'}</b></div>
      <div class="linha"><span>Último envio</span><b>${esc(fmtDesde(e.ultimoEnvio || s.ultimoSync))}</b></div>
      ${e.erro ? `<div class="linha"><span>Aviso</span><b style="color:var(--vermelho)">${esc(e.erro)}</b></div>` : ''}
    </div>
    <div class="grade2" style="margin-top:10px"><button class="btn egeu" data-sync>🔄 Sincronizar</button><button class="btn" data-sair>Sair</button></div>
    ${cloud.papel() === 'admin' ? `<button class="btn ouro bloco" style="margin-top:8px" data-membros>👥 Membros da aliança${e.pendentes ? ` · ${e.pendentes} aguardando` : ''}</button>` : ''}
  </div>` : `<div class="card destaque">
    <h3><span class="ic-q">☁️</span>Entre com o Google</h3>
    <ul class="pequeno" style="margin:0 0 12px;padding-left:18px;color:var(--txt2)">
      <li>Tudo salvo na nuvem: trocou de celular, está lá.</li>
      <li>Celular e PC sincronizados na hora.</li>
      <li>Aliança: operações com hora de partida de cada um, alvos e mural.</li>
    </ul>
    <button class="btn ouro bloco" data-entrar ${e.carregando ? 'disabled' : ''}>${e.carregando ? 'Conectando…' : '<b>G</b>&nbsp; Entrar com Google'}</button>
    ${e.erro ? `<div class="alerta erro" style="margin-top:10px">${esc(e.erro)}</div>` : ''}
    <p class="pequeno mut" style="margin:10px 2px 0">Sem conta o app funciona igual, salvando só neste aparelho.</p>
  </div>`}
  ${cardInstalar(ctx)}`;
  raiz.addEventListener('click', async ev => {
    if (ev.target.closest('[data-entrar]')) { if (!navigator.onLine) return toast('Precisa de internet para entrar', 'erro'); return cloud.entrar(); }
    if (ev.target.closest('[data-sair]') && await confirmar('Sair da conta?', 'Seus dados continuam neste aparelho e na nuvem.', 'Sair')) return cloud.sair();
    if (ev.target.closest('[data-sync]')) return cloud.sincronizarAgora().catch(er => toast(cloud.traduzir(er), 'erro'));
    if (ev.target.closest('[data-membros]')) return ctx.ir('alianca', 'membros');
    if (ev.target.closest('[data-instalar]')) return ctx.app.instalar();
  });
}

const CFG = {
  nomeJogador: { titulo: '👤 Nome no jogo', texto: true, ph: 'Seu nome no Ikariam' },
  servidor: { titulo: '🌍 Servidor', texto: true, ph: 'ex.: Alpha BR' },
  capMercante: { titulo: '🚢 Carga do mercante', min: 100, suf: 'carga', atalhos: [500, 750, 1000, 1250, 1500].map(v => ({ rotulo: v === 500 ? 'Base' : 'Porão', valor: v })), dica: 'Base do jogo: 500. Com melhorias de porão, ponha o seu valor.' },
  capCargueiro: { titulo: '🛳️ Carga do cargueiro', min: 1000, suf: 'carga' },
  mercantes: { titulo: '🚢 Quantos mercantes', passos: [-10, -1, 1, 10] },
  cargueiros: { titulo: '🛳️ Quantos cargueiros', passos: [-1, 1] },
  avisoMin: { titulo: '🔔 Aviso antes do fim', rotulo: 'Minutos antes (0 = desligado)', max: 120, suf: 'min', atalhos: [0, 5, 10, 15].map(v => ({ rotulo: v ? 'Avisar' : 'Desligar', valor: v, texto: v ? `${v} min` : 'Off' })) },
};
const dadoCfg = (id, rot, val) => `<button class="dado ${val == null ? 'falta' : ''}" data-cfg="${id}"><span>${rot}</span><b>${val ?? 'tocar p/ pôr'}</b></button>`;

function config(raiz, ctx) {
  const c = ctx.s.config;
  const sw = (name, on, txt, sub = '') => `<label class="marcar"><span class="cresce">${txt}${sub ? `<small class="mut" style="display:block;font-weight:600">${sub}</small>` : ''}</span><span class="interruptor"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i></span></label>`;
  raiz.innerHTML = `
  <div class="card"><h3><span class="ic-q">👤</span>Jogador</h3>
    <div class="dados d2">${dadoCfg('nomeJogador', 'Nome no jogo', c.nomeJogador ? esc(c.nomeJogador) : null)}${dadoCfg('servidor', 'Servidor', c.servidor ? esc(c.servidor) : null)}</div>
    <div style="margin-top:8px">${sw('oligarquia', c.oligarquia, 'Governo Oligarquia', 'Já marca +10% de velocidade nas viagens')}</div>
  </div>
  <div class="card"><h3><span class="ic-q">⛵</span>Frota de transporte</h3>
    <div class="dados d2">
      ${dadoCfg('capMercante', 'Carga do mercante', fmt(c.capMercante))}${dadoCfg('capCargueiro', 'Carga do cargueiro', fmt(c.capCargueiro))}
      ${dadoCfg('mercantes', 'Quantos mercantes', fmt(c.mercantes || 0))}${dadoCfg('cargueiros', 'Quantos cargueiros', fmt(c.cargueiros || 0))}
    </div><p class="pequeno mut" style="margin:8px 2px 0">Base do jogo: 500 por mercante. Com melhorias de porão, ponha o seu valor.</p></div>
  <div class="card"><h3><span class="ic-q">🔔</span>Alarmes</h3>
    <div class="lista" style="gap:8px">${sw('som', c.som, 'Som de corneta')}${sw('voz', c.voz, 'Voz em português')}${sw('vibrar', c.vibrar, 'Vibrar')}</div>
    <div class="dados d2" style="margin-top:10px">${dadoCfg('avisoMin', 'Aviso antes do fim', c.avisoMin ? `${c.avisoMin} min` : 'desligado')}</div>
    <button class="btn bloco" style="margin-top:10px" data-testar>🎺 Testar alarme</button>
  </div>
  <div class="card"><h3><span class="ic-q">🎨</span>Aparência</h3>
    <div class="seg" style="margin:0"><button class="${c.tema !== 'papiro' ? 'ativo' : ''}" data-tema="escuro">🌙 Egeu noturno</button><button class="${c.tema === 'papiro' ? 'ativo' : ''}" data-tema="papiro">📜 Papiro</button></div>
    <div style="margin-top:10px">${sw('mostrarRaras', c.mostrarRaras, 'Mostrar unidades pouco usadas', 'Lanceiro, Arqueiro, Fundibulário, Catapulta, Barco Balista')}</div>
  </div>
  <div class="card"><h3><span class="ic-q">🧨</span>Começar do zero</h3>
    <p class="dica">Apaga cidades, alvos e cronômetros. Se estiver logado, a nuvem também fica vazia.</p>
    <button class="btn perigo bloco" data-zerar>Apagar tudo</button>
  </div>`;
  raiz.addEventListener('change', e => {
    const t = e.target; if (!t.name || !(t.name in c)) return;
    const val = t.type === 'checkbox' ? t.checked : t.type === 'number' ? (t.value === '' ? 0 : +t.value) : t.value;
    store.set(s => { s.config[t.name] = val; });
  });
  raiz.addEventListener('click', async e => {
    const cf = e.target.closest('[data-cfg]')?.dataset.cfg;
    if (cf) {
      const def = CFG[cf];
      const v = def.texto
        ? await pedirTexto({ titulo: def.titulo, valor: c[cf] || '', placeholder: def.ph || '', max: 30 })
        : await pedirNumero({ titulo: def.titulo, rotulo: def.rotulo || '', valor: c[cf] || '', min: def.min ?? 0, max: def.max ?? null, passos: def.passos || [], atalhos: def.atalhos || [], sufixo: def.suf || '', dica: def.dica || '' });
      if (v == null) return;
      store.set(st => { st.config[cf] = v; });
      return toast('Ajuste salvo ✔', 'ok');
    }
    if (e.target.closest('[data-zerar]') && await confirmar('Apagar tudo?', 'Cidades, alvos e cronômetros deste aparelho e da nuvem. Não dá para desfazer.', 'Apagar tudo', true)) {
      const cfg = store.get().config;
      store.substituir({ ...store.estadoVazio(), config: cfg }, 'local');
      store.set(() => {});
      return toast('Tudo apagado');
    }
    const tm = e.target.closest('[data-tema]'); if (tm) store.set(s => { s.config.tema = tm.dataset.tema; });
    if (e.target.closest('[data-testar]')) { T.tocarCorneta(); T.falar('Alarme de teste, comandante.'); navigator.vibrate?.([300, 100, 300]); }
  });
}

function sobre(raiz) {
  raiz.innerHTML = `<div class="card"><h3><span class="ic-q">🏛️</span>Comando Imperial ${VERSAO_APP}</h3>
    <p class="dica">App de apoio para Ikariam, feito para você não precisar ficar online o tempo todo. Ele não acessa o jogo nem automatiza nenhuma ação: só calcula, lembra e organiza o que você informa.</p>
    <div class="resultado" style="margin-top:0">
      <div class="linha"><span>Viagem</span><b>distância × 1200 ÷ velocidade</b></div>
      <div class="linha"><span>Mesma ilha</span><b>distância 0,5</b></div>
      <div class="linha"><span>Generais</span><b>custo em recursos ÷ 50</b></div>
      <div class="linha"><span>Corrupção</span><b>1 − (nível + 1) ÷ cidades</b></div>
      <div class="linha"><span>Peso de tropas</span><b>tabela da Wiki</b></div>
    </div>
    <p class="pequeno mut" style="margin:10px 2px 0">Fontes: Ikariam Wiki (velocidade, carga, palácio), guias do fórum BR (LC Tank, Oficina, prioridades, Abissal) e o Dossiê do projeto. Ikariam é marca da Gameforge; este app não é oficial.</p>
  </div>`;
}
