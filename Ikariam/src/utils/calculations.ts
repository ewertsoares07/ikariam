import { FLEET_FREIGHTER_CAP, FLEET_MERCHANT_CAP, getDefaultCityResources } from '../data/gameData';
import { ArmyUnit, City, CityResources, TabernaData, WineUrgencyItem } from '../types/ikariam';
import { parseCoords } from './formatters';

export function computeWineUrgencyRanking(
  cities: City[],
  resourcesMap: Record<string, CityResources>,
  activeCityId: string,
  taberna: TabernaData
): WineUrgencyItem[] {
  const list: WineUrgencyItem[] = cities.map((c) => {
    const res = resourcesMap[c.id] || getDefaultCityResources(c.id);
    const vinhoAtual = res.vinho?.atual ?? (c.id === 'SPYC' ? 9500 : 4000);
    const consumoTaberna = c.id === activeCityId || c.id === 'SPYC' ? taberna.consumo || 60 : 60;
    const horasRestantes = consumoTaberna > 0 ? vinhoAtual / consumoTaberna : 9999;
    const vinho7Dias = Math.max(0, consumoTaberna * 168 - vinhoAtual);
    const barcosNecessarios = Math.ceil(vinho7Dias / FLEET_MERCHANT_CAP);
    const cargueirosNecessarios = Math.ceil(vinho7Dias / FLEET_FREIGHTER_CAP);
    const status: WineUrgencyItem['status'] =
      horasRestantes < 12 ? 'critical' : horasRestantes < 48 ? 'warning' : 'safe';

    return {
      cidade: c,
      vinhoAtual,
      consumoTaberna,
      horasRestantes,
      vinho7Dias,
      barcosNecessarios,
      cargueirosNecessarios,
      status,
    };
  });

  return list.sort((a, b) => a.horasRestantes - b.horasRestantes);
}

export interface VikingLevelStats {
  nivel: number;
  madeira: number;
  ouro: number;
  luxo: number;
  totalSaque: number;
  barcos600: number;
  cargueiros52k: number;
  barbarosTropa: number;
  temFrotaNaval: boolean;
  barcosBarbaros: number;
  hoplitasRec: number;
  carabineirosRec: number;
  cozinheirosRec: number;
  naviosGuerraRec: number;
  percBonusCartas: number;
  tempoBaseMin: number;
  tempoComCartasMin: number;
  tempoComCartasSeg: number;
}

export function calcVikingStats(nivelRaw: number, cartasLvlRaw: number): VikingLevelStats {
  const nivel = Math.max(1, Math.min(50, Math.floor(nivelRaw) || 1));
  const cartasLvl = Math.max(0, Math.min(32, Math.floor(cartasLvlRaw) || 0));
  const percBonusCartas = Math.min(60, cartasLvl * 2);

  const madeira = Math.round(180 * Math.pow(nivel, 1.75));
  const ouro = Math.round(120 * Math.pow(nivel, 1.6));
  const luxo = nivel >= 5 ? Math.round(140 * Math.pow(nivel, 1.7)) : 0;
  const totalSaque = madeira + ouro + luxo;

  const barcos600 = Math.ceil(totalSaque / FLEET_MERCHANT_CAP);
  const cargueiros52k = Math.ceil(totalSaque / FLEET_FREIGHTER_CAP);

  const barbarosTropa = Math.round(15 * Math.pow(nivel, 1.35));
  const temFrotaNaval = nivel >= 10;
  const barcosBarbaros = temFrotaNaval ? Math.round(4 * Math.pow(nivel - 9, 1.25)) : 0;

  const hoplitasRec = Math.round(barbarosTropa * 1.5);
  const carabineirosRec = Math.round(barbarosTropa * 0.8);
  const cozinheirosRec = Math.max(10, Math.ceil(hoplitasRec / 45));
  const naviosGuerraRec = temFrotaNaval ? Math.round(barcosBarbaros * 1.4) : 0;

  const tempoBaseMin = 20;
  const tempoComCartasMin = Math.max(8, Math.round(tempoBaseMin * (1 - percBonusCartas / 100)));
  const tempoComCartasSeg = Math.max(8 * 60, Math.round(tempoBaseMin * 60 * (1 - percBonusCartas / 100)));

  return {
    nivel,
    madeira,
    ouro,
    luxo,
    totalSaque,
    barcos600,
    cargueiros52k,
    barbarosTropa,
    temFrotaNaval,
    barcosBarbaros,
    hoplitasRec,
    carabineirosRec,
    cozinheirosRec,
    naviosGuerraRec,
    percBonusCartas,
    tempoBaseMin,
    tempoComCartasMin,
    tempoComCartasSeg,
  };
}

export function calcTravelTime(params: {
  origem: string;
  destino: string;
  velocidadeBase: number;
  multiplicadorBonus: number;
  cartasNauticasNivel: number;
}) {
  const c1 = parseCoords(params.origem);
  const c2 = parseCoords(params.destino);
  const velFinal = Math.max(1, params.velocidadeBase * params.multiplicadorBonus);
  const redCartas = Math.min(0.6, Math.max(0, params.cartasNauticasNivel) * 0.02);

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const distanciaIlhas = Math.sqrt(dx * dx + dy * dy);

  let tempoSegundos =
    distanciaIlhas === 0
      ? Math.round((1200 / velFinal) * 60)
      : Math.round(((distanciaIlhas * 30) / velFinal) * 3600);
  tempoSegundos = Math.round(tempoSegundos * (1 - redCartas));

  return {
    distanciaIlhas,
    tempoSegundos,
    descontoCartasPerc: Math.round(redCartas * 100),
    impactoMs: Date.now() + tempoSegundos * 1000,
    retornoMs: Date.now() + tempoSegundos * 2 * 1000,
  };
}

export function calcLootAndPort(total: number, capBarco: number, nivelPorto: number, cartasNivel: number) {
  const redCartas = Math.min(0.6, Math.max(0, cartasNivel) * 0.02);
  const barcos = Math.ceil(total / Math.max(1, capBarco));
  const cargueiros = Math.ceil(total / FLEET_FREIGHTER_CAP);
  const taxaCargaMin = Math.round(30 * Math.pow(1.18, Math.max(1, nivelPorto) - 1));
  const tempoCargaMin = Math.ceil(total / Math.max(30, taxaCargaMin));

  return {
    barcos,
    cargueiros,
    descontoCartasPerc: Math.round(redCartas * 100),
    taxaCargaMin,
    tempoCargaMin,
  };
}

export function calcSupplyRoute(c1: City, c2: City, qtd: number, cartasNivel = 14) {
  const p1 = parseCoords(c1.coords);
  const p2 = parseCoords(c2.coords);
  const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  const redCartas = Math.min(0.6, Math.max(0, cartasNivel) * 0.02);

  let tempoSeg = dist === 0 ? 1200 : Math.round(((dist * 30) / 60) * 3600);
  tempoSeg = Math.round(tempoSeg * (1 - redCartas));

  return {
    dist,
    barcos: Math.ceil(qtd / FLEET_MERCHANT_CAP),
    cargueiros: Math.ceil(qtd / FLEET_FREIGHTER_CAP),
    descontoCartasPerc: Math.round(redCartas * 100),
    tempoSeg,
    chegadaMs: Date.now() + tempoSeg * 1000,
    retornoMs: Date.now() + tempoSeg * 2 * 1000,
  };
}

export function calcWallSiege(lvlMuralha: number, lvlCidade: number) {
  if (lvlMuralha <= 0) {
    return { semMuralha: true as const };
  }
  let segmentos = 3;
  if (lvlCidade >= 10 && lvlCidade <= 16) segmentos = 5;
  else if (lvlCidade >= 17) segmentos = 7;

  const hpSegmento = 50 + 20 * lvlMuralha;
  const armaduraMuralha = 10 + 2 * lvlMuralha;
  const hpTotalMuralha = hpSegmento * segmentos;

  const danoSlotMorteiro = 6 * Math.max(10, 270 - armaduraMuralha);
  const morteirosNecessarios1Rodada = Math.ceil(hpTotalMuralha / danoSlotMorteiro);
  const slotsMorteiro1Rodada = Math.ceil(morteirosNecessarios1Rodada / 6);

  const danoSlotAriete = 10 * Math.max(5, 80 - armaduraMuralha);
  const rodadasAriete = Math.ceil(hpTotalMuralha / (danoSlotAriete * 2));

  return {
    semMuralha: false as const,
    segmentos,
    hpSegmento,
    armaduraMuralha,
    hpTotalMuralha,
    slotsMorteiro1Rodada,
    morteirosRecomendados: slotsMorteiro1Rodada * 6,
    rodadasAriete,
  };
}

export interface BattleSlotItem {
  label: string;
  content: string;
  occupied: boolean;
}

export interface BattleSimulationResult {
  frente: BattleSlotItem[];
  longo: BattleSlotItem[];
  flancos: BattleSlotItem[];
  artilharia: BattleSlotItem[];
  aereo: BattleSlotItem[];
  preenchidos: number;
  resumoLinhas: string[];
}

export type FieldSize = 'pequeno' | 'medio' | 'grande' | 'maior' | 'ilimitado';

export function buildBattleSimulation(
  modo: 'terrestre' | 'naval',
  campo: FieldSize,
  army: ArmyUnit[],
  distributed: boolean
): BattleSimulationResult {
  let numFrente = 7,
    numLongo = 7,
    numFlancos = 4,
    numArt = 4,
    numAereo = 3;

  if (campo === 'pequeno') {
    numFrente = 3;
    numLongo = 3;
    numFlancos = 1;
    numArt = 1;
    numAereo = 1;
  } else if (campo === 'medio') {
    numFrente = 5;
    numLongo = 5;
    numFlancos = 2;
    numArt = 2;
    numAereo = 2;
  } else if (campo === 'grande') {
    numFrente = 7;
    numLongo = 7;
    numFlancos = 3;
    numArt = 3;
    numAereo = 2;
  }

  const frente: BattleSlotItem[] = [];
  const longo: BattleSlotItem[] = [];
  const flancos: BattleSlotItem[] = [];
  const artilharia: BattleSlotItem[] = [];
  const aereo: BattleSlotItem[] = [];
  let preenchidos = 0;
  const resumoLinhas: string[] = [];

  if (modo === 'terrestre') {
    const hoplitas = army.find((u) => u.nome === 'Hoplita')?.qtd || 0;
    const gigantes = army.find((u) => u.nome === 'Gigante a Vapor')?.qtd || 0;
    const carabineiros = army.find((u) => u.nome === 'Carabineiro')?.qtd || 0;
    const espadachins = army.find((u) => u.nome === 'Espadachim')?.qtd || 0;
    const morteiros = army.find((u) => u.nome === 'Morteiro')?.qtd || 0;
    const arietes = army.find((u) => u.nome === 'Aríete')?.qtd || 0;
    const giros = army.find((u) => u.nome === 'Girocóptero')?.qtd || 0;
    const baloes = army.find((u) => u.nome === 'Balão Bombardeiro')?.qtd || 0;
    const cozinheiros = army.find((u) => u.nome === 'Cozinheiro')?.qtd || 0;
    const medicos = army.find((u) => u.nome === 'Médico')?.qtd || 0;

    let frenteRest = hoplitas + gigantes;
    for (let i = 1; i <= numFrente; i++) {
      if (distributed && frenteRest > 0) {
        const alocados = Math.min(30, frenteRest);
        frenteRest -= alocados;
        preenchidos++;
        frente.push({ label: `🛡️ Frente ${i}`, content: `${alocados}/30 Hoplitas`, occupied: true });
      } else {
        frente.push({ label: `Frente ${i}`, content: '30 Hoplitas', occupied: false });
      }
    }

    let tiroRest = carabineiros;
    for (let i = 1; i <= numLongo; i++) {
      if (distributed && tiroRest > 0) {
        const alocados = Math.min(30, tiroRest);
        tiroRest -= alocados;
        preenchidos++;
        longo.push({ label: `🎯 Tiro ${i}`, content: `${alocados}/30 Carabineiros`, occupied: true });
      } else {
        longo.push({ label: `2ª Linha ${i}`, content: '30 Carabineiros', occupied: false });
      }
    }

    let flancoRest = espadachins;
    for (let i = 1; i <= numFlancos; i++) {
      if (distributed && flancoRest > 0) {
        const alocados = Math.min(30, flancoRest);
        flancoRest -= alocados;
        preenchidos++;
        flancos.push({ label: `⚔️ Flanco ${i}`, content: `${alocados}/30 Espadachins`, occupied: true });
      } else {
        flancos.push({ label: `Flanco ${i}`, content: '30 Espadachins', occupied: false });
      }
    }

    let artRest = morteiros > 0 ? morteiros : arietes;
    const nomeArt = morteiros > 0 ? 'Morteiros' : 'Aríetes';
    const capArt = morteiros > 0 ? 6 : 10;
    for (let i = 1; i <= numArt; i++) {
      if (distributed && artRest > 0) {
        const alocados = Math.min(capArt, artRest);
        artRest -= alocados;
        preenchidos++;
        artilharia.push({ label: `💣 Artilharia ${i}`, content: `${alocados}/${capArt} ${nomeArt}`, occupied: true });
      } else {
        artilharia.push({ label: `Artilharia ${i}`, content: '6 Morteiros', occupied: false });
      }
    }

    let aereoRest = giros > 0 ? giros : baloes;
    const nomeAereo = giros > 0 ? 'Girocópteros' : 'Balões';
    for (let i = 1; i <= numAereo; i++) {
      if (distributed && aereoRest > 0) {
        const alocados = Math.min(30, aereoRest);
        aereoRest -= alocados;
        preenchidos++;
        aereo.push({ label: `🚁 Céu ${i}`, content: `${alocados}/30 ${nomeAereo}`, occupied: true });
      } else {
        aereo.push({ label: `Céu / Sup. ${i}`, content: '30 Girocópteros', occupied: false });
      }
    }

    resumoLinhas.push(
      `1ª Linha (Frente): ${numFrente * 30} Hoplitas / Gigantes · Flancos: ${numFlancos * 30} Espadachins`,
      `2ª Linha (Tiro): ${numLongo * 30} Carabineiros · Artilharia: ${numArt * 6} Morteiros`
    );
    if (distributed) {
      const totalComb = hoplitas + gigantes + carabineiros + espadachins;
      const recCoz = Math.max(10, Math.ceil(totalComb / 45));
      resumoLinhas.push(
        `✔ ${preenchidos} posições preenchidas · ${cozinheiros} Cozinheiros (Rec.: ${recCoz}) · ${medicos} Médicos`,
        `Reserva não alocada: ${frenteRest} frente, ${tiroRest} atiradores, ${flancoRest} flancos`
      );
    }
  } else {
    const chamas = army.find((u) => u.nome === 'Lança-Chamas')?.qtd || 0;
    const vapores = army.find((u) => u.nome === 'Aríete a Vapor')?.qtd || 0;
    const triremes = army.find((u) => u.nome === 'Trireme')?.qtd || 0;
    const lanchas = army.find((u) => u.nome === 'Lancha Rápida')?.qtd || 0;
    const catapultas = army.find((u) => u.nome === 'Barco Catapulta')?.qtd || 0;
    const foguetes = army.find((u) => u.nome === 'Lança-Foguetes')?.qtd || 0;
    const morteirosNavais = army.find((u) => u.nome === 'Barco Morteiro')?.qtd || 0;
    const sub = army.find((u) => u.nome === 'Submergível')?.qtd || 0;
    const portabaloes = army.find((u) => u.nome === 'Porta-Balões')?.qtd || 0;
    const reparadores = army.find((u) => u.nome === 'Reparador')?.qtd || 0;

    let frenteRest = chamas > 0 ? chamas : vapores;
    const nomeFrente = chamas > 0 ? 'Lança-Chamas' : 'Aríetes Vapor';
    for (let i = 1; i <= numFrente; i++) {
      if (distributed && frenteRest > 0) {
        const alocados = Math.min(30, frenteRest);
        frenteRest -= alocados;
        preenchidos++;
        frente.push({ label: `🔥 Frente ${i}`, content: `${alocados}/30 ${nomeFrente}`, occupied: true });
      } else {
        frente.push({ label: `Frente ${i}`, content: '30 Lança-Chamas', occupied: false });
      }
    }

    let tiroRest = catapultas > 0 ? catapultas : foguetes;
    const nomeTiro = catapultas > 0 ? 'Catapultas' : 'Foguetes';
    for (let i = 1; i <= numLongo; i++) {
      if (distributed && tiroRest > 0) {
        const alocados = Math.min(25, tiroRest);
        tiroRest -= alocados;
        preenchidos++;
        longo.push({ label: `🚀 Tiro ${i}`, content: `${alocados}/25 ${nomeTiro}`, occupied: true });
      } else {
        longo.push({ label: `2ª Linha ${i}`, content: '25 Catapultas', occupied: false });
      }
    }

    let flancoRest = triremes > 0 ? triremes : lanchas;
    const nomeFlanco = triremes > 0 ? 'Triremes' : 'Lanchas';
    for (let i = 1; i <= numFlancos; i++) {
      if (distributed && flancoRest > 0) {
        const alocados = Math.min(30, flancoRest);
        flancoRest -= alocados;
        preenchidos++;
        flancos.push({ label: `⛵ Flanco ${i}`, content: `${alocados}/30 ${nomeFlanco}`, occupied: true });
      } else {
        flancos.push({ label: `Flanco ${i}`, content: '30 Triremes', occupied: false });
      }
    }

    let artRest = morteirosNavais;
    for (let i = 1; i <= numArt; i++) {
      if (distributed && artRest > 0) {
        const alocados = Math.min(10, artRest);
        artRest -= alocados;
        preenchidos++;
        artilharia.push({ label: `💥 Artilharia ${i}`, content: `${alocados}/10 B. Morteiro`, occupied: true });
      } else {
        artilharia.push({ label: `Artilharia ${i}`, content: '10 B. Morteiro', occupied: false });
      }
    }

    let espRest = sub > 0 ? sub : portabaloes > 0 ? portabaloes : reparadores;
    const nomeEsp = sub > 0 ? 'Submergíveis' : portabaloes > 0 ? 'Porta-Balões' : 'Reparadores';
    for (let i = 1; i <= numAereo; i++) {
      if (distributed && espRest > 0) {
        const alocados = Math.min(10, espRest);
        espRest -= alocados;
        preenchidos++;
        aereo.push({ label: `🤿 Especial ${i}`, content: `${alocados}/10 ${nomeEsp}`, occupied: true });
      } else {
        aereo.push({ label: `Especial ${i}`, content: '10 Submergíveis', occupied: false });
      }
    }

    resumoLinhas.push(
      `1ª Linha Naval: ${numFrente * 30} Lança-Chamas / Aríetes · Flancos: ${numFlancos * 30} Triremes`,
      `2ª Linha Naval: ${numLongo * 25} Catapultas / Foguetes · Artilharia: ${numArt * 10} B. Morteiro`
    );
    if (distributed) {
      resumoLinhas.push(
        `✔ ${preenchidos} posições navais preenchidas · Suporte: ${reparadores} Barcos Reparadores`
      );
    }
  }

  return { frente, longo, flancos, artilharia, aereo, preenchidos, resumoLinhas };
}
