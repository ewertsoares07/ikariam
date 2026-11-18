// =====================================================================
// DADOS DO JOGO — Ikariam (servidores BR, meta 2026)
// Tudo que é "regra do jogo" fica aqui, num lugar só, fácil de corrigir.
// Fontes: Ikariam Wiki (velocidade, peso de carga, Palácio/Residência),
// Dossiê do projeto (meta do fórum) e dados da v1.
// Campos marcados com (conferir) vieram de memória/v1: se o jogo mostrar
// outro valor, troque aqui e o app inteiro passa a usar o novo.
// =====================================================================

// Velocidade = quantas ilhas a unidade anda em 20h (Wiki). Navio mercante = 60.
// Tempo (min) = distância × 1200 ÷ velocidade. Mesma ilha = distância 0,5.
export const VEL_MERCANTE = 60;
export const CAP_MERCANTE_PADRAO = 500; // carga base do navio mercante (Wiki); ajuste em Sistema se tiver melhorias
export const CAP_CARGUEIRO_PADRAO = 50000; // (conferir) cargueiro a vapor base

// linha: posição no campo de batalha
//  Terra: frente | flanco | longo | artilharia | caca (aéreo) | bombardeio (aéreo) | suporte
//  Mar:   principal | flanco | longo | artilharia | caca | bombardeio | suporte
// custo: recursos para treinar (Generais = soma ÷ 50)
// peso: espaço que ocupa no navio mercante (Wiki), só tropas de terra
export const UNIDADES = [
  // ---------- TERRA ----------
  { id: 'hoplita', nome: 'Hoplita', abrev: 'Hop', tipo: 'terra', linha: 'frente', icone: '🛡️', manut: 3, vel: 60, peso: 5, custo: { madeira: 40, enxofre: 30 } },
  { id: 'gigante', nome: 'Gigante a Vapor', abrev: 'GV', tipo: 'terra', linha: 'frente', icone: '⚙️', manut: 12, vel: 40, peso: 15, custo: { madeira: 130, enxofre: 180 } },
  { id: 'espadachim', nome: 'Espadachim', abrev: 'Esp', tipo: 'terra', linha: 'flanco', icone: '⚔️', manut: 4, vel: 60, peso: 3, custo: { madeira: 30, enxofre: 30 } },
  { id: 'lanceiro', nome: 'Lanceiro', abrev: 'Lan', tipo: 'terra', linha: 'flanco', icone: '🔱', manut: 1, vel: 60, peso: 3, custo: { madeira: 30 }, raro: true },
  { id: 'carabineiro', nome: 'Carabineiro', abrev: 'Car', tipo: 'terra', linha: 'longo', icone: '🎯', manut: 3, vel: 60, peso: 5, custo: { madeira: 50, enxofre: 150 }, municao: true },
  { id: 'arqueiro', nome: 'Arqueiro', abrev: 'Arq', tipo: 'terra', linha: 'longo', icone: '🏹', manut: 4, vel: 60, peso: 5, custo: { madeira: 30, enxofre: 25 }, raro: true, municao: true },
  { id: 'fundibulario', nome: 'Fundibulário', abrev: 'Fun', tipo: 'terra', linha: 'longo', icone: '🪨', manut: 2, vel: 60, peso: 3, custo: { madeira: 20 }, raro: true },
  { id: 'ariete', nome: 'Aríete', abrev: 'Ari', tipo: 'terra', linha: 'artilharia', icone: '🪵', manut: 15, vel: 40, peso: 30, custo: { madeira: 220 }, cerco: true },
  { id: 'catapulta', nome: 'Catapulta', abrev: 'Cat', tipo: 'terra', linha: 'artilharia', icone: '🏗️', manut: 25, vel: 40, peso: 30, custo: { madeira: 260, enxofre: 300 }, cerco: true, raro: true, municao: true },
  { id: 'morteiro', nome: 'Morteiro', abrev: 'Mor', tipo: 'terra', linha: 'artilharia', icone: '💣', manut: 30, vel: 40, peso: 30, custo: { madeira: 300, enxofre: 1250 }, cerco: true, municao: true },
  { id: 'girocoptero', nome: 'Girocóptero', abrev: 'Giro', tipo: 'terra', linha: 'caca', icone: '🚁', manut: 15, vel: 80, peso: 15, custo: { madeira: 25, enxofre: 100 } },
  { id: 'balao', nome: 'Balão Bombardeiro', abrev: 'Bal', tipo: 'terra', linha: 'bombardeio', icone: '🎈', manut: 45, vel: 20, peso: 30, custo: { madeira: 40, enxofre: 250 } },
  { id: 'cozinheiro', nome: 'Cozinheiro', abrev: 'Coz', tipo: 'terra', linha: 'suporte', icone: '🍲', manut: 10, vel: 40, peso: 20, custo: { madeira: 50, vinho: 150 } },
  { id: 'medico', nome: 'Médico', abrev: 'Méd', tipo: 'terra', linha: 'suporte', icone: '⚕️', manut: 20, vel: 60, peso: 10, custo: { madeira: 50, cristal: 450 } },
  // ---------- MAR ----------
  { id: 'lancachamas', nome: 'Lança-Chamas', abrev: 'LC', tipo: 'mar', linha: 'principal', icone: '🔥', manut: 25, vel: 40, custo: { madeira: 80, enxofre: 230 } },
  { id: 'arietevapor', nome: 'Aríete a Vapor', abrev: 'AV', tipo: 'mar', linha: 'principal', icone: '🐏', manut: 45, vel: 40, custo: { madeira: 400, enxofre: 800 } },
  { id: 'trirreme', nome: 'Trirreme', abrev: 'Tri', tipo: 'mar', linha: 'flanco', icone: '⛵', manut: 15, vel: 40, custo: { madeira: 250 } },
  { id: 'barcobalista', nome: 'Barco Balista', abrev: 'BB', tipo: 'mar', linha: 'longo', icone: '🎯', manut: 20, vel: 40, custo: { madeira: 180, enxofre: 160 }, raro: true },
  { id: 'barcocatapulta', nome: 'Barco Catapulta', abrev: 'BC', tipo: 'mar', linha: 'longo', icone: '🪨', manut: 35, vel: 40, custo: { madeira: 180, enxofre: 140 } },
  { id: 'barcomorteiro', nome: 'Barco Morteiro', abrev: 'BM', tipo: 'mar', linha: 'longo', icone: '💥', manut: 50, vel: 30, custo: { madeira: 220, enxofre: 900 } },
  { id: 'lancafoguetes', nome: 'Lança-Foguetes', abrev: 'LF', tipo: 'mar', linha: 'artilharia', icone: '🚀', manut: 55, vel: 30, custo: { madeira: 200, enxofre: 1200 } },
  { id: 'submergivel', nome: 'Submergível', abrev: 'Sub', tipo: 'mar', linha: 'artilharia', icone: '🤿', manut: 50, vel: 40, custo: { madeira: 160, cristal: 750 } },
  { id: 'lancharapida', nome: 'Lancha Rápida', abrev: 'LR', tipo: 'mar', linha: 'caca', icone: '🚤', manut: 5, vel: 60, custo: { madeira: 40, enxofre: 280 } },
  { id: 'portabaloes', nome: 'Porta-Balões', abrev: 'PB', tipo: 'mar', linha: 'bombardeio', icone: '🎪', manut: 100, vel: 20, custo: { madeira: 700, enxofre: 700 } },
  { id: 'reparador', nome: 'Reparador', abrev: 'Rep', tipo: 'mar', linha: 'suporte', icone: '🔧', manut: 100, vel: 30, custo: { madeira: 300, cristal: 250 } },
];

// Outros nomes que aparecem no jogo/fórum/v1 → id da unidade (para o leitor de relatórios)
export const APELIDOS = {
  'falange': 'hoplita', 'hoplitas': 'hoplita', 'gigantes a vapor': 'gigante', 'gigante': 'gigante', 'espartano': 'gigante',
  'espadachins': 'espadachim', 'lanceiros': 'lanceiro', 'fuzileiro': 'carabineiro', 'carabineiros': 'carabineiro',
  'atirador': 'carabineiro', 'arqueiros': 'arqueiro', 'fundeiro': 'fundibulario', 'arietes': 'ariete', 'catapultas': 'catapulta',
  'morteiros': 'morteiro', 'girocopteros': 'girocoptero', 'balao': 'balao', 'baloes': 'balao', 'bombardeiro': 'balao',
  'cozinheiros': 'cozinheiro', 'medicos': 'medico',
  'lanca chamas': 'lancachamas', 'navio lanca chamas': 'lancachamas', 'barco lanca chamas': 'lancachamas', 'navio porta incendio': 'lancachamas',
  'ariete a vapor naval': 'arietevapor', 'arietes a vapor': 'arietevapor', 'trireme': 'trirreme', 'trirremes': 'trirreme', 'triremes': 'trirreme',
  'barco ariete': 'trirreme', 'navio ariete': 'trirreme', 'barco de balista': 'barcobalista', 'barco de catapulta': 'barcocatapulta',
  'barco de morteiro': 'barcomorteiro', 'navio lanca foguetes': 'lancafoguetes', 'submersivel': 'submergivel', 'submarino': 'submergivel',
  'submarinos': 'submergivel', 'barco de rodas': 'lancharapida', 'lanchas rapidas': 'lancharapida', 'porta baloes': 'portabaloes',
  'barco reparador': 'reparador', 'barco de manutencao': 'reparador', 'reparadores': 'reparador',
};

export const LINHAS = {
  terra: [
    { id: 'frente', nome: 'Linha de Frente', icone: '🛡️', alvo: 'Frente → Longo alcance → Artilharia → Flancos' },
    { id: 'flanco', nome: 'Flancos', icone: '⚔️', alvo: 'Flancos → Longo alcance → Artilharia → Frente' },
    { id: 'longo', nome: 'Longo Alcance', icone: '🎯', alvo: 'Frente → Flancos → Longo alcance' },
    { id: 'artilharia', nome: 'Artilharia / Cerco', icone: '💣', alvo: 'Linha de Frente (e muralha)' },
    { id: 'caca', nome: 'Aéreo · Caça', icone: '🚁', alvo: 'Balões → outros Girocópteros' },
    { id: 'bombardeio', nome: 'Aéreo · Bombardeio', icone: '🎈', alvo: 'Artilharia → Longo alcance → Frente' },
    { id: 'suporte', nome: 'Suporte', icone: '🍲', alvo: 'Não luta: moral (Cozinheiro) e cura (Médico)' },
  ],
  mar: [
    { id: 'principal', nome: 'Linha Principal', icone: '🔥', alvo: 'Só a Linha Principal inimiga' },
    { id: 'flanco', nome: 'Flancos', icone: '⛵', alvo: 'Só Trirremes inimigos' },
    { id: 'longo', nome: 'Longo Alcance', icone: '🪨', alvo: 'Linha Principal' },
    { id: 'artilharia', nome: 'Artilharia', icone: '🚀', alvo: 'Destroem a Linha Principal inimiga' },
    { id: 'caca', nome: 'Aéreo · Caça', icone: '🚤', alvo: 'Lanchas Rápidas caçam Porta-Balões' },
    { id: 'bombardeio', nome: 'Aéreo · Bombardeio', icone: '🎪', alvo: 'Porta-Balões bombardeiam a Artilharia (Sub/LF)' },
    { id: 'suporte', nome: 'Suporte', icone: '🔧', alvo: 'Reparador: conserta a frota (não existe navio cozinheiro)' },
  ],
};

// Papéis táticos das cidades (Dossiê 6.1)
export const PAPEIS = [
  { id: 'capital', nome: 'Capital Hub', icone: '👑', dica: 'Centro de distribuição do império' },
  { id: 'cristal', nome: 'Cristal / Oficina', icone: '💎', dica: 'Pesquisa e Oficina' },
  { id: 'enxofre', nome: 'Enxofre / Pirotecnia', icone: '🔥', dica: 'Treinar tropas mais barato' },
  { id: 'vinho', nome: 'Vinho', icone: '🍇', dica: 'Abastece as tavernas' },
  { id: 'marmore', nome: 'Mármore', icone: '🏛️', dica: 'Construção' },
  { id: 'madeira', nome: 'Madeira', icone: '🪵', dica: 'Construção e tropas' },
  { id: 'ancora', nome: 'Cidade Âncora', icone: '⚓', dica: 'Base fixa perto do front' },
  { id: 'movel', nome: 'Cidade Móvel', icone: '🧭', dica: 'Slot coringa para pular para a guerra' },
];

export const CHECKLIST_MOVEL = [
  { id: 'fundar', texto: 'Fundar ao lado da guerra' },
  { id: 'porto', texto: 'Porto Nv. 1 construído' },
  { id: 'alarme', texto: 'Barco Alarme no porto (1 LC ou 1 Trirreme)' },
  { id: 'exercito', texto: 'Exército transferido de uma vez' },
];

export const RECURSOS = [
  { id: 'madeira', nome: 'Madeira', icone: '🪵' },
  { id: 'vinho', nome: 'Vinho', icone: '🍇' },
  { id: 'marmore', nome: 'Mármore', icone: '🏛️' },
  { id: 'cristal', nome: 'Cristal', icone: '💎' },
  { id: 'enxofre', nome: 'Enxofre', icone: '🔥' },
];

// Bônus de velocidade (Wiki: Speed (travel))
export const POSEIDON_BONUS = [0, 0.10, 0.30, 0.50, 0.70, 1.00]; // nível 0..5 do Milagre de Poseidon
export const TRITAO_BONUS = [0, 1, 2, 3]; // +0%, +100%, +200%, +300%
export const OLIGARQUIA_MULT = 1.10;

// Estratégia "Lança-Chamas Tank" (Dossiê 3.1 — guia do Gaelll no fórum)
export const LC_PRESETS = [
  { id: 'lc12', qtd: 12, slots: 1, rodadas: 1, titulo: '12 LCs · 1 slot', texto: 'Dura 1 rodada (15 min). Morrem todos e o Ponto de Ação volta.', timerMin: 15 },
  { id: 'lc36', qtd: 36, slots: 3, rodadas: null, titulo: '36 LCs · 3 slots', texto: 'Melhor troca de dano por generais (≈37% de perda contra 63% do oponente). Exige recuo manual.', timerMin: 15 },
  { id: 'lc43', qtd: 43, slots: 3, rodadas: 2, titulo: '43 LCs · 3 slots + 7 reserva', texto: 'Dura 2 rodadas (30 min) e zera na 2ª sem congelar o Ponto de Ação.', timerMin: 30 },
];

// Cronômetros rápidos de guerra
export const PRESETS_GUERRA = [
  { id: 'rodada', icone: '⚔️', nome: 'Rodada de batalha', min: 15, dica: 'Cada rodada dura 15 min' },
  { id: 'municao', icone: '💣', nome: 'Rotação de munição', min: 45, dica: 'Mande a reposição; só recue a leva velha quando a nova chegar' },
  { id: 'disperso', icone: '🔁', nome: 'Alvo dispersou', min: 60, dica: 'Sem cozinheiros, o exército volta em 60 min: ataque no retorno' },
  { id: 'lc2', icone: '🔥', nome: 'LC Tank 2 rodadas', min: 30, dica: 'Preset de 43 LCs' },
];

// Missões da Fortaleza Pirata (duração)
export const PIRATARIA = [
  { id: 'p1', nome: 'Navegação costeira', seg: 150 },
  { id: 'p2', nome: 'Saque ao vilarejo', seg: 450 },
  { id: 'p3', nome: 'Pilhagem de navios', seg: 900 },
  { id: 'p4', nome: 'Ataque ao entreposto', seg: 1800 },
  { id: 'p5', nome: 'Cerco à baía', seg: 3600 },
  { id: 'p6', nome: 'Mares proibidos', seg: 7200 },
  { id: 'p7', nome: 'Domínio do arquipélago', seg: 14400 },
  { id: 'p8', nome: 'Incursão noturna', seg: 28800 },
];

// Milagres: o tempo de recarga depende do nível do templo — o app deixa você ajustar (Sistema)
export const MILAGRES = [
  { id: 'poseidon', nome: 'Poseidon', icone: '🔱', efeito: 'Navios mais rápidos', recargaH: 24 },
  { id: 'hefesto', nome: 'Forja de Hefesto', icone: '🔨', efeito: 'Dano e armadura em batalha', recargaH: 48 },
  { id: 'colosso', nome: 'Colosso', icone: '🗿', efeito: 'Expulsa invasores', recargaH: 72 },
  { id: 'atena', nome: 'Atena', icone: '🦉', efeito: 'Protege recursos do saque', recargaH: 24 },
  { id: 'ares', nome: 'Ares', icone: '🪖', efeito: 'Moral das tropas', recargaH: 48 },
  { id: 'hermes', nome: 'Hermes', icone: '🪽', efeito: 'Carga rápida no porto', recargaH: 24 },
  { id: 'demeter', nome: 'Deméter', icone: '🌾', efeito: 'Crescimento da população', recargaH: 36 },
  { id: 'dionisio', nome: 'Dionísio', icone: '🍇', efeito: 'Satisfação', recargaH: 36 },
];

// Guia da Oficina (Horizontes Infinitos: nível sem limite) — Dossiê 5 + prompt da v2
export const OFICINA = {
  pvp: [
    { u: 'Trirreme', o: 'Dano e Armadura', por: 'Decide a briga dos flancos navais' },
    { u: 'Aríete a Vapor', o: 'Dano e Armadura', por: 'Linha principal naval de elite' },
    { u: 'Lança-Chamas', o: 'Armadura', por: 'Parede barata contra Lança-Foguetes' },
    { u: 'Submergível', o: 'Dano', por: 'Artilharia naval que derruba a linha principal' },
    { u: 'Hoplita', o: 'Dano e Armadura', por: 'Linha de frente terrestre' },
    { u: 'Porta-Balões', o: 'Dano até o 1-hit kill', por: 'Pare quando 1 tiro já derruba 1 Submergível' },
  ],
  pve: [
    { u: 'Gigante a Vapor', o: 'Armadura', por: 'Bárbaros não têm Hefesto: armadura anula o dano deles' },
    { u: 'Carabineiro', o: 'Dano', por: 'Limpa a vila bárbara mais rápido' },
    { u: 'Trirreme', o: 'Dano e Armadura', por: 'Frota bárbara nos níveis altos' },
  ],
  evitar: [
    { u: 'Espadachim', o: 'Qualquer', por: 'Pouco impacto no meta atual' },
    { u: 'Gigante a Vapor', o: 'Armadura (PvP)', por: 'Em PvP o retorno é baixo; em PvE vale' },
    { u: 'Carabineiro / Girocóptero', o: 'Dano (PvP)', por: 'Situacional; priorize a linha de frente' },
  ],
};

// Regras do motor de combate (Dossiê 2.3) — usadas no "Pré-batalha"
export const REGRAS_COMBATE = [
  { icone: '🏳️', titulo: 'Recuo automático', texto: 'Sem Linha Principal (terra ou mar) o exército inteiro recua, mesmo com outras unidades.' },
  { icone: '🤝', titulo: 'Batalha em aliança', texto: 'Unidades com MENOS upgrade entram primeiro na frente / porta-balões, antes das mais fortes dos aliados.' },
  { icone: '💥', titulo: 'Dano excedente se perde', texto: 'O dano não passa para a próxima unidade: é a base do Lança-Chamas Tank.' },
  { icone: '🔄', titulo: 'Sem troca automática', texto: 'Morteiros/Carabineiros sem munição não são trocados sozinhos: recue a leva velha depois que a nova chegar.' },
  { icone: '🍲', titulo: 'Sem cozinheiro = dispersão', texto: 'Moral zerada faz o exército dispersar e voltar à cidade em 60 min.' },
];

export const VERSAO_APP = '2.0.0';
