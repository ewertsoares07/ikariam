# Índice do Comando Imperial

Leia este arquivo antes de abrir qualquer outro. Ele diz onde fica cada coisa, para abrir só os arquivos que a mudança precisa.

App estático (HTML + JS puro em módulos ES, sem build, sem npm). Firebase só para login Google, nuvem e aliança. Publicado no Netlify a partir da pasta `Ikariam/` do GitHub.

## Onde mexer para cada tipo de pedido

| Pedido | Abra só |
|---|---|
| Valor ou regra do jogo (velocidade, custo, carga, milagres, bônus) | `js/data.js` |
| Conta/fórmula (viagem, vinho, corrupção, saque, exército) | `js/calc.js` (+ `testes/teste_calc.mjs`) |
| Leitura de relatório colado do jogo | `js/parser.js` |
| Simulador de combate: regras da rodada, mira, reserva, recuo/impasse | `js/combate.js` (+ `testes/teste_combate.mjs`) |
| Vida/armadura/dano/espaço das unidades e tamanho do campo | `js/data.js` → `COMBATE`, `CAMPO`, `ALVOS` |
| Texto, botão ou layout de uma tela | `js/views/<tela>.js` |
| Cor, espaçamento, base visual | `css/app.css` |
| Tema Clássico Grego (mármore, bronze, vinho, meandro, fontes) | `css/grego.css` (carrega depois de app/menu) |
| Tabuleiro, taça de vinho, pílulas, anéis, chave Paz/Guerra, rota | `css/tatico.css` |
| Ícones SVG (unidades, navios, império, papéis, interface) | `js/icones.js` (`icone(nome)`, `iconeUnidade(id)`) |
| Menu em folha do botão do meio | `js/menu.js`, `css/menu.css` |
| Folha que sobe de baixo (genérica) | `js/folha.js` |
| Modal de edição (número, texto, campos, escolher) e balões de dica | `js/modal.js` (estilo no fim de `css/app.css`) |
| Alarme, som, voz, notificação, agenda; animação por segundo das taças (`data-taca`) e anéis (`data-anel-fim`) | `js/timers.js` |
| Dados salvos no aparelho (estado) | `js/store.js` |
| Login, sincronização, aliança | `js/cloud.js`, `js/config.js`, `firestore.rules` |
| Rotas, barra de baixo, instalar, tema | `js/app.js` |
| Casca da página, título | `index.html` |
| Nome/ícone do app instalado | `manifest.webmanifest`, `icons/` |
| Funcionar offline / forçar atualização | `sw.js` |
| Cabeçalhos e config do Netlify | `netlify.toml` |

## Telas (`js/views/`)

| Arquivo | Tela | Usa |
|---|---|---|
| `inicio.js` | Início: briefing, checklist pré-sono, alarmes, atalhos | timers, calc, data |
| `imperio.js` | Pílulas do checklist pré-sono (filtram), cidades em sanfona (abre uma por vez): tags de função, escudo do Barco Alarme no cabeçalho, taça de vinho líquida (`tacaHtml`), repor 7/14/30d com barcos, card da Cidade Móvel (Ativar no Front / Abandonar) e da Âncora; editar = modal | store, timers, data, calc, icones |
| `militar.js` (maior: ~400 linhas) | Exército por cidade com chave Paz (1×) / Guerra (2×) (`config.modoGuerra`), rota marítima visual com Tridente de Poseidon (`rotaHtml`), anéis de cronômetro no Waving (`ANEIS`: munição 45, reagrupamento 60, LC Tank 15/30), flancos; a aba Simulador chama `simulador.js` | store, timers, data, calc, icones |
| `simulador.js` | Tabuleiro de combate (naval/terrestre): espaços tocáveis, popover numérico, presets LC, rodada animada, faixas de recuo/impasse/aliança | combate, data, calc, icones |
| `alvos.js` | Caderno de espionagem, leitor de relatório, saque | store, data, calc, parser |
| `cronometros.js` | Alarmes, pirataria, recarga de milagres | store, timers, data |
| `pve.js` | Vila dos Bárbaros por ilha, Emboscada Abissal | store, timers, data |
| `guias.js` | Oficina (Horizontes Infinitos), regras de combate | data |
| `alianca.js` | Operações, alvos compartilhados, mural, membros | store, timers, cloud, config |
| `sistema.js` | Conta e nuvem, ajustes (inclui apagar tudo), sobre | store, timers, cloud, config |
| `comum.js` | Pedaços usados em várias telas (timer, seletor de cidade, grade de unidades, colar) | store, timers, ui |

Cada tela exporta `render`. As rotas são `#/tela/sub` e ficam em `js/app.js`.

## Núcleo (`js/`)

- `data.js`: todas as regras do jogo (`UNIDADES`, `LINHAS`, `RECURSOS`, `PIRATARIA`, `MILAGRES`, `OFICINA`, `PRESETS_GUERRA`, `LC_PRESETS`, `VERSAO_APP`…).
- `calc.js`: funções puras, sem tela (`distancia`, `tempoViagem`, `vinhoAgora`, `habitantesAgora`, `humor`, `corrupcao`, `saque`, `resumoExercito`, `flancoNaval`…).
- `store.js`: estado único no `localStorage` (`get`, `set`, `on`, `cidade`, `substituir`). Sem backup nem importação: a cópia de segurança é só o Firebase.
- `ui.js`: formatação (`fmt`, `fmtDur`, `fmtHora`…), `toast`, `confirmar`, `copiar`, `baixar`, campos; reexporta os modais de `modal.js`.
- `modal.js`: `modal`, `pedirNumero`, `pedirTexto`, `pedirCampos`, `escolher`; balão automático em qualquer `data-balao="texto"` (`data-balao-t` = título).

Padrão de tela: mostrar informação em quadros (`.dado`, `.painel`) e editar tocando, com modal. Campos soltos só nas calculadoras.
- `cloud.js`: Firebase; o SDK só é baixado quando a pessoa entra.
- `config.js`: config do Firebase, `EMAIL_DONO`, papéis da aliança.

## Nomes que não podem mudar

Mudar estes nomes apaga o que já está salvo nos aparelhos:
- chave `ikariam_v2_state` e `ikariam_v2_logado`;

## Toda vez que mudar um arquivo do app

1. Suba a `VERSAO` no topo do `sw.js` (ex.: `imperial-2.0.0` → `imperial-2.0.1`). Se não subir, o celular continua com a versão velha.
2. Arquivo novo? Coloque também na lista `ARQUIVOS` do `sw.js`.
3. Mexeu em `calc.js` ou `parser.js`? Rode `node testes/teste_calc.mjs`. Mexeu em `combate.js` ou em `COMBATE`? Rode `node testes/teste_combate.mjs`.
4. Mudou o que um arquivo faz ou criou um arquivo? Atualize este índice.

Documentação mais longa: `LEIA-ME.md` (deploy, Firebase, dados a conferir). Regras e metagame do jogo: `docs/Dossiê Ikariam (Metagame & Regras).md`. Só abra se o pedido precisar.
