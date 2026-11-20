// =====================================================================
// ESTADO DO APP — um objeto só, salvo no aparelho (localStorage)
// e espelhado na nuvem quando você entra com o Google.
// =====================================================================
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
      mostrarRaras: false, oligarquia: false, milagres: {}, nomeJogador: '', servidor: '', modoGuerra: false,
    },
    ultimoSync: 0,
  };
}

export function novaCidade(dados = {}) {
  return {
    id: novoId(), nome: '', coords: '', papel: '', capital: false,
    vinho: { estoque: null, consumo: null, em: null },
    alarme: false, residencia: null,
    habitantes: { atual: null, max: null, satisfacao: null, em: null },
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
    n.habitantes = { atual: null, max: null, satisfacao: null, em: null, ...(c.habitantes || {}) };
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
