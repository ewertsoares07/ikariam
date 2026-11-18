// =====================================================================
// LEITOR DE TEXTO COLADO DO JOGO
// Você copia a tela (relatório de espionagem, relatório de batalha, tropas
// da cidade) e cola aqui. O leitor procura nomes de recursos/unidades e o
// número mais próximo. Funciona com "Madeira: 12.345", tabelas e linhas soltas.
// =====================================================================
import { UNIDADES, APELIDOS, RECURSOS } from './data.js';

const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// "12.345" "12,345" "12 345" "1.2k" "3M" → número
export function lerNumero(txt) {
  if (txt == null) return null;
  let t = String(txt).trim().toLowerCase().replace(/\s/g, '');
  const mult = t.endsWith('k') ? 1e3 : t.endsWith('m') ? 1e6 : 1;
  if (mult > 1) t = t.slice(0, -1);
  if (mult > 1 && /^\d+[.,]\d+$/.test(t)) return Math.round(parseFloat(t.replace(',', '.')) * mult);
  t = t.replace(/[.,](?=\d{3}(\D|$))/g, '');
  const n = parseFloat(t.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * mult) : null;
}

const NUM = String.raw`(\d{1,3}(?:[.,\s]\d{3})+|\d+(?:[.,]\d+)?\s*[kKmM]?)`;

function procurar(texto, nomes) {
  // nome seguido de número (até 40 caracteres de distância, pode quebrar linha)
  for (const nome of nomes) {
    const re = new RegExp(`(?:^|[^a-z])${nome.replace(/[-\s]+/g, '[-\\s]+')}s?(?:[^a-z0-9]{0,40}?)${NUM}`, 'i');
    const m = texto.match(re);
    if (m) return lerNumero(m[1]);
  }
  return null;
}

const NOMES_RECURSO = {
  madeira: ['madeira', 'material de construcao', 'wood'],
  vinho: ['vinho', 'wine'],
  marmore: ['marmore', 'marble'],
  cristal: ['cristal', 'vidro de cristal', 'crystal', 'vidro'],
  enxofre: ['enxofre', 'sulfur', 'sulphur'],
  ouro: ['ouro', 'gold'],
};

export function lerRecursos(texto) {
  const t = semAcento(texto);
  const out = {};
  for (const r of [...RECURSOS.map(r => r.id), 'ouro']) {
    const v = procurar(t, NOMES_RECURSO[r]);
    if (v != null) out[r] = v;
  }
  return out;
}

// Tabela copiada (nomes numa linha, números na de baixo, separados por TAB)
function lerTabela(texto, mapaNome) {
  const linhas = String(texto).split(/\r?\n/).map(l => l.split('\t').map(c => c.trim()));
  const out = {};
  for (let i = 0; i < linhas.length - 1; i++) {
    const ids = linhas[i].map(c => mapaNome(c));
    if (ids.filter(Boolean).length < 2) continue;
    const nums = linhas[i + 1].map(lerNumero);
    ids.forEach((id, k) => { if (id && nums[k] != null) out[id] = (out[id] || 0) + nums[k]; });
  }
  return out;
}

function idUnidade(nome) {
  const n = semAcento(nome).replace(/-/g, ' ').trim().replace(/s$/, '');
  if (!n) return null;
  const u = UNIDADES.find(x => semAcento(x.nome).replace(/-/g, ' ') === n || semAcento(x.nome).replace(/-/g, ' ') + 's' === n + 's');
  return u ? u.id : APELIDOS[n] || APELIDOS[n + 's'] || null;
}

export function lerUnidades(texto) {
  const tab = lerTabela(texto, idUnidade);
  if (Object.keys(tab).length) return tab;
  const t = semAcento(texto);
  const out = {};
  // nomes mais longos primeiro (ex.: "aríete a vapor" antes de "aríete")
  const pares = [
    ...UNIDADES.map(u => [semAcento(u.nome).replace(/-/g, ' '), u.id]),
    ...Object.entries(APELIDOS),
  ].sort((a, b) => b[0].length - a[0].length);
  let resto = t.replace(/-/g, ' ');
  for (const [nome, id] of pares) {
    const re = new RegExp(`(?:^|[^a-z])(${nome.replace(/\s+/g, '\\s+')})s?(?:[^a-z0-9]{0,30}?)${NUM}`, 'i');
    const m = resto.match(re);
    if (m && out[id] == null) {
      const v = lerNumero(m[2]);
      if (v != null) out[id] = v;
      resto = resto.replace(m[0], ' ');
    }
  }
  return out;
}

export function lerMuralha(texto) {
  const m = semAcento(texto).match(/muralha[^0-9]{0,25}(\d{1,2})/);
  return m ? +m[1] : null;
}

export function lerCoordsTexto(texto) {
  const m = String(texto || '').match(/\[?\s*(\d{1,3})\s*:\s*(\d{1,3})\s*\]?/);
  return m ? `${m[1]}:${m[2]}` : null;
}

// Junta tudo: usado no "Colar relatório" dos Alvos
export function lerRelatorio(texto) {
  return {
    recursos: lerRecursos(texto),
    unidades: lerUnidades(texto),
    muralha: lerMuralha(texto),
    coords: lerCoordsTexto(texto),
    cozinheiros: /cozinheir/i.test(semAcento(texto)) ? true : null,
  };
}
