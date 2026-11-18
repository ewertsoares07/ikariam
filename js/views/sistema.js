// SISTEMA — conta e nuvem, backup, ajustes e sobre
import * as store from '../store.js';
import * as T from '../timers.js';
import { PAPEIS_USUARIO } from '../config.js';
import { VERSAO_APP } from '../data.js';
import { esc, fmt, fmtDesde, toast, confirmar, copiar, baixar, folha, campoNum } from '../ui.js';

const ABAS = [['conta', '☁️ Conta'], ['backup', '💾 Backup'], ['config', '🎛️ Ajustes'], ['sobre', 'ℹ️ Sobre']];

export function render(raiz, ctx) {
  const sub = ABAS.some(a => a[0] === ctx.sub) ? ctx.sub : 'conta';
  raiz.innerHTML = `<div class="tela-titulo"><div><h2>Sistema</h2><p>Conta, backup e ajustes</p></div></div>
    <div class="seg">${ABAS.map(([id, n]) => `<button class="${id === sub ? 'ativo' : ''}" data-aba="${id}">${n}</button>`).join('')}</div><div data-c></div>`;
  raiz.querySelector('.seg').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b) ctx.ir('sistema', b.dataset.aba); });
  ({ conta, backup, config, sobre })[sub](raiz.querySelector('[data-c]'), ctx);
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
      <li>Backup automático: trocou de celular, está tudo lá.</li>
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

function backup(raiz, ctx) {
  const { s } = ctx;
  raiz.innerHTML = `
  <div class="card"><h3><span class="ic-q">💾</span>Cópia de segurança</h3>
    <p class="dica">${s.cidades.length} cidades · ${s.alvos.length} alvos · ${s.timers.length} cronômetros. Com login no Google isso já vai para a nuvem sozinho.</p>
    <div class="grade2"><button class="btn ouro" data-exportar>⬇️ Baixar .json</button><label class="btn" style="position:relative">⬆️ Importar arquivo<input type="file" accept=".json,application/json" data-arquivo style="position:absolute;inset:0;opacity:0"></label></div>
    <div class="grade2" style="margin-top:8px"><button class="btn" data-codigo>📋 Copiar código</button><button class="btn" data-colar>📥 Colar código</button></div>
    <p class="pequeno mut" style="margin:8px 2px 0">O código é um texto que você cola no WhatsApp ou no bloco de notas e depois cola de volta aqui.</p>
  </div>
  <div class="card"><h3><span class="ic-q">📦</span>Trazer da v1</h3>
    <p class="dica">Na v1, vá em <b>Notas › Exportar dados (JSON)</b> e importe o arquivo aqui em "Importar arquivo". Vêm as cidades, os exércitos, os alvos, as notas e os cronômetros que ainda não terminaram.</p>
    ${ctx.cloud.papel() === 'admin' ? '<button class="btn egeu bloco" data-legado>☁️ Puxar direto da nuvem da v1</button>' : ''}
  </div>
  <div class="card"><h3><span class="ic-q">🧨</span>Começar do zero</h3>
    <p class="dica">Apaga tudo deste aparelho. Se estiver logado, a nuvem recebe a versão vazia.</p>
    <button class="btn perigo bloco" data-zerar>Apagar tudo</button>
  </div>`;
  const importar = obj => {
    try { const tipo = store.importarQualquer(obj); toast(tipo === 'v1' ? '📦 Dados da v1 importados!' : '✔ Backup restaurado', 'ok'); }
    catch (e) { toast('Não reconheci esse backup: ' + e.message, 'erro'); }
  };
  raiz.addEventListener('click', async e => {
    if (e.target.closest('[data-exportar]')) return baixar(`ikariam-imperial-${new Date().toISOString().slice(0, 10)}.json`, store.exportarJSON());
    if (e.target.closest('[data-legado]')) {
      try { const doc = await ctx.cloud.lerLegadoV1(); if (await confirmar('Importar da v1?', 'As cidades, exércitos e alvos da v1 vão substituir os deste aparelho.', 'Importar', true)) importar(doc); }
      catch (er) { toast(ctx.cloud.traduzir(er), 'erro'); }
      return;
    }
    if (e.target.closest('[data-codigo]')) { const c = await store.gerarCodigo(); return copiar(c); }
    if (e.target.closest('[data-colar]')) {
      const f = folha({ titulo: 'Colar código de backup', html: '<textarea class="entrada" rows="6" data-txt placeholder="IKV2Z.…"></textarea><div class="fl-botoes"><button class="btn" data-fechar>Cancelar</button><button class="btn ouro" data-ok>Restaurar</button></div>' });
      f.corpo.querySelector('[data-ok]').onclick = async () => {
        try { const obj = await store.lerCodigo(f.corpo.querySelector('[data-txt]').value); if (await confirmar('Substituir dados?', 'O que está neste aparelho será trocado pelo backup.', 'Substituir', true)) { importar(obj); f.fechar(); } }
        catch (er) { toast('Código inválido', 'erro'); }
      };
      return;
    }
    if (e.target.closest('[data-zerar]') && await confirmar('Apagar tudo?', 'Cidades, alvos, cronômetros e ajustes deste aparelho. Não dá para desfazer (a não ser com backup).', 'Apagar tudo', true)) {
      const cfg = store.get().config;
      store.substituir({ ...store.estadoVazio(), config: cfg }, 'local');
      store.set(() => {});
      toast('Tudo apagado');
    }
  });
  raiz.querySelector('[data-arquivo]').addEventListener('change', async e => {
    const arq = e.target.files[0]; if (!arq) return;
    try {
      const obj = JSON.parse(await arq.text());
      if (await confirmar('Substituir dados?', `Importar "${arq.name}" troca o que está neste aparelho.`, 'Importar', true)) importar(obj);
    } catch { toast('Arquivo inválido', 'erro'); }
    e.target.value = '';
  });
}

function config(raiz, ctx) {
  const c = ctx.s.config;
  const sw = (name, on, txt, sub = '') => `<label class="marcar"><span class="cresce">${txt}${sub ? `<small class="mut" style="display:block;font-weight:600">${sub}</small>` : ''}</span><span class="interruptor"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><i></i></span></label>`;
  raiz.innerHTML = `
  <div class="card"><h3><span class="ic-q">👤</span>Jogador</h3>
    <div class="grade2"><label class="campo"><span>Nome no jogo</span><input name="nomeJogador" value="${esc(c.nomeJogador)}" maxlength="30"></label>
    <label class="campo"><span>Servidor</span><input name="servidor" value="${esc(c.servidor)}" maxlength="30" placeholder="ex.: Alpha BR"></label></div>
    <div style="margin-top:8px">${sw('oligarquia', c.oligarquia, 'Governo Oligarquia', 'Já marca +10% de velocidade nas viagens')}</div>
  </div>
  <div class="card"><h3><span class="ic-q">⛵</span>Frota de transporte</h3>
    <div class="grade2">
      <label class="campo"><span>Carga do mercante</span>${campoNum('capMercante', c.capMercante, 'min="100"')}</label>
      <label class="campo"><span>Carga do cargueiro</span>${campoNum('capCargueiro', c.capCargueiro, 'min="1000"')}</label>
      <label class="campo"><span>Quantos mercantes</span>${campoNum('mercantes', c.mercantes || '', 'min="0"')}</label>
      <label class="campo"><span>Quantos cargueiros</span>${campoNum('cargueiros', c.cargueiros || '', 'min="0"')}</label>
    </div><p class="pequeno mut" style="margin:8px 2px 0">Base do jogo: 500 por mercante. Com melhorias de porão, ponha o seu valor.</p></div>
  <div class="card"><h3><span class="ic-q">🔔</span>Alarmes</h3>
    <div class="lista" style="gap:8px">${sw('som', c.som, 'Som de corneta')}${sw('voz', c.voz, 'Voz em português')}${sw('vibrar', c.vibrar, 'Vibrar')}</div>
    <label class="campo" style="margin-top:10px"><span>Aviso antes do fim (min, 0 = desligado)</span>${campoNum('avisoMin', c.avisoMin, 'min="0" max="120"')}</label>
    <button class="btn bloco" style="margin-top:10px" data-testar>🎺 Testar alarme</button>
  </div>
  <div class="card"><h3><span class="ic-q">🎨</span>Aparência</h3>
    <div class="seg" style="margin:0"><button class="${c.tema !== 'papiro' ? 'ativo' : ''}" data-tema="escuro">🌙 Egeu noturno</button><button class="${c.tema === 'papiro' ? 'ativo' : ''}" data-tema="papiro">📜 Papiro</button></div>
    <div style="margin-top:10px">${sw('mostrarRaras', c.mostrarRaras, 'Mostrar unidades pouco usadas', 'Lanceiro, Arqueiro, Fundibulário, Catapulta, Barco Balista')}</div>
  </div>`;
  raiz.addEventListener('change', e => {
    const t = e.target; if (!t.name || !(t.name in c)) return;
    const val = t.type === 'checkbox' ? t.checked : t.type === 'number' ? (t.value === '' ? 0 : +t.value) : t.value;
    store.set(s => { s.config[t.name] = val; });
  });
  raiz.addEventListener('click', e => {
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
