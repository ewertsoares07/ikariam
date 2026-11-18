export type TabId =
  | 'inicio'
  | 'edificios'
  | 'recursos'
  | 'militar'
  | 'vikings'
  | 'simulador'
  | 'pirataria'
  | 'espionagem'
  | 'calculadoras'
  | 'notas';

export type ResourceKey = 'madeira' | 'vinho' | 'marmore' | 'cristal' | 'enxofre';

export interface City {
  id: string;
  nome: string;
  coords: string;
  capital?: boolean;
}

export interface ResourceEntry {
  atual: number;
  max: number;
  prod: number;
}

export type CityResources = Record<ResourceKey, ResourceEntry>;

export interface TabernaData {
  nivel: number;
  consumo: number;
}

export interface PesquisaData {
  nome: string;
  total: number;
  prod: number;
}

export interface BuildQueueItem {
  id: number;
  cidadeId: string;
  edificio: string;
  nivelAlvo: number;
  termino: number;
  alertado: boolean;
}

export interface BuildGoal {
  id: number;
  cidadeId: string;
  nome: string;
  madeira: number;
  marmore: number;
  vinho: number;
  cristal: number;
  enxofre: number;
}

export interface WarTimer {
  id: number;
  nome: string;
  termino: number;
  duracaoTotal: number;
  alertado: boolean;
}

export type UnitCategory = 'Terrestre' | 'Naval';

export interface ArmyUnit {
  id: number;
  nome: string;
  tipo: UnitCategory;
  qtd: number;
  custo: number;
}

export interface UnitCatalogItem {
  nome: string;
  custo: number;
  tipo: UnitCategory;
  icone: string;
  grupo: 'frente' | 'tiro' | 'artilharia' | 'suporte' | 'naval';
}

export interface RadarMission {
  id: number;
  alvo: string;
  tipo: string;
  navios: number;
  inicio: number;
  duracaoSeg: number;
  alertado: boolean;
}

export interface SpyTarget {
  id: number;
  nome: string;
  coords: string;
  armazem: number;
  notas: string;
}

export interface PirateRaidDef {
  segundos: number;
  titulo: string;
  nomeCurto: string;
  pontos: number;
}

export interface MiracleDef {
  nome: string;
  nivel: number;
  cooldownHoras: number;
  icone: string;
  tituloCompleto: string;
  resumo: string;
  descricao: string;
  cor: string;
}

export type AlarmSoundType = 'corneta' | 'tambor' | 'sino' | 'moedas';
export type ThemeMode = 'light' | 'dark';
export type TickerMode = 'cidade' | 'imperio';
export type AdvisorType = 'cidades' | 'militar' | 'pesquisa' | 'diplomacia';
export type CloudSyncStatus = 'idle' | 'saving' | 'loading' | 'synced' | 'warning' | 'error';

export interface HudAlert {
  id: number;
  titulo: string;
  desc: string;
  icone: string;
}

export interface PrefillRoutePayload {
  origemId?: string;
  destinoId?: string;
  destinoCoords?: string;
  recurso?: string;
  quantidade?: number;
  saqueTotal?: number;
  timestamp: number;
}

export interface WineUrgencyItem {
  cidade: City;
  vinhoAtual: number;
  consumoTaberna: number;
  horasRestantes: number;
  vinho7Dias: number;
  barcosNecessarios: number;
  cargueirosNecessarios: number;
  status: 'critical' | 'warning' | 'safe';
}
