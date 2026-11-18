import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../firebase';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize analytics safely only when supported by the browser
if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    })
    .catch(() => {});
}

const SAVE_COLLECTION = 'imperial_saves';
const SAVE_DOC_ID = 'dados_imperiais';

export function collectImperialLocalStorage(): Record<string, string> {
  const dados: Record<string, string> = {};
  if (typeof localStorage === 'undefined') return dados;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('ikariam_') || k.startsWith('tema_'))) {
      const val = localStorage.getItem(k);
      if (val !== null) dados[k] = val;
    }
  }
  return dados;
}

export async function saveImperialDataToFirebase(): Promise<{ savedAtText: string; savedAtIso: string }> {
  const dados = collectImperialLocalStorage();
  const totalChaves = Object.keys(dados).length;
  const agoraIso = new Date().toISOString();
  const agoraHora = new Date().toLocaleTimeString('pt-BR');

  const payload = {
    payloadJson: JSON.stringify(dados),
    totalChaves,
    atualizadoEm: agoraIso,
    atualizadoEmTexto: agoraHora,
    origem: 'Ikariam Painel Imperial PWA',
  };

  await setDoc(doc(db, SAVE_COLLECTION, SAVE_DOC_ID), payload, { merge: true });
  return { savedAtText: agoraHora, savedAtIso: agoraIso };
}

export interface FirebaseLoadResult {
  exists: boolean;
  dataMap?: Record<string, string>;
  updatedText?: string;
}

export async function loadImperialDataFromFirebase(): Promise<FirebaseLoadResult> {
  const docRef = doc(db, SAVE_COLLECTION, SAVE_DOC_ID);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return { exists: false };
  }
  const data = snap.data();
  if (!data || !data.payloadJson) {
    return { exists: true, dataMap: {} };
  }
  const parsed = JSON.parse(data.payloadJson) as Record<string, string>;
  return {
    exists: true,
    dataMap: parsed,
    updatedText: data.atualizadoEmTexto || new Date().toLocaleTimeString('pt-BR'),
  };
}
