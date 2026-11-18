# Índice do Comando Imperial

Leia este arquivo antes de abrir qualquer outro. Ele diz onde fica cada coisa, para abrir só os arquivos que a mudança precisa.

App estático (HTML + JS puro em módulos ES, sem build, sem npm). Firebase só para login Google, nuvem e aliança. Publicado no Netlify a partir da pasta `Ikariam/` do GitHub.

## Onde mexer para cada tipo de pedido

| Pedido | Abra só |
|---|---|
| Valor ou regra do jogo (velocidade, custo, carga, milagres, bônus) | `js/data.js` |
| Conta/fórmula (viagem, vinho, corrupção, saque, exército) | `js/calc.js` (+ `testes/teste_calc.mjs`) |
| Leitura de relatório colado do jogo | `js/parser.js` |
| Texto, botão ou layout de uma tela | `js/views/<tela>.js` |
| Cor, espaçamento, tema | `css/app.css` |
| Menu em folha do botão do meio | `js/menu.js`, `css/menu.css` |
| Folha que sobe de baixo (genérica) | `js/folha.js` |
| Alarme, som, voz, notificação, agenda | `js/timers.js` |
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
| `imperio.js` | Cidades, vinho de cada taverna, segurança dos portos | store, timers, data |
| `militar.js` (maior: ~300 linhas) | Exército por cidade, viagem, waving/LC tank, pré-batalha, flancos | store, timers, data, calc |
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
- `calc.js`: funções puras, sem tela (`distancia`, `tempoViagem`, `vinhoAgora`, `corrupcao`, `saque`, `resumoExercito`, `flancoNaval`…).
- `store.js`: estado único no `localStorage` (`get`, `set`, `on`, `cidade`, `substituir`). Sem backup nem importação: a cópia de segurança é só o Firebase.
- `ui.js`: formatação (`fmt`, `fmtDur`, `fmtHora`…), `toast`, `confirmar`, `copiar`, `baixar`, campos.
- `cloud.js`: Firebase; o SDK só é baixado quando a pessoa entra.
- `config.js`: config do Firebase, `EMAIL_DONO`, papéis da aliança.

## Nomes que não podem mudar

Mudar estes nomes apaga o que já está salvo nos aparelhos:
- chave `ikariam_v2_state` e `ikariam_v2_logado`;

## Toda vez que mudar um arquivo do app

1. Suba a `VERSAO` no topo do `sw.js` (ex.: `imperial-2.0.0` → `imperial-2.0.1`). Se não subir, o celular continua com a versão velha.
2. Arquivo novo? Coloque também na lista `ARQUIVOS` do `sw.js`.
3. Mexeu em `calc.js` ou `parser.js`? Rode `node testes/teste_calc.mjs`.
4. Mudou o que um arquivo faz ou criou um arquivo? Atualize este índice.

Documentação mais longa: `LEIA-ME.md` (deploy, Firebase, dados a conferir). Regras e metagame do jogo: `docs/Dossiê Ikariam (Metagame & Regras).md`. Só abra se o pedido precisar.
