import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_GLOBAL_GOLD,
  DEFAULT_SPYC_ARMY,
  getDefaultBuildGoals,
  getDefaultBuildQueue,
  getDefaultCityResources,
  getDefaultRadarMissions,
  getDefaultSpyTargets,
  INITIAL_CITIES,
  normalizeArmyList,
} from '../data/gameData';
import {
  AdvisorType,
  AlarmSoundType,
  ArmyUnit,
  BuildGoal,
  BuildQueueItem,
  City,
  CityResources,
  CloudSyncStatus,
  HudAlert,
  PesquisaData,
  PrefillRoutePayload,
  RadarMission,
  ResourceKey,
  SpyTarget,
  TabernaData,
  TabId,
  ThemeMode,
  TickerMode,
  WarTimer,
  WineUrgencyItem,
} from '../types/ikariam';
import { playClickWrapper, playConfiguredAlarmSafe } from '../utils/contextHelpers';
import { computeWineUrgencyRanking } from '../utils/calculations';
import { speakAlertPTBR } from '../services/audioService';
import { loadImperialDataFromFirebase, saveImperialDataToFirebase } from '../services/firebaseService';
import {
  getNotificationPermission,
  requestSystemNotificationPermission,
  sendSystemNotification,
  SystemNotificationPermission,
} from '../services/notificationService';

const VALID_TABS: TabId[] = [
  'inicio',
  'edificios',
  'recursos',
  'militar',
  'vikings',
  'simulador',
  'pirataria',
  'espionagem',
  'calculadoras',
  'notas',
];

function readJsonLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getInitialTabFromURL(): TabId {
  try {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabId | null;
    if (tab && VALID_TABS.includes(tab)) {
      return tab;
    }
  } catch {
    // ignore
  }
  return 'inicio';
}

function loadAllResourcesMap(cities: City[]): Record<string, CityResources> {
  const map: Record<string, CityResources> = {};
  cities.forEach((c) => {
    const saved = readJsonLS<Partial<CityResources>>('ikariam_res_' + c.id, {});
    const def = getDefaultCityResources(c.id);
    map[c.id] = {
      madeira: { ...def.madeira, ...(saved.madeira || {}) },
      vinho: { ...def.vinho, ...(saved.vinho || {}) },
      marmore: { ...def.marmore, ...(saved.marmore || {}) },
      cristal: { ...def.cristal, ...(saved.cristal || {}) },
      enxofre: { ...def.enxofre, ...(saved.enxofre || {}) },
    };
  });
  return map;
}

function loadAllArmiesMap(cities: City[]): Record<string, ArmyUnit[]> {
  const map: Record<string, ArmyUnit[]> = {};
  cities.forEach((c) => {
    const raw = readJsonLS<ArmyUnit[] | null>('ikariam_exercito_' + c.id, null);
    const base = raw !== null ? raw : c.id === 'SPYC' ? DEFAULT_SPYC_ARMY : [];
    map[c.id] = normalizeArmyList(base);
  });
  return map;
}

function loadAllVikingLevels(cities: City[]): Record<string, number> {
  const map: Record<string, number> = {};
  cities.forEach((c) => {
    const val = parseInt(localStorage.getItem('ikariam_viking_lvl_' + c.id) || '', 10);
    map[c.id] = !isNaN(val) && val >= 1 ? val : 10;
  });
  return map;
}

interface ImperialContextValue {
  now: number;
  activeTab: TabId;
  tabTransitionDir: 'left' | 'right' | 'none';
  tabChangeSeq: number;
  setActiveTab: (tab: TabId) => void;
  cities: City[];
  activeCityId: string;
  setActiveCityId: (id: string) => void;
  activeCity: City;
  addCity: (nome: string, coords: string) => void;
  resourcesMap: Record<string, CityResources>;
  updateCityResource: (cityId: string, res: ResourceKey, field: 'atual' | 'max' | 'prod', value: number) => void;
  armiesMap: Record<string, ArmyUnit[]>;
  updateCityArmy: (cityId: string, list: ArmyUnit[]) => void;
  timers: WarTimer[];
  addTimer: (nome: string, duracaoSegundos: number) => void;
  removeTimer: (id: number) => void;
  obrasFila: BuildQueueItem[];
  addObra: (cidadeId: string, edificio: string, nivelAlvo: number, duracaoSeg: number) => void;
  removeObra: (id: number) => void;
  metasEdificios: BuildGoal[];
  addMeta: (goal: Omit<BuildGoal, 'id'>) => void;
  removeMeta: (id: number) => void;
  radarMissions: RadarMission[];
  addRadarMission: (alvo: string, tipo: string, minutos: number, navios: number) => void;
  removeRadarMission: (id: number) => void;
  spyTargets: SpyTarget[];
  upsertSpyTarget: (target: Omit<SpyTarget, 'id'>) => void;
  removeSpyTarget: (id: number) => void;
  vikingLevels: Record<string, number>;
  setVikingLevel: (cityId: string, level: number) => void;
  taberna: TabernaData;
  setTabernaData: (data: TabernaData) => void;
  pesquisa: PesquisaData;
  setPesquisaData: (data: PesquisaData) => void;
  globalGold: number;
  setGlobalGold: (val: number) => void;
  notes: string;
  setNotes: (val: string) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  audioMuted: boolean;
  toggleAudioMuted: () => void;
  alarmSound: AlarmSoundType;
  setAlarmSound: (s: AlarmSoundType) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (v: boolean) => void;
  liveProdActive: boolean;
  setLiveProdActive: (v: boolean) => void;
  tickerMode: TickerMode;
  toggleTickerMode: () => void;
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (v: boolean) => void;
  cloudStatus: CloudSyncStatus;
  cloudStatusText: string;
  syncNowToCloud: (manual?: boolean) => Promise<void>;
  pullFromCloud: (manual?: boolean) => Promise<void>;
  hudAlert: HudAlert | null;
  dismissHudAlert: () => void;
  showHudAlert: (titulo: string, desc: string, icone?: string) => void;
  notificationPermission: SystemNotificationPermission;
  requestNotifications: () => Promise<void>;
  activeAdvisor: AdvisorType | null;
  setActiveAdvisor: (adv: AdvisorType | null) => void;
  panoramaOpen: boolean;
  setPanoramaOpen: (open: boolean) => void;
  newCityModalOpen: boolean;
  setNewCityModalOpen: (open: boolean) => void;
  soundboardOpen: boolean;
  setSoundboardOpen: (open: boolean) => void;
  wineUrgencyList: WineUrgencyItem[];
  prefillRoute: PrefillRoutePayload | null;
  triggerPrefillRoute: (payload: Omit<PrefillRoutePayload, 'timestamp'>) => void;
  accordionSignal: { mode: 'expand' | 'collapse'; seq: number };
  triggerAccordionAll: (mode: 'expand' | 'collapse') => void;
  resetAllData: () => void;
  reloadFromLocalStorage: () => void;
}

const ImperialContext = createContext<ImperialContextValue | null>(null);

export const ImperialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [now, setNow] = useState<number>(() => Date.now());
  const [activeTab, setActiveTabState] = useState<TabId>(getInitialTabFromURL);
  const [tabTransitionDir, setTabTransitionDir] = useState<'left' | 'right' | 'none'>('none');
  const [tabChangeSeq, setTabChangeSeq] = useState<number>(0);

  const [cities, setCities] = useState<City[]>(() => readJsonLS<City[]>('ikariam_cidades_v2', INITIAL_CITIES));
  const [activeCityId, setActiveCityIdState] = useState<string>(() => {
    const saved = localStorage.getItem('ikariam_cidade_ativa');
    return saved || 'SPYC';
  });

  const [resourcesMap, setResourcesMap] = useState<Record<string, CityResources>>(() =>
    loadAllResourcesMap(readJsonLS<City[]>('ikariam_cidades_v2', INITIAL_CITIES))
  );
  const [armiesMap, setArmiesMap] = useState<Record<string, ArmyUnit[]>>(() =>
    loadAllArmiesMap(readJsonLS<City[]>('ikariam_cidades_v2', INITIAL_CITIES))
  );
  const [vikingLevels, setVikingLevels] = useState<Record<string, number>>(() =>
    loadAllVikingLevels(readJsonLS<City[]>('ikariam_cidades_v2', INITIAL_CITIES))
  );

  const [timers, setTimers] = useState<WarTimer[]>(() => readJsonLS<WarTimer[]>('ikariam_timers', []));
  const [obrasFila, setObrasFila] = useState<BuildQueueItem[]>(() =>
    readJsonLS<BuildQueueItem[]>('ikariam_obras_v2', getDefaultBuildQueue())
  );
  const [metasEdificios, setMetasEdificios] = useState<BuildGoal[]>(() =>
    readJsonLS<BuildGoal[]>('ikariam_metas_v2', getDefaultBuildGoals())
  );
  const [radarMissions, setRadarMissions] = useState<RadarMission[]>(() =>
    readJsonLS<RadarMission[]>('ikariam_missoes_radar', getDefaultRadarMissions())
  );
  const [spyTargets, setSpyTargets] = useState<SpyTarget[]>(() =>
    readJsonLS<SpyTarget[]>('ikariam_alvos_espiao', getDefaultSpyTargets())
  );
  const [taberna, setTabernaState] = useState<TabernaData>(() =>
    readJsonLS<TabernaData>('ikariam_taberna', { nivel: 12, consumo: 60 })
  );
  const [pesquisa, setPesquisaState] = useState<PesquisaData>(() =>
    readJsonLS<PesquisaData>('ikariam_pesq', { nome: 'Pesquisa Militar', total: 28000, prod: 240 })
  );
  const [globalGold, setGlobalGoldState] = useState<number>(() => {
    const saved = parseFloat(localStorage.getItem('ikariam_ouro_global') || '');
    return Number.isFinite(saved) ? saved : DEFAULT_GLOBAL_GOLD;
  });
  const [notes, setNotesState] = useState<string>(() => localStorage.getItem('ikariam_notas') || '');

  const [theme, setTheme] = useState<ThemeMode>(() =>
    localStorage.getItem('ikariam_tema') === 'dark' ? 'dark' : 'light'
  );
  const [audioMuted, setAudioMuted] = useState<boolean>(
    () => localStorage.getItem('ikariam_audio_muted') === 'true'
  );
  const [alarmSound, setAlarmSoundState] = useState<AlarmSoundType>(
    () => (localStorage.getItem('ikariam_som_pref') as AlarmSoundType) || 'corneta'
  );
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(
    () => localStorage.getItem('ikariam_voz_pref') !== 'false'
  );
  const [liveProdActive, setLiveProdActiveState] = useState<boolean>(
    () => localStorage.getItem('ikariam_live_prod_active') !== 'false'
  );
  const [tickerMode, setTickerMode] = useState<TickerMode>('cidade');
  const [autoSyncEnabled, setAutoSyncEnabledState] = useState<boolean>(
    () => localStorage.getItem('ikariam_autosync_firebase') !== 'false'
  );

  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>('idle');
  const [cloudStatusText, setCloudStatusText] = useState<string>('Conectando ao Firebase...');
  const [hudAlert, setHudAlert] = useState<HudAlert | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<SystemNotificationPermission>(() =>
    getNotificationPermission()
  );

  const [activeAdvisor, setActiveAdvisor] = useState<AdvisorType | null>(null);
  const [panoramaOpen, setPanoramaOpen] = useState(false);
  const [newCityModalOpen, setNewCityModalOpen] = useState(false);
  const [soundboardOpen, setSoundboardOpen] = useState(false);
  const [prefillRoute, setPrefillRoute] = useState<PrefillRoutePayload | null>(null);
  const [accordionSignal, setAccordionSignal] = useState<{ mode: 'expand' | 'collapse'; seq: number }>({
    mode: 'expand',
    seq: 0,
  });

  const hudTimeoutRef = useRef<number | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const isSyncingRef = useRef(false);
  const fractionAccRef = useRef<Record<string, Record<ResourceKey, number>>>({});
  const lastTickRef = useRef<number>(Date.now());

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('ikariam_tema', theme);
  }, [theme]);

  const showHudAlert = useCallback((titulo: string, desc: string, icone = '⚠️') => {
    const id = Date.now();
    setHudAlert({ id, titulo, desc, icone });
    if (hudTimeoutRef.current) window.clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = window.setTimeout(() => {
      setHudAlert((prev) => (prev && prev.id === id ? null : prev));
    }, 5500);
  }, []);

  const dismissHudAlert = useCallback(() => {
    setHudAlert(null);
  }, []);

  const syncNowToCloud = useCallback(
    async (manual = false) => {
      if (!navigator.onLine) {
        setCloudStatus('warning');
        setCloudStatusText('Offline — salvo localmente');
        return;
      }
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setCloudStatus('saving');
      setCloudStatusText('Salvando no Firebase...');
      try {
        const res = await saveImperialDataToFirebase();
        localStorage.setItem('ikariam_ultimo_sync_firebase', res.savedAtIso);
        setCloudStatus('synced');
        setCloudStatusText(`Sincronizado às ${res.savedAtText}`);
        if (manual) {
          showHudAlert('NUVEM ATUALIZADA', 'Todas as alterações imperiais foram salvas no Firebase!', '☁️');
        }
      } catch (err) {
        console.error('Erro ao salvar no Firestore:', err);
        setCloudStatus('error');
        setCloudStatusText('Erro ao salvar na nuvem (verifique regras Firestore)');
        if (manual) {
          showHudAlert('ALERTA FIREBASE', 'Não foi possível salvar na nuvem. Verifique sua conexão.', '⚠️');
        }
      } finally {
        isSyncingRef.current = false;
      }
    },
    [showHudAlert]
  );

  const scheduleCloudSync = useCallback(() => {
    if (!autoSyncEnabled) return;
    setCloudStatus('saving');
    setCloudStatusText('Alteração detectada... agendando nuvem');
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(() => {
      syncNowToCloud(false);
    }, 1500);
  }, [autoSyncEnabled, syncNowToCloud]);

  const reloadFromLocalStorage = useCallback(() => {
    const loadedCities = readJsonLS<City[]>('ikariam_cidades_v2', INITIAL_CITIES);
    setCities(loadedCities);
    setResourcesMap(loadAllResourcesMap(loadedCities));
    setArmiesMap(loadAllArmiesMap(loadedCities));
    setVikingLevels(loadAllVikingLevels(loadedCities));
    setTimers(readJsonLS<WarTimer[]>('ikariam_timers', []));
    setObrasFila(readJsonLS<BuildQueueItem[]>('ikariam_obras_v2', getDefaultBuildQueue()));
    setMetasEdificios(readJsonLS<BuildGoal[]>('ikariam_metas_v2', getDefaultBuildGoals()));
    setRadarMissions(readJsonLS<RadarMission[]>('ikariam_missoes_radar', getDefaultRadarMissions()));
    setSpyTargets(readJsonLS<SpyTarget[]>('ikariam_alvos_espiao', getDefaultSpyTargets()));
    setTabernaState(readJsonLS<TabernaData>('ikariam_taberna', { nivel: 12, consumo: 60 }));
    setPesquisaState(readJsonLS<PesquisaData>('ikariam_pesq', { nome: 'Pesquisa Militar', total: 28000, prod: 240 }));
    setNotesState(localStorage.getItem('ikariam_notas') || '');
    const gold = parseFloat(localStorage.getItem('ikariam_ouro_global') || '');
    setGlobalGoldState(Number.isFinite(gold) ? gold : DEFAULT_GLOBAL_GOLD);
  }, []);

  const pullFromCloud = useCallback(
    async (manual = false) => {
      if (!navigator.onLine) {
        setCloudStatus('warning');
        setCloudStatusText('Offline — usando cache local');
        return;
      }
      setCloudStatus('loading');
      setCloudStatusText('Baixando dados da nuvem...');
      try {
        const result = await loadImperialDataFromFirebase();
        if (result.exists && result.dataMap) {
          let changed = false;
          for (const k of Object.keys(result.dataMap)) {
            const current = localStorage.getItem(k);
            if (current !== result.dataMap[k]) {
              localStorage.setItem(k, result.dataMap[k]);
              changed = true;
            }
          }
          setCloudStatus('synced');
          setCloudStatusText(`Nuvem carregada (${result.updatedText})`);
          if (changed) {
            reloadFromLocalStorage();
            if (manual) {
              showHudAlert('NUVEM CARREGADA', 'Dados restaurados do Firebase com sucesso!', '☁️');
            } else {
              showHudAlert('DADOS SINCRONIZADOS', 'Informações mais recentes carregadas da nuvem.', '☁️');
            }
          } else if (manual) {
            showHudAlert('JÁ ATUALIZADO', 'Os dados locais já estão idênticos aos da nuvem.', '☁️');
          }
        } else {
          await syncNowToCloud(false);
        }
      } catch (err) {
        console.warn('Falha ao carregar do Firestore:', err);
        setCloudStatus('warning');
        setCloudStatusText('Nuvem indisponível · modo local ativo');
      }
    },
    [reloadFromLocalStorage, showHudAlert, syncNowToCloud]
  );

  // Initial Firebase load
  useEffect(() => {
    pullFromCloud(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync when coming back online
  useEffect(() => {
    const onOnline = () => {
      if (autoSyncEnabled) {
        syncNowToCloud(false);
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [autoSyncEnabled, syncNowToCloud]);

  // Global 1s real-time tick (production + countdowns + expiration alerts)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentMs = Date.now();
      setNow(currentMs);

      const deltaSeg = Math.min(60, Math.max(1, (currentMs - lastTickRef.current) / 1000));
      lastTickRef.current = currentMs;

      if (liveProdActive) {
        setResourcesMap((prev) => {
          let anyCityChanged = false;
          const next: Record<string, CityResources> = { ...prev };

          cities.forEach((c) => {
            const cityRes = prev[c.id];
            if (!cityRes) return;
            if (!fractionAccRef.current[c.id]) {
              fractionAccRef.current[c.id] = { madeira: 0, vinho: 0, marmore: 0, cristal: 0, enxofre: 0 };
            }
            let cityChanged = false;
            const updatedCityRes = { ...cityRes };

            (['madeira', 'vinho', 'marmore', 'cristal', 'enxofre'] as ResourceKey[]).forEach((rk) => {
              const entry = cityRes[rk];
              if (entry && entry.prod > 0 && entry.atual < (entry.max || Infinity)) {
                const inc = (entry.prod / 3600) * deltaSeg;
                fractionAccRef.current[c.id][rk] += inc;
                if (fractionAccRef.current[c.id][rk] >= 1) {
                  const whole = Math.floor(fractionAccRef.current[c.id][rk]);
                  fractionAccRef.current[c.id][rk] -= whole;
                  const newVal = Math.min(entry.max || Infinity, entry.atual + whole);
                  updatedCityRes[rk] = { ...entry, atual: newVal };
                  cityChanged = true;
                }
              }
            });

            if (cityChanged) {
              anyCityChanged = true;
              next[c.id] = updatedCityRes;
              localStorage.setItem('ikariam_res_' + c.id, JSON.stringify(updatedCityRes));
            }
          });

          return anyCityChanged ? next : prev;
        });
      }

      // Check expired Timers
      setTimers((prev) => {
        let changed = false;
        const next = prev.map((t) => {
          if (t.termino <= currentMs && !t.alertado) {
            changed = true;
            playConfiguredAlarmSafe(alarmSound, audioMuted);
            showHudAlert('MISSÃO IMPERIAL CONCLUÍDA', `O evento "${t.nome}" foi concluído!`, '⚔️');
            speakAlertPTBR(`Atenção Comandante: o evento ${t.nome} foi concluído!`, voiceEnabled, audioMuted);
            sendSystemNotification('Ikariam · Cronômetro Concluído', `O evento "${t.nome}" chegou ao fim.`, `timer-${t.id}`);
            return { ...t, alertado: true };
          }
          return t;
        });
        if (changed) {
          localStorage.setItem('ikariam_timers', JSON.stringify(next));
          return next;
        }
        return prev;
      });

      // Check expired Buildings Queue
      setObrasFila((prev) => {
        let changed = false;
        const next = prev.map((o) => {
          if (o.termino <= currentMs && !o.alertado) {
            changed = true;
            playConfiguredAlarmSafe(alarmSound, audioMuted);
            showHudAlert('OBRA CONCLUÍDA', `${o.edificio} Nível ${o.nivelAlvo} concluído em ${o.cidadeId}!`, '🏛️');
            speakAlertPTBR(
              `Atenção Comandante: a construção de ${o.edificio} em ${o.cidadeId} foi finalizada!`,
              voiceEnabled,
              audioMuted
            );
            sendSystemNotification(
              'Ikariam · Obra Finalizada!',
              `${o.edificio} Nível ${o.nivelAlvo} concluído em ${o.cidadeId}.`,
              `obra-${o.id}`
            );
            return { ...o, alertado: true };
          }
          return o;
        });
        if (changed) {
          localStorage.setItem('ikariam_obras_v2', JSON.stringify(next));
          return next;
        }
        return prev;
      });

      // Check expired Radar Missions
      setRadarMissions((prev) => {
        let changed = false;
        const next = prev.map((m) => {
          const endMs = m.inicio + m.duracaoSeg * 1000;
          if (endMs <= currentMs && !m.alertado) {
            changed = true;
            playConfiguredAlarmSafe('corneta', audioMuted);
            showHudAlert('FROTA CHEGOU AO DESTINO', `A frota enviada para "${m.alvo}" chegou!`, '⚓');
            speakAlertPTBR(`A frota de ${m.alvo} chegou ao destino.`, voiceEnabled, audioMuted);
            sendSystemNotification('Ikariam · Frota Chegou', `A frota para "${m.alvo}" chegou ao destino.`, `radar-${m.id}`);
            return { ...m, alertado: true };
          }
          return m;
        });
        if (changed) {
          localStorage.setItem('ikariam_missoes_radar', JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [alarmSound, audioMuted, cities, liveProdActive, showHudAlert, voiceEnabled]);

  const activeCity = useMemo(
    () => cities.find((c) => c.id === activeCityId) || cities[0],
    [cities, activeCityId]
  );

  const setActiveTab = useCallback(
    (tab: TabId) => {
      setActiveTabState((prev) => {
        if (prev === tab) return prev;
        const prevIdx = VALID_TABS.indexOf(prev);
        const nextIdx = VALID_TABS.indexOf(tab);
        setTabTransitionDir(nextIdx > prevIdx ? 'right' : 'left');
        return tab;
      });
      setTabChangeSeq((s) => s + 1);
      playClickWrapper(audioMuted);
    },
    [audioMuted]
  );

  const setActiveCityId = useCallback((id: string) => {
    setActiveCityIdState(id);
    localStorage.setItem('ikariam_cidade_ativa', id);
  }, []);

  const addCity = useCallback(
    (nome: string, coords: string) => {
      const id = 'CIDADE_' + Date.now();
      const newCity: City = { id, nome, coords };
      setCities((prev) => {
        const next = [...prev, newCity];
        localStorage.setItem('ikariam_cidades_v2', JSON.stringify(next));
        return next;
      });
      const defRes = getDefaultCityResources(id);
      setResourcesMap((prev) => {
        localStorage.setItem('ikariam_res_' + id, JSON.stringify(defRes));
        return { ...prev, [id]: defRes };
      });
      setArmiesMap((prev) => ({ ...prev, [id]: [] }));
      setVikingLevels((prev) => ({ ...prev, [id]: 10 }));
      setActiveCityId(id);
      scheduleCloudSync();
      showHudAlert('COLÔNIA FUNDADA', `${nome} [${coords}] adicionada ao Império!`, '🏛️');
    },
    [scheduleCloudSync, setActiveCityId, showHudAlert]
  );

  const updateCityResource = useCallback(
    (cityId: string, res: ResourceKey, field: 'atual' | 'max' | 'prod', value: number) => {
      setResourcesMap((prev) => {
        const current = prev[cityId] || getDefaultCityResources(cityId);
        const updated: CityResources = {
          ...current,
          [res]: {
            ...current[res],
            [field]: Math.max(0, value),
          },
        };
        localStorage.setItem('ikariam_res_' + cityId, JSON.stringify(updated));
        return { ...prev, [cityId]: updated };
      });
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const updateCityArmy = useCallback(
    (cityId: string, list: ArmyUnit[]) => {
      const normalized = normalizeArmyList(list);
      setArmiesMap((prev) => {
        localStorage.setItem('ikariam_exercito_' + cityId, JSON.stringify(normalized));
        return { ...prev, [cityId]: normalized };
      });
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const addTimer = useCallback(
    (nome: string, duracaoSegundos: number) => {
      const newTimer: WarTimer = {
        id: Date.now(),
        nome,
        termino: Date.now() + duracaoSegundos * 1000,
        duracaoTotal: duracaoSegundos,
        alertado: false,
      };
      setTimers((prev) => {
        const next = [...prev, newTimer];
        localStorage.setItem('ikariam_timers', JSON.stringify(next));
        return next;
      });
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const removeTimer = useCallback(
    (id: number) => {
      setTimers((prev) => {
        const next = prev.filter((t) => t.id !== id);
        localStorage.setItem('ikariam_timers', JSON.stringify(next));
        return next;
      });
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const addObra = useCallback(
    (cidadeId: string, edificio: string, nivelAlvo: number, duracaoSeg: number) => {
      const newItem: BuildQueueItem = {
        id: Date.now(),
        cidadeId,
        edificio,
        nivelAlvo,
        termino: Date.now() + duracaoSeg * 1000,
        alertado: false,
      };
      setObrasFila((prev) => {
        const next = [...prev, newItem].sort((a, b) => a.termino - b.termino);
        localStorage.setItem('ikariam_obras_v2', JSON.stringify(next));
        return next;
      });
      playClickWrapper(audioMuted);
      scheduleCloudSync();
      showHudAlert('OBRA REGISTRADA', `${edificio} Nível ${nivelAlvo} adicionado à fila com contagem ao vivo!`, '🏛️');
    },
    [audioMuted, scheduleCloudSync, showHudAlert]
  );

  const removeObra = useCallback(
    (id: number) => {
      setObrasFila((prev) => {
        const next = prev.filter((o) => o.id !== id);
        localStorage.setItem('ikariam_obras_v2', JSON.stringify(next));
        return next;
      });
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const addMeta = useCallback(
    (goal: Omit<BuildGoal, 'id'>) => {
      const nextGoal: BuildGoal = { ...goal, id: Date.now() };
      setMetasEdificios((prev) => {
        const next = [...prev, nextGoal];
        localStorage.setItem('ikariam_metas_v2', JSON.stringify(next));
        return next;
      });
      scheduleCloudSync();
      showHudAlert('META REGISTRADA', `Meta para ${goal.nome} definida em ${goal.cidadeId}!`, '🎯');
    },
    [scheduleCloudSync, showHudAlert]
  );

  const removeMeta = useCallback(
    (id: number) => {
      setMetasEdificios((prev) => {
        const next = prev.filter((m) => m.id !== id);
        localStorage.setItem('ikariam_metas_v2', JSON.stringify(next));
        return next;
      });
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const addRadarMission = useCallback(
    (alvo: string, tipo: string, minutos: number, navios: number) => {
      const item: RadarMission = {
        id: Date.now(),
        alvo,
        tipo,
        navios,
        inicio: Date.now(),
        duracaoSeg: Math.round(minutos * 60),
        alertado: false,
      };
      setRadarMissions((prev) => {
        const next = [...prev, item];
        localStorage.setItem('ikariam_missoes_radar', JSON.stringify(next));
        return next;
      });
      playConfiguredAlarmSafe('corneta', audioMuted);
      scheduleCloudSync();
      showHudAlert('FROTA DESPACHADA', `${navios} navios em rota para ${alvo}!`, '⛵');
    },
    [audioMuted, scheduleCloudSync, showHudAlert]
  );

  const removeRadarMission = useCallback(
    (id: number) => {
      setRadarMissions((prev) => {
        const next = prev.filter((m) => m.id !== id);
        localStorage.setItem('ikariam_missoes_radar', JSON.stringify(next));
        return next;
      });
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const upsertSpyTarget = useCallback(
    (target: Omit<SpyTarget, 'id'>) => {
      setSpyTargets((prev) => {
        const existingIdx = prev.findIndex(
          (a) =>
            a.coords === target.coords &&
            (a.nome.toLowerCase() === target.nome.toLowerCase() || a.coords === target.coords)
        );
        let next: SpyTarget[];
        if (existingIdx >= 0) {
          next = prev.map((a, idx) => (idx === existingIdx ? { ...a, ...target } : a));
        } else {
          next = [...prev, { ...target, id: Date.now() }];
        }
        localStorage.setItem('ikariam_alvos_espiao', JSON.stringify(next));
        return next;
      });
      scheduleCloudSync();
      showHudAlert('ALVO SALVO', `${target.nome} [${target.coords}] atualizado no QG de Espionagem.`, '🕵️');
    },
    [scheduleCloudSync, showHudAlert]
  );

  const removeSpyTarget = useCallback(
    (id: number) => {
      setSpyTargets((prev) => {
        const next = prev.filter((a) => a.id !== id);
        localStorage.setItem('ikariam_alvos_espiao', JSON.stringify(next));
        return next;
      });
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const setVikingLevel = useCallback(
    (cityId: string, level: number) => {
      const clamped = Math.max(1, Math.min(50, Math.floor(level) || 1));
      setVikingLevels((prev) => {
        localStorage.setItem('ikariam_viking_lvl_' + cityId, String(clamped));
        return { ...prev, [cityId]: clamped };
      });
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const setTabernaData = useCallback(
    (data: TabernaData) => {
      setTabernaState(data);
      localStorage.setItem('ikariam_taberna', JSON.stringify(data));
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const setPesquisaData = useCallback(
    (data: PesquisaData) => {
      setPesquisaState(data);
      localStorage.setItem('ikariam_pesq', JSON.stringify(data));
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const setGlobalGold = useCallback(
    (val: number) => {
      const clean = Math.max(0, val);
      setGlobalGoldState(clean);
      localStorage.setItem('ikariam_ouro_global', String(clean));
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const setNotes = useCallback(
    (val: string) => {
      setNotesState(val);
      localStorage.setItem('ikariam_notas', val);
      scheduleCloudSync();
    },
    [scheduleCloudSync]
  );

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      showHudAlert(
        'TEMA ALTERADO',
        next === 'dark' ? 'Modo Mármore Noturno Helênico ativado!' : 'Modo Papiro Clássico ativado!',
        next === 'dark' ? '🌙' : '☀️'
      );
      return next;
    });
    playClickWrapper(audioMuted);
  }, [audioMuted, showHudAlert]);

  const toggleAudioMuted = useCallback(() => {
    setAudioMuted((prev) => {
      const next = !prev;
      localStorage.setItem('ikariam_audio_muted', next ? 'true' : 'false');
      showHudAlert(
        next ? 'ÁUDIO SILENCIADO' : 'ÁUDIO REATIVADO',
        next ? 'Todos os efeitos sonoros foram silenciados.' : 'Efeitos sonoros e cornetas ativos!',
        next ? '🔇' : '🔊'
      );
      return next;
    });
  }, [showHudAlert]);

  const setAlarmSound = useCallback((s: AlarmSoundType) => {
    setAlarmSoundState(s);
    localStorage.setItem('ikariam_som_pref', s);
  }, []);

  const setVoiceEnabled = useCallback((v: boolean) => {
    setVoiceEnabledState(v);
    localStorage.setItem('ikariam_voz_pref', v ? 'true' : 'false');
  }, []);

  const setLiveProdActive = useCallback(
    (v: boolean) => {
      setLiveProdActiveState(v);
      localStorage.setItem('ikariam_live_prod_active', v ? 'true' : 'false');
      showHudAlert(
        v ? 'PRODUÇÃO EM TEMPO REAL ATIVADA' : 'PRODUÇÃO EM TEMPO REAL PAUSADA',
        v ? 'Seus estoques acumulam recursos continuamente a cada segundo.' : 'Incremento contínuo pausado.',
        v ? '⚡' : '⏸️'
      );
      scheduleCloudSync();
    },
    [scheduleCloudSync, showHudAlert]
  );

  const toggleTickerMode = useCallback(() => {
    setTickerMode((prev) => (prev === 'cidade' ? 'imperio' : 'cidade'));
    playConfiguredAlarmSafe('moedas', audioMuted);
  }, [audioMuted]);

  const setAutoSyncEnabled = useCallback((v: boolean) => {
    setAutoSyncEnabledState(v);
    localStorage.setItem('ikariam_autosync_firebase', v ? 'true' : 'false');
    setCloudStatusText(v ? 'Sincronização automática ativada' : 'Sincronização automática pausada');
  }, []);

  const requestNotifications = useCallback(async () => {
    const perm = await requestSystemNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      showHudAlert(
        'NOTIFICAÇÕES ATIVAS',
        'Você receberá alertas do sistema quando obras ou cronômetros finalizarem!',
        '🔔'
      );
      sendSystemNotification(
        'Ikariam · Alertas Imperiais Ativos',
        'Obras concluídas e cronômetros de guerra avisarão aqui.'
      );
    } else if (perm === 'denied') {
      showHudAlert(
        'PERMISSÃO BLOQUEADA',
        'Libere as notificações nas configurações do navegador para receber alertas do sistema.',
        '🔕'
      );
    }
  }, [showHudAlert]);

  const wineUrgencyList = useMemo(
    () => computeWineUrgencyRanking(cities, resourcesMap, activeCityId, taberna),
    [cities, resourcesMap, activeCityId, taberna]
  );

  const triggerPrefillRoute = useCallback(
    (payload: Omit<PrefillRoutePayload, 'timestamp'>) => {
      setPrefillRoute({ ...payload, timestamp: Date.now() });
      setActiveTab('calculadoras');
    },
    [setActiveTab]
  );

  const triggerAccordionAll = useCallback(
    (mode: 'expand' | 'collapse') => {
      setAccordionSignal((prev) => ({ mode, seq: prev.seq + 1 }));
      playClickWrapper(audioMuted);
      showHudAlert(
        mode === 'expand' ? 'PAINÉIS EXPANDIDOS' : 'PAINÉIS RECOLHIDOS',
        mode === 'expand'
          ? 'Todos os painéis foram abertos!'
          : 'Painéis minimizados para facilitar a navegação no celular!',
        mode === 'expand' ? '📂' : '📁'
      );
    },
    [audioMuted, showHudAlert]
  );

  const resetAllData = useCallback(() => {
    localStorage.clear();
    window.location.reload();
  }, []);

  return (
    <ImperialContext.Provider
      value={{
        now,
        activeTab,
        tabTransitionDir,
        tabChangeSeq,
        setActiveTab,
        cities,
        activeCityId,
        setActiveCityId,
        activeCity,
        addCity,
        resourcesMap,
        updateCityResource,
        armiesMap,
        updateCityArmy,
        timers,
        addTimer,
        removeTimer,
        obrasFila,
        addObra,
        removeObra,
        metasEdificios,
        addMeta,
        removeMeta,
        radarMissions,
        addRadarMission,
        removeRadarMission,
        spyTargets,
        upsertSpyTarget,
        removeSpyTarget,
        vikingLevels,
        setVikingLevel,
        taberna,
        setTabernaData,
        pesquisa,
        setPesquisaData,
        globalGold,
        setGlobalGold,
        notes,
        setNotes,
        theme,
        toggleTheme,
        audioMuted,
        toggleAudioMuted,
        alarmSound,
        setAlarmSound,
        voiceEnabled,
        setVoiceEnabled,
        liveProdActive,
        setLiveProdActive,
        tickerMode,
        toggleTickerMode,
        autoSyncEnabled,
        setAutoSyncEnabled,
        cloudStatus,
        cloudStatusText,
        syncNowToCloud,
        pullFromCloud,
        hudAlert,
        dismissHudAlert,
        showHudAlert,
        notificationPermission,
        requestNotifications,
        activeAdvisor,
        setActiveAdvisor,
        panoramaOpen,
        setPanoramaOpen,
        newCityModalOpen,
        setNewCityModalOpen,
        soundboardOpen,
        setSoundboardOpen,
        wineUrgencyList,
        prefillRoute,
        triggerPrefillRoute,
        accordionSignal,
        triggerAccordionAll,
        resetAllData,
        reloadFromLocalStorage,
      }}
    >
      {children}
    </ImperialContext.Provider>
  );
};

export function useImperial() {
  const ctx = useContext(ImperialContext);
  if (!ctx) throw new Error('useImperial deve ser usado dentro de ImperialProvider');
  return ctx;
}
