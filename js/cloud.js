// =====================================================================
// NUVEM (Firebase): login com Google, cópia do seu império na nuvem,
// sincronização entre celular e PC, e dados compartilhados da aliança.
// O SDK só é baixado quando você entra: sem login o app é 100% local.
// =====================================================================
import * as store from './store.js';
import { firebaseConfig, FIREBASE_VERSAO, EMAIL_DONO } from './config.js';
import { folha, esc } from './folha.js';
import { toast, fmtQuando } from './ui.js';

const BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSAO}`;
const FLAG = 'ikariam_v2_logado';
let fb = null;
const ouvintes = new Set();
const assinaturas = {}; // coleção → { lista, unsub }
let unsubSave = null, unsubPerfil = null, timerEnvio = null;

const estado = { carregando: false, usuario: null, perfil: null, online: navigator.onLine, sincronizando: false, erro: null, pendentes: 0, ultimoEnvio: 0 };
const avisar = () => ouvintes.forEach(f => { try { f(estado); } catch (e) { console.error(e); } });

async function sdk() {
  if (fb) return fb;
  const [A, Au, F] = await Promise.all([import(`${BASE}/firebase-app.js`), import(`${BASE}/firebase-auth.js`), import(`${BASE}/firebase-firestore.js`)]);
  const app = A.initializeApp(firebaseConfig);
  const auth = Au.getAuth(app);
  let db;
  try { db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
  catch { db = F.getFirestore(app); }
  fb = { app, auth, db, Au, F };
  Au.onAuthStateChanged(auth, u => aoMudarUsuario(u));
  return fb;
}

const ehDono = u => !!u && String(u.email || '').toLowerCase() === EMAIL_DONO.toLowerCase();

function papel() {
  if (!estado.usuario) return 'nenhum';
  if (ehDono(estado.usuario)) return 'admin';
  return estado.perfil?.papel || 'pendente';
}

async function aoMudarUsuario(u) {
  estado.usuario = u ? { uid: u.uid, nome: u.displayName || u.email, email: u.email, photoURL: u.photoURL } : null;
  estado.erro = null;
  limparAssinaturas();
  if (!u) { estado.perfil = null; localStorage.setItem(FLAG, '0'); avisar(); return; }
  localStorage.setItem(FLAG, '1');
  avisar();
  try { await garantirPerfil(u); } catch (e) { console.warn('perfil', e); estado.erro = traduzir(e); }
  try { await sincronizar(); } catch (e) { console.warn('sync', e); estado.erro = traduzir(e); }
  ouvirSave();
  if (papel() === 'admin') assinar('usuarios');
  avisar();
}

async function garantirPerfil(u) {
  const { db, F } = fb;
  const ref = F.doc(db, 'usuarios', u.uid);
  const snap = await F.getDoc(ref);
  const base = { nome: u.displayName || u.email, email: u.email, foto: u.photoURL || '', ultimoAcesso: F.serverTimestamp() };
  if (!snap.exists()) await F.setDoc(ref, { ...base, papel: ehDono(u) ? 'admin' : 'pendente', criadoEm: F.serverTimestamp() });
  else await F.setDoc(ref, base, { merge: true });
  unsubPerfil = F.onSnapshot(ref, s => { estado.perfil = s.exists() ? s.data() : null; avisar(); });
}

// ---------- Sincronização do império ----------
const semMeta = s => { const { ultimoSync, ...resto } = s; return resto; };

async function sincronizar() {
  if (!estado.usuario || !navigator.onLine) return;
  const { db, F } = fb;
  estado.sincronizando = true; avisar();
  try {
    const snap = await F.getDoc(F.doc(db, 'saves', estado.usuario.uid));
    const local = store.get();
    if (!snap.exists()) { await enviar(true); return; }
    const nuvem = snap.data();
    const tsN = nuvem.atualizadoEm || 0, tsL = local.atualizadoEm || 0, base = local.ultimoSync || 0;
    const localVazio = !local.cidades.length && !local.alvos.length && !local.timers.length;
    if (tsN === tsL) { marcarSync(tsN); return; }
    if (localVazio || (tsN > tsL && tsL <= base)) { aplicarNuvem(nuvem); return; }
    if (tsL > tsN && tsN <= base) { await enviar(true); return; }
    await resolverConflito(nuvem); // os dois mudaram desde o último encontro
  } finally { estado.sincronizando = false; avisar(); }
}

function aplicarNuvem(nuvem) {
  try {
    const dados = JSON.parse(nuvem.dados);
    dados.ultimoSync = nuvem.atualizadoEm;
    dados.atualizadoEm = nuvem.atualizadoEm;
    store.substituir(dados, 'nuvem');
    toast('☁️ Império atualizado da nuvem', 'ok');
  } catch (e) { console.error(e); }
}

function marcarSync(ts) { store.set(s => { s.ultimoSync = ts; }, 'nuvem'); }

function resolverConflito(nuvem) {
  return new Promise(res => {
    const local = store.get();
    let escolha = null;
    const f = folha({
      titulo: 'Qual versão manter?', sub: 'O aparelho e a nuvem mudaram separados',
      html: `<p class="fl-texto">📱 Este aparelho: alterado ${esc(fmtQuando(local.atualizadoEm))}<br>☁️ Nuvem: alterada ${esc(fmtQuando(nuvem.atualizadoEm))}</p>
        <div class="fl-botoes"><button class="btn" data-v="local">📱 Manter este</button><button class="btn ouro" data-v="nuvem">☁️ Usar a nuvem</button></div>
        <p class="pequeno mut" style="margin-top:10px">A versão que você não escolher é substituída. Se ficar em dúvida, faça um backup antes em Sistema › Backup.</p>`,
      aoFechar: async () => {
        if (escolha === 'nuvem') aplicarNuvem(nuvem);
        else if (escolha === 'local') await enviar(true);
        res();
      },
    });
    f.corpo.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { escolha = b.dataset.v; f.fechar(); } });
  });
}

async function enviar(forcar = false) {
  if (!estado.usuario || !fb || !navigator.onLine) return;
  const { db, F } = fb;
  const s = store.get();
  if (!forcar && s.atualizadoEm === s.ultimoSync) return;
  estado.sincronizando = true; avisar();
  try {
    await F.setDoc(F.doc(db, 'saves', estado.usuario.uid), {
      dados: JSON.stringify(semMeta(s)), atualizadoEm: s.atualizadoEm, em: F.serverTimestamp(), versao: s.versao,
    });
    estado.ultimoEnvio = Date.now(); estado.erro = null;
    marcarSync(s.atualizadoEm);
  } catch (e) { console.warn('enviar', e); estado.erro = traduzir(e); }
  finally { estado.sincronizando = false; avisar(); }
}

// Mudanças vindas de outro aparelho em tempo real
function ouvirSave() {
  const { db, F } = fb;
  unsubSave = F.onSnapshot(F.doc(db, 'saves', estado.usuario.uid), snap => {
    if (!snap.exists() || snap.metadata.hasPendingWrites) return;
    const n = snap.data();
    const s = store.get();
    if ((n.atualizadoEm || 0) > (s.atualizadoEm || 0) && s.atualizadoEm <= (s.ultimoSync || 0)) aplicarNuvem(n);
  }, e => console.warn('ouvirSave', e));
}

// ---------- Coleções da aliança ----------
function assinar(col, ordem = null) {
  if (!fb || !estado.usuario) return [];
  if (assinaturas[col]) return assinaturas[col].lista;
  const { db, F } = fb;
  const reg = { lista: [], carregado: false, erro: null, unsub: null };
  assinaturas[col] = reg;
  const q = ordem ? F.query(F.collection(db, col), F.orderBy(ordem.campo, ordem.dir || 'asc')) : F.collection(db, col);
  reg.unsub = F.onSnapshot(q, snap => {
    reg.lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    reg.carregado = true; reg.erro = null;
    if (col === 'usuarios') estado.pendentes = reg.lista.filter(u => u.papel === 'pendente').length;
    avisar();
  }, e => { reg.erro = traduzir(e); reg.carregado = true; avisar(); });
  return reg.lista;
}

function limparAssinaturas() {
  Object.values(assinaturas).forEach(r => r.unsub && r.unsub());
  Object.keys(assinaturas).forEach(k => delete assinaturas[k]);
  unsubSave && unsubSave(); unsubSave = null;
  unsubPerfil && unsubPerfil(); unsubPerfil = null;
  estado.pendentes = 0;
}

async function salvarDoc(col, id, dados) {
  const { db, F } = fb;
  dados = JSON.parse(JSON.stringify(dados)); // tira campos vazios (undefined) que o Firestore recusa
  const extra = { atualizadoEm: F.serverTimestamp(), autorUid: estado.usuario.uid, autorNome: estado.usuario.nome };
  if (id) await F.setDoc(F.doc(db, col, id), { ...dados, ...extra }, { merge: true });
  else { const r = await F.addDoc(F.collection(db, col), { ...dados, ...extra, criadoEm: F.serverTimestamp() }); return r.id; }
  return id;
}
async function apagarDoc(col, id) { const { db, F } = fb; await F.deleteDoc(F.doc(db, col, id)); }
async function definirPapel(uid, novo) { const { db, F } = fb; await F.updateDoc(F.doc(db, 'usuarios', uid), { papel: novo }); }

function traduzir(e) {
  const c = e?.code || '';
  if (c.includes('permission-denied')) return 'Sem permissão (confira as regras do Firestore ou aguarde aprovação do líder).';
  if (c.includes('unauthorized-domain')) return 'Este endereço não está autorizado no Firebase (Authentication › Configurações › Domínios autorizados).';
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return 'Login cancelado.';
  if (c.includes('network') || c.includes('unavailable')) return 'Sem conexão com a nuvem agora.';
  if (c.includes('operation-not-allowed')) return 'Ative o login do Google no Firebase (Authentication › Método de login).';
  if (/dynamically imported module|Failed to fetch|Load failed/i.test(e?.message || '')) return 'Não consegui baixar o Firebase agora (sem internet?).';
  return e?.message || String(e);
}

// ---------- API usada pelas telas ----------
export const cloud = {
  estado,
  on: fn => { ouvintes.add(fn); return () => ouvintes.delete(fn); },
  papel,
  ehDono: () => ehDono(estado.usuario),
  async iniciar() {
    if (localStorage.getItem(FLAG) === '1' && navigator.onLine) {
      estado.carregando = true; avisar();
      try { await sdk(); } catch (e) { estado.erro = 'Não deu para carregar o Firebase (sem internet?).'; }
      estado.carregando = false; avisar();
    }
  },
  async entrar() {
    estado.carregando = true; estado.erro = null; avisar();
    try {
      const { auth, Au } = await sdk();
      const prov = new Au.GoogleAuthProvider();
      prov.setCustomParameters({ prompt: 'select_account' });
      try { await Au.signInWithPopup(auth, prov); }
      catch (e) {
        if (/popup-blocked|operation-not-supported|web-storage/.test(e.code || '')) await Au.signInWithRedirect(auth, prov);
        else throw e;
      }
    } catch (e) { estado.erro = traduzir(e); toast(estado.erro, 'erro'); }
    finally { estado.carregando = false; avisar(); }
  },
  async sair() {
    if (!fb) return;
    await enviar();
    await fb.Au.signOut(fb.auth);
    toast('Você saiu. Os dados continuam neste aparelho.');
  },
  agendarEnvio() {
    if (!estado.usuario) return;
    clearTimeout(timerEnvio);
    timerEnvio = setTimeout(() => enviar(), 2500);
  },
  sincronizarAgora: async () => { await sincronizar(); toast('☁️ Sincronizado', 'ok'); },
  aoVoltarOnline() { estado.online = true; if (estado.usuario) sincronizar().catch(() => {}); avisar(); },
  lista: (col, ordem) => assinar(col, ordem),
  // Lê o save antigo da v1 (imperial_saves/dados_imperiais) para migrar
  async lerLegadoV1() {
    const { db, F } = await sdk();
    const snap = await F.getDoc(F.doc(db, 'imperial_saves', 'dados_imperiais'));
    if (!snap.exists()) throw new Error('Não achei o save da v1 na nuvem');
    return snap.data();
  },
  info: col => assinaturas[col] || { lista: [], carregado: false },
  salvar: salvarDoc,
  apagar: apagarDoc,
  definirPapel,
  traduzir,
};

window.addEventListener('offline', () => { estado.online = false; avisar(); });
