import {
  ArmyUnit,
  BuildGoal,
  BuildQueueItem,
  City,
  CityResources,
  MiracleDef,
  PirateRaidDef,
  RadarMission,
  ResourceKey,
  SpyTarget,
  UnitCatalogItem,
} from '../types/ikariam';

export const FLEET_MERCHANT_SHIPS = 230;
export const FLEET_MERCHANT_CAP = 600;
export const FLEET_FREIGHTERS = 28;
export const FLEET_FREIGHTER_CAP = 52000;
export const FLEET_TOTAL_CAP =
  FLEET_MERCHANT_SHIPS * FLEET_MERCHANT_CAP + FLEET_FREIGHTERS * FLEET_FREIGHTER_CAP; // 1.594.000

export const DEFAULT_GLOBAL_GOLD = 81530000; // 81,53M

export const RESOURCE_META: Record<
  ResourceKey,
  { label: string; icone: string; colorClass: string; barHex: string }
> = {
  madeira: { label: 'Madeira', icone: '🪵', colorClass: 'text-amber-700 dark:text-amber-400', barHex: '#d97706' },
  vinho: { label: 'Vinho', icone: '🍇', colorClass: 'text-purple-700 dark:text-purple-400', barHex: '#a855f7' },
  marmore: { label: 'Mármore', icone: '🏛️', colorClass: 'text-slate-700 dark:text-slate-300', barHex: '#94a3b8' },
  cristal: { label: 'Cristal', icone: '💎', colorClass: 'text-sky-600 dark:text-sky-400', barHex: '#38bdf8' },
  enxofre: { label: 'Enxofre', icone: '🔥', colorClass: 'text-orange-600 dark:text-orange-400', barHex: '#f97316' },
};

export const INITIAL_CITIES: City[] = [
  { id: 'SPYC', nome: 'SPYC', coords: '96:71', capital: true },
  { id: 'CCSP', nome: 'CCSP', coords: '96:71' },
  { id: 'CCCastelo', nome: 'CC Castelo', coords: '96:71' },
  { id: 'ASBAC', nome: 'ASBAC', coords: '96:71' },
  { id: 'YCItaupu', nome: 'YC Itaupu', coords: '96:71' },
  { id: 'SPAC', nome: 'SPAC', coords: '96:70' },
  { id: 'YCSA', nome: 'YCSA', coords: '95:70' },
  { id: 'YCP', nome: 'YCP', coords: '95:71' },
  { id: 'FEVESP', nome: 'FEVESP', coords: '96:69' },
  { id: 'CBVela', nome: 'CBVela', coords: '96:69' },
  { id: 'ICRJ', nome: 'ICRJ', coords: '96:69' },
  { id: 'ICS', nome: 'ICS', coords: '96:69' },
];

export function getDefaultCityResources(cityId: string): CityResources {
  const isCapital = cityId === 'SPYC';
  return {
    madeira: { atual: isCapital ? 18000 : 12000, max: isCapital ? 32000 : 25000, prod: 1200 },
    vinho: { atual: isCapital ? 9500 : 6000, max: isCapital ? 25000 : 20000, prod: 450 },
    marmore: { atual: isCapital ? 6200 : 5000, max: isCapital ? 25000 : 20000, prod: 600 },
    cristal: { atual: isCapital ? 4100 : 3500, max: isCapital ? 20000 : 18000, prod: 300 },
    enxofre: { atual: isCapital ? 5300 : 4000, max: isCapital ? 20000 : 18000, prod: 350 },
  };
}

export const UNIT_CATALOG: UnitCatalogItem[] = [
  // Infantaria & Linha de Frente
  { nome: 'Hoplita', custo: 3, tipo: 'Terrestre', icone: '🛡️', grupo: 'frente' },
  { nome: 'Gigante a Vapor', custo: 12, tipo: 'Terrestre', icone: '⚙️', grupo: 'frente' },
  { nome: 'Espadachim', custo: 4, tipo: 'Terrestre', icone: '⚔️', grupo: 'frente' },
  // Tiro à Distância & Aéreo
  { nome: 'Carabineiro', custo: 3, tipo: 'Terrestre', icone: '🎯', grupo: 'tiro' },
  { nome: 'Girocóptero', custo: 15, tipo: 'Terrestre', icone: '🚁', grupo: 'tiro' },
  { nome: 'Balão Bombardeiro', custo: 45, tipo: 'Terrestre', icone: '🎈', grupo: 'tiro' },
  // Artilharia & Cerco (Aríete pertence à Artilharia)
  { nome: 'Aríete', custo: 15, tipo: 'Terrestre', icone: '🪵⚒️', grupo: 'artilharia' },
  { nome: 'Morteiro', custo: 30, tipo: 'Terrestre', icone: '💣', grupo: 'artilharia' },
  // Suporte & Moral
  { nome: 'Cozinheiro', custo: 10, tipo: 'Terrestre', icone: '🍇', grupo: 'suporte' },
  { nome: 'Médico', custo: 20, tipo: 'Terrestre', icone: '⚕️', grupo: 'suporte' },
  // Esquadra Naval
  { nome: 'Lança-Chamas', custo: 25, tipo: 'Naval', icone: '🔥', grupo: 'naval' },
  { nome: 'Aríete a Vapor', custo: 45, tipo: 'Naval', icone: '🔱', grupo: 'naval' },
  { nome: 'Trireme', custo: 15, tipo: 'Naval', icone: '⛵', grupo: 'naval' },
  { nome: 'Barco Catapulta', custo: 35, tipo: 'Naval', icone: '🪨', grupo: 'naval' },
  { nome: 'Barco Morteiro', custo: 50, tipo: 'Naval', icone: '💥', grupo: 'naval' },
  { nome: 'Lança-Foguetes', custo: 55, tipo: 'Naval', icone: '🚀', grupo: 'naval' },
  { nome: 'Submergível', custo: 50, tipo: 'Naval', icone: '🤿', grupo: 'naval' },
  { nome: 'Lancha Rápida', custo: 5, tipo: 'Naval', icone: '🚤', grupo: 'naval' },
  { nome: 'Porta-Balões', custo: 100, tipo: 'Naval', icone: '🎪', grupo: 'naval' },
  { nome: 'Reparador', custo: 100, tipo: 'Naval', icone: '🔧', grupo: 'naval' },
];

export const SELECTOR_UNIT_ORDER = UNIT_CATALOG.map((u) => u.nome);

export const OFFICIAL_UNIT_COSTS: Record<string, number> = {
  Hoplita: 3,
  'Gigante a Vapor': 12,
  Espadachim: 4,
  Carabineiro: 3,
  Aríete: 15,
  Morteiro: 30,
  Girocóptero: 15,
  'Balão Bombardeiro': 45,
  Cozinheiro: 10,
  Médico: 20,
  'Lança-Chamas': 25,
  'Aríete a Vapor': 45,
  'Aríete a Vapor Naval': 45,
  Trireme: 15,
  Trirreme: 15,
  'Barco Catapulta': 35,
  'Barco Morteiro': 50,
  'Lança-Foguetes': 55,
  Submergível: 50,
  Submersível: 50,
  'Lancha Rápida': 5,
  'Porta-Balões': 100,
  Reparador: 100,
  'Barco Reparador': 100,
};

export const IGNORED_UNITS = [
  'Catapulta',
  'Lanceiro',
  'Fundibulário',
  'Fundeiro',
  'Arqueiro',
  'Barco Balista',
];

export const UNIT_NAME_ALIASES: Record<string, string> = {
  Fuzileiro: 'Carabineiro',
  'Aríete a Vapor Naval': 'Aríete a Vapor',
  Trirreme: 'Trireme',
  Submersível: 'Submergível',
  'Barco Reparador': 'Reparador',
  'Barco de Manutenção': 'Reparador',
  'Navio Porta-Incêndio': 'Lança-Chamas',
  'Barco de Rodas': 'Lancha Rápida',
  Espartano: 'Gigante a Vapor',
};

export const DEFAULT_SPYC_ARMY: ArmyUnit[] = [
  { id: 1, nome: 'Hoplita', tipo: 'Terrestre', qtd: 3976, custo: 3 },
  { id: 2, nome: 'Gigante a Vapor', tipo: 'Terrestre', qtd: 150, custo: 12 },
  { id: 3, nome: 'Espadachim', tipo: 'Terrestre', qtd: 40, custo: 4 },
  { id: 4, nome: 'Carabineiro', tipo: 'Terrestre', qtd: 1250, custo: 3 },
  { id: 5, nome: 'Aríete', tipo: 'Terrestre', qtd: 56, custo: 15 },
  { id: 6, nome: 'Morteiro', tipo: 'Terrestre', qtd: 120, custo: 30 },
  { id: 7, nome: 'Girocóptero', tipo: 'Terrestre', qtd: 80, custo: 15 },
  { id: 8, nome: 'Balão Bombardeiro', tipo: 'Terrestre', qtd: 60, custo: 45 },
  { id: 9, nome: 'Cozinheiro', tipo: 'Terrestre', qtd: 90, custo: 10 },
  { id: 10, nome: 'Médico', tipo: 'Terrestre', qtd: 40, custo: 20 },
  { id: 11, nome: 'Lança-Chamas', tipo: 'Naval', qtd: 50, custo: 25 },
  { id: 12, nome: 'Aríete a Vapor', tipo: 'Naval', qtd: 250, custo: 45 },
  { id: 13, nome: 'Trireme', tipo: 'Naval', qtd: 250, custo: 15 },
  { id: 14, nome: 'Barco Catapulta', tipo: 'Naval', qtd: 100, custo: 35 },
  { id: 15, nome: 'Barco Morteiro', tipo: 'Naval', qtd: 60, custo: 50 },
  { id: 16, nome: 'Lança-Foguetes', tipo: 'Naval', qtd: 40, custo: 55 },
  { id: 17, nome: 'Submergível', tipo: 'Naval', qtd: 80, custo: 50 },
  { id: 18, nome: 'Lancha Rápida', tipo: 'Naval', qtd: 80, custo: 5 },
  { id: 19, nome: 'Porta-Balões', tipo: 'Naval', qtd: 20, custo: 100 },
  { id: 20, nome: 'Reparador', tipo: 'Naval', qtd: 25, custo: 100 },
];

export const BUILDING_LIST = [
  { value: 'Câmara Municipal', label: '🏛️ Câmara Municipal' },
  { value: 'Armazém', label: '📦 Armazém' },
  { value: 'Porto Comercial', label: '⛵ Porto Comercial' },
  { value: 'Quartel', label: '⚔️ Quartel' },
  { value: 'Estaleiro', label: '⚓ Estaleiro Naval' },
  { value: 'Taberna', label: '🍇 Taberna' },
  { value: 'Museu', label: '🏺 Museu' },
  { value: 'Palácio', label: '👑 Palácio Imperial' },
  { value: 'Residência do Governador', label: '🏛️ Residência do Governador' },
  { value: 'Academia', label: '🔬 Academia' },
  { value: 'Carpintaria', label: '🪵 Carpintaria (-Madeira)' },
  { value: 'Prensa de Vinho', label: '🍇 Prensa de Vinho (-Vinho)' },
  { value: 'Canteiro de Obras', label: '🏛️ Canteiro de Obras (-Mármore)' },
  { value: 'Oficina do Vidraceiro', label: '💎 Oficina do Vidraceiro (-Cristal)' },
  { value: 'Área de Teste Pirotécnico', label: '🔥 Área de Teste (-Enxofre)' },
  { value: 'Muralha da Cidade', label: '🧱 Muralha da Cidade' },
  { value: 'Oficina dos Inventores', label: '⚙️ Oficina dos Inventores' },
  { value: 'Arquivo de Cartas Náuticas', label: '📜 Arquivo de Cartas Náuticas' },
  { value: 'Esconderijo', label: '🕵️ Esconderijo' },
  { value: 'Fortaleza dos Piratas', label: '🏴‍☠️ Fortaleza dos Piratas' },
];

export const COST_REDUCER_BUILDINGS = [
  { value: 'Carpintaria', label: '🪵 Carpintaria (-1% por nível em Madeira)' },
  { value: 'Prensa de Vinho', label: '🍇 Prensa de Vinho (-1% por nível em Vinho)' },
  { value: 'Canteiro de Obras', label: '🏛️ Canteiro de Obras (-1% por nível em Mármore)' },
  { value: 'Oficina do Vidraceiro', label: '💎 Oficina do Vidraceiro (-1% por nível em Cristal)' },
  { value: 'Área de Teste Pirotécnico', label: '🔥 Área de Teste (-1% por nível em Enxofre)' },
];

export const PIRATE_RAIDS: PirateRaidDef[] = [
  { segundos: 150, titulo: 'Navegação Costeira (2.5 min)', nomeCurto: 'Navegação Costeira (2.5m)', pontos: 115 },
  { segundos: 450, titulo: 'Saque ao Vilarejo (7.5 min)', nomeCurto: 'Saque ao Vilarejo (7.5m)', pontos: 275 },
  { segundos: 900, titulo: 'Pilhagem de Navios (15 min)', nomeCurto: 'Pilhagem de Navios (15m)', pontos: 500 },
  { segundos: 1800, titulo: 'Ataque ao Entreposto (30 min)', nomeCurto: 'Ataque ao Entreposto (30m)', pontos: 925 },
  { segundos: 3600, titulo: 'Cerco à Baía dos Contrabandistas (1 hora)', nomeCurto: 'Cerco à Baía (1h)', pontos: 1700 },
  { segundos: 7200, titulo: 'Expedição aos Mares Proibidos (2 horas)', nomeCurto: 'Expedição Mares Proibidos (2h)', pontos: 3100 },
  { segundos: 14400, titulo: 'Domínio do Arquipélago (4 horas)', nomeCurto: 'Domínio do Arquipélago (4h)', pontos: 5600 },
  { segundos: 28800, titulo: 'Incursão Imperial Noturna (8 horas)', nomeCurto: 'Incursão Imperial Noturna (8h)', pontos: 10000 },
];

export const MIRACLES: MiracleDef[] = [
  {
    nome: 'Colosso',
    nivel: 3,
    cooldownHoras: 72,
    icone: '🗿',
    tituloCompleto: 'Colosso de Rodes',
    resumo: 'Expulsa invasores (debandada forçada).',
    descricao: '🗿 Colosso de Rodes: Força a debandada de até 100% das tropas e frotas invasoras!',
    cor: 'text-red-700 dark:text-red-400',
  },
  {
    nome: 'Posídon',
    nivel: 4,
    cooldownHoras: 24,
    icone: '🔱',
    tituloCompleto: 'Santuário de Posídon',
    resumo: '+100% de velocidade de navios.',
    descricao: '🔱 Santuário de Posídon: Aumenta a velocidade de todos os seus barcos em +100%!',
    cor: 'text-sky-700 dark:text-sky-400',
  },
  {
    nome: 'Hefesto',
    nivel: 5,
    cooldownHoras: 48,
    icone: '🔨',
    tituloCompleto: 'Forja de Hefesto',
    resumo: '+2 de armadura e dano em batalha.',
    descricao: '🔨 Forja de Hefesto: Concede +2 de armadura e dano para todas as tropas!',
    cor: 'text-amber-800 dark:text-amber-400',
  },
  {
    nome: 'Dionísio',
    nivel: 4,
    cooldownHoras: 36,
    icone: '🍇',
    tituloCompleto: 'Jardim de Dionísio',
    resumo: '+Satisfação e fartura de vinho.',
    descricao: '🍇 Jardim de Dionísio: Aumenta a satisfação da população e concede bônus de vinho!',
    cor: 'text-purple-700 dark:text-purple-400',
  },
  {
    nome: 'Atena',
    nivel: 4,
    cooldownHoras: 24,
    icone: '🏛️',
    tituloCompleto: 'Fortaleza de Atena',
    resumo: '+400% de recursos protegidos contra saque.',
    descricao: '🏛️ Fortaleza de Atena: Protege 400% a mais de recursos nos armazéns!',
    cor: 'text-red-700 dark:text-red-400',
  },
  {
    nome: 'Ares',
    nivel: 3,
    cooldownHoras: 48,
    icone: '⚔️',
    tituloCompleto: 'Templo de Ares',
    resumo: '+Moral de tropas em choque inicial.',
    descricao: '⚔️ Templo de Ares: Eleva a moral do exército em +5000 no início da batalha!',
    cor: 'text-red-600 dark:text-red-400',
  },
  {
    nome: 'Deméter',
    nivel: 4,
    cooldownHoras: 36,
    icone: '🌾',
    tituloCompleto: 'Bosque de Deméter',
    resumo: '+100% de crescimento populacional.',
    descricao: '🌾 Bosque de Deméter: Aumenta o crescimento de cidadãos em todas as suas cidades em +100%!',
    cor: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    nome: 'Hermes',
    nivel: 5,
    cooldownHoras: 24,
    icone: '☀️',
    tituloCompleto: 'Templo de Hermes',
    resumo: '+200% velocidade de carga no porto.',
    descricao: '☀️ Templo de Hermes: Aumenta a velocidade de carregamento nos portos comerciais em +200%!',
    cor: 'text-amber-600 dark:text-amber-400',
  },
];

export function getDefaultBuildQueue(): BuildQueueItem[] {
  const now = Date.now();
  return [
    {
      id: 1,
      cidadeId: 'SPYC',
      edificio: 'Armazém',
      nivelAlvo: 28,
      termino: now + 2 * 3600 * 1000 + 15 * 60 * 1000,
      alertado: false,
    },
    {
      id: 2,
      cidadeId: 'CCSP',
      edificio: 'Câmara Municipal',
      nivelAlvo: 25,
      termino: now + 5 * 3600 * 1000 + 40 * 60 * 1000,
      alertado: false,
    },
  ];
}

export function getDefaultBuildGoals(): BuildGoal[] {
  return [
    {
      id: 1,
      cidadeId: 'SPYC',
      nome: 'Palácio (12ª Colônia)',
      madeira: 280000,
      marmore: 195000,
      vinho: 0,
      cristal: 0,
      enxofre: 0,
    },
  ];
}

export function getDefaultSpyTargets(): SpyTarget[] {
  return [
    { id: 1, nome: 'Colônia Alpha', coords: '93:24', armazem: 32000, notas: 'Bom estoque de madeira e vinho' },
    { id: 2, nome: 'Farma Segura', coords: '95:21', armazem: 20000, notas: 'Mármore abundante, muralha nível 4' },
  ];
}

export function getDefaultRadarMissions(): RadarMission[] {
  return [
    {
      id: 1,
      alvo: 'Pilhagem em [93:24]',
      tipo: 'Ataque / Pilhagem',
      navios: 40,
      inicio: Date.now() - 300000,
      duracaoSeg: 1500,
      alertado: false,
    },
  ];
}

export function getUnitIcon(nome: string): string {
  const found = UNIT_CATALOG.find((u) => u.nome === nome);
  if (found) return found.icone;
  const fallback: Record<string, string> = {
    'Aríete a Vapor Naval': '🔱',
    Trirreme: '⛵',
    Submersível: '🤿',
    'Barco Reparador': '🔧',
  };
  return fallback[nome] || '⚔️';
}

export function normalizeArmyList(raw: ArmyUnit[]): ArmyUnit[] {
  const cleaned = raw.filter((u) => !IGNORED_UNITS.includes(u.nome));
  return cleaned.map((u) => {
    const mappedName = UNIT_NAME_ALIASES[u.nome] || u.nome;
    const officialCost = OFFICIAL_UNIT_COSTS[mappedName] ?? u.custo;
    return {
      ...u,
      nome: mappedName,
      custo: officialCost,
    };
  });
}
