// =====================================================================
// ESTADO DO APP — um objeto só, salvo no aparelho (localStorage)
// e espelhado na nuvem quando você entra com o Google.
// =====================================================================
import { UNIDADES, APELIDOS } from './data.js';

const CHAVE = 'ikariam_v2_state';
const ouvintes = new Set();

export const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function estadoVazio() {
  return {
    versao: 2,
    atualizadoEm: 0,
    cidades: [],
    timers: [],
    alvos: [],
    notas: { pesquisas: '', diplomacia: '', livre: '' },
    abissal: [],
    config: {
      capMercante: 500, capCargueiro: 50000, mercantes: 0, cargueiros: 0,
      tema: 'escuro', som: true, voz: true, vibrar: true, avisoMin: 5,
      mostrarRaras: false, oligarquia: false, milagres: {}, nomeJogador: '', servidor: '',
    },
    ultimoSync: 0,
  };
}

export function novaCidade(dados = {}) {
  return {
    id: novoId(), nome: '', coords: '', papel: '', capital: false,
    vinho: { estoque: null, consumo: null, em: null },
    alarme: false, residencia: null,
    militar: { fora: false, unidades: {} },
    movel: { ativa: false, checklist: {} },
    barbaros: { nivel: 1, vitorias: 0, muralha: false },
    notas: '',
    ...dados,
  };
}

export function novoAlvo(dados = {}) {
  return {
    id: novoId(), nome: '', alianca: '', coords: '', muralha: null, cozinheiros: null,
    recursos: {}, saquePct: 100, unidades: {}, notas: '', relatorioEm: null, atualizadoEm: Date.now(),
    ...dados,
  };
}

// Completa campos que faltarem (estado salvo por versões antigas)
function normalizar(s) {
  const base = estadoVazio();
  const out = { ...base, ...s, config: { ...base.config, ...(s?.config || {}) }, notas: { ...base.notas, ...(s?.notas || {}) } };
  out.cidades = (out.cidades || []).map(c => {
    const n = novaCidade(c);
    n.vinho = { estoque: null, consumo: null, em: null, ...(c.vinho || {}) };
    n.militar = { fora: false, unidades: {}, ...(c.militar || {}) };
    n.movel = { ativa: false, checklist: {}, ...(c.movel || {}) };
    n.barbaros = { nivel: 1, vitorias: 0, muralha: false, ...(c.barbaros || {}) };
    return n;
  });
  out.alvos = (out.alvos || []).map(a => novoAlvo(a));
  out.timers = (out.timers || []).filter(t => t && t.fim);
  out.abissal = Array.isArray(out.abissal) ? out.abissal : [];
  return out;
}

let estado = carregar();

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) return normalizar(JSON.parse(bruto));
  } catch (e) { console.warn('Estado inválido, começando do zero', e); }
  return estadoVazio();
}

export const get = () => estado;

// Altera o estado com uma função e salva. origem: 'local' | 'nuvem' | 'timer'
export function set(fn, origem = 'local') {
  const r = fn(estado);
  if (r && r !== estado) estado = r;
  if (origem === 'local') estado.atualizadoEm = Date.now(); // 'timer' e 'nuvem' não contam como edição
  salvar();
  ouvintes.forEach(f => { try { f(estado, origem); } catch (e) { console.error(e); } });
}

export function substituir(novo, origem = 'nuvem') {
  estado = normalizar(novo);
  salvar();
  ouvintes.forEach(f => { try { f(estado, origem); } catch (e) { console.error(e); } });
}

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); }
  catch (e) { console.error('Não consegui salvar no aparelho', e); }
}

export const on = fn => { ouvintes.add(fn); return () => ouvintes.delete(fn); };

export const cidade = id => estado.cidades.find(c => c.id === id);

// ---------- Backup ----------
export const exportarJSON = () => JSON.stringify({ app: 'ikariam-v2', ...estado }, null, 2);

// Código de backup curto para colar no WhatsApp: "IKV2." + base64 (comprimido quando o celular deixa)
export async function gerarCodigo() {
  const json = JSON.stringify(estado);
  const bytes = new TextEncoder().encode(json);
  if ('CompressionStream' in window) {
    const s = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
    const comp = new Uint8Array(await new Response(s).arrayBuffer());
    return 'IKV2Z.' + paraBase64(comp);
  }
  return 'IKV2.' + paraBase64(bytes);
}

export async function lerCodigo(txt) {
  const t = String(txt || '').trim().replace(/\s+/g, '');
  let json;
  if (t.startsWith('IKV2Z.')) {
    const bytes = deBase64(t.slice(6));
    const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    json = await new Response(s).text();
  } else if (t.startsWith('IKV2.')) {
    json = new TextDecoder().decode(deBase64(t.slice(5)));
  } else if (t.startsWith('{')) {
    json = t;
  } else throw new Error('Código não reconhecido');
  return JSON.parse(json);
}

function paraBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function deBase64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

// Aceita backup da v2, ou o JSON exportado pela v1 (chaves ikariam_*)
export function importarQualquer(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('Arquivo vazio');
  // depois de importar, marca como alteração nova para a nuvem receber esta versão
  if (obj.versao === 2 || obj.app === 'ikariam-v2') { const { app, ...resto } = obj; substituir(resto, 'local'); set(() => {}); return 'v2'; }
  const v1 = obj.ikariam_cidades_v2 !== undefined ? obj : (obj.dados || obj.payloadJson ? (typeof obj.payloadJson === 'string' ? JSON.parse(obj.payloadJson) : obj.dados) : null);
  if (v1 && v1.ikariam_cidades_v2 !== undefined) { substituir(converterV1(v1), 'local'); set(() => {}); return 'v1'; }
  throw new Error('Formato não reconhecido');
}

const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export function idPorNomeUnidade(nome) {
  const n = semAcento(nome).replace(/-/g, ' ');
  const u = UNIDADES.find(x => semAcento(x.nome).replace(/-/g, ' ') === n);
  return u ? u.id : APELIDOS[n] || null;
}

function lerV1(v1, chave, padrao) {
  const v = v1[chave];
  if (v == null) return padrao;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return v; }
}

export function converterV1(v1) {
  const s = estadoVazio();
  const cidades = lerV1(v1, 'ikariam_cidades_v2', []) || [];
  const taberna = lerV1(v1, 'ikariam_taberna', null);
  s.cidades = cidades.map(c => {
    const nova = novaCidade({ nome: c.nome || c.id, coords: c.coords || '', capital: !!c.capital, papel: c.capital ? 'capital' : '' });
    const ex = lerV1(v1, 'ikariam_exercito_' + c.id, []) || [];
    for (const u of ex) { const id = idPorNomeUnidade(u.nome); if (id && u.qtd > 0) nova.militar.unidades[id] = (nova.militar.unidades[id] || 0) + (+u.qtd || 0); }
    const res = lerV1(v1, 'ikariam_res_' + c.id, null);
    if (res?.vinho?.atual != null && c.capital && taberna?.consumo) nova.vinho = { estoque: +res.vinho.atual, consumo: +taberna.consumo, em: Date.now() };
    const lvl = lerV1(v1, 'ikariam_viking_lvl_' + c.id, null);
    if (lvl) nova.barbaros.nivel = +lvl || 1;
    return nova;
  });
  const alvos = lerV1(v1, 'ikariam_alvos_espiao', []) || [];
  s.alvos = alvos.map(a => novoAlvo({ nome: a.nome || '', coords: a.coords || '', notas: [a.notas, a.armazem ? `armazém (v1): ${a.armazem}` : ''].filter(Boolean).join(' · ') }));
  const notas = lerV1(v1, 'ikariam_notas', '');
  if (typeof notas === 'string') s.notas.livre = notas;
  const pesq = lerV1(v1, 'ikariam_pesq', null);
  if (pesq) s.notas.pesquisas = typeof pesq === 'string' ? pesq : JSON.stringify(pesq);
  const timers = lerV1(v1, 'ikariam_timers', []) || [];
  s.timers = timers.filter(t => t.termino > Date.now()).map(t => ({ id: novoId(), nome: t.nome, icone: '⏱️', fim: t.termino, duracao: t.duracaoTotal || 0, alertado: false }));
  // frota e capacidades que estavam fixas na v1 (dá para mudar em Sistema)
  Object.assign(s.config, { mercantes: 230, cargueiros: 28, capMercante: 600, capCargueiro: 52000 });
  return s;
}
