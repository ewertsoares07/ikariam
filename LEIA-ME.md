# Comando Imperial 2.0 · Ikariam

App de apoio para Ikariam, feito para o celular. Funciona sem internet e não tem etapa de build: é HTML, CSS e JavaScript puro em vários arquivos.

## O que mudou da v1

- **Fim do controle de recursos.** Não tem mais estoque de madeira, mármore etc. por cidade. Recurso só aparece onde serve: saque, carga de navio e vinho.
- **Vinho sem trabalho.** Você informa o estoque e o consumo só quando abastece. O app conta sozinho, mostra a hora em que seca e acende o alerta vermelho no topo quando faltam menos de 12h.
- **Cálculos conferidos.** Viagem = distância × 1200 ÷ velocidade (mesma ilha = 0,5); corrupção pelo nível do Palácio/Residência; peso das tropas no navio pela Wiki.
- **Colar do jogo.** Relatório de espionagem e tela de tropas: copie, cole e o app lê os números.
- **Aliança.** Login com Google, cargos (líder, oficial, membro) e operações em que cada membro vê a própria hora de partida.
- **Seus dados protegidos.** As regras novas do Firestore fecham o banco. Na v1 qualquer pessoa podia ler e apagar tudo.

## Colocar no ar (Netlify)

1. Entre em app.netlify.com › **Add new site › Deploy manually** e arraste a pasta `v2`.
   (Ou ligue o repositório e use `v2` como *Base directory*. Não precisa de comando de build.)
2. Anote o endereço (ex.: `comando-imperial.netlify.app`).
3. Abra o endereço no celular. No Chrome, menu ⋮ › **Instalar app**. No iPhone, **Compartilhar › Adicionar à Tela de Início**.

## Configurar o Firebase (uma vez só)

No console do Firebase, projeto **myikariamlog21**:

1. **Authentication › Método de login** › ative o **Google**.
2. **Authentication › Configurações › Domínios autorizados** › adicione o endereço do Netlify.
3. **Firestore Database › Regras** › apague tudo, cole o conteúdo de `firestore.rules` e clique em **Publicar**.
4. Abra o app, vá em **Sistema › Conta › Entrar com Google** com `ewert.soares07@gmail.com`. Essa conta já entra como **Líder**.

### Trazer os dados da v1

Com o login feito, vá em **Sistema › Backup › Puxar direto da nuvem da v1**. Isso lê o save antigo (`imperial_saves/dados_imperiais`); as regras novas só deixam o dono ler esse save.
Outro caminho: na v1, **Notas › Exportar JSON** e aqui **Importar arquivo**.

### Aliança

- Quem entra com Google aparece em **Menu › Membros** como "Aguardando".
- O líder escolhe o cargo de cada um:
  - **Membro**: vê e confirma operações, compartilha alvos e lê o mural.
  - **Oficial**: também cria operações e avisos.
- O império de cada jogador fica separado (`saves/{uid}`). Ninguém vê as cidades dos outros.

## Alarmes com o app fechado

Navegadores não deixam um site tocar alarme com o app fechado. Por isso cada cronômetro tem **⋯ › Pôr na Google Agenda** (ou baixar `.ics`): o alarme toca pela agenda do celular. Com o app aberto ou em segundo plano, ele toca corneta, vibra e fala.

## Onde mexer

| Quero… | Arquivo |
| --- | --- |
| Corrigir velocidade, custo, peso ou manutenção de unidade | `js/data.js` |
| Mudar uma fórmula | `js/calc.js` (testes: `node testes/teste_calc.mjs`) |
| Melhorar o leitor de relatório colado | `js/parser.js` |
| Cores e visual | `css/app.css` (app) e `css/menu.css` (menu em folha) |
| Itens do menu do botão do meio | `js/app.js` › `itensMenu()` |
| Uma tela | `js/views/<tela>.js` |
| Firebase, login e aliança | `js/cloud.js`, `js/config.js`, `firestore.rules` |
| Lista de arquivos guardados offline | `sw.js` |

**Publicou mudança?** Suba a `VERSAO` no topo do `sw.js` (ex.: `imperial-2.0.1`). Assim o celular baixa a versão nova.

### Mapa rápido

```
index.html          casca: topo, barra de baixo e botão do menu
js/app.js           rotas (#/tela/sub), menu, instalar, tema, relógio
js/store.js         estado único (localStorage "ikariam_v2_state"), backup e importação da v1
js/cloud.js         Firebase (só baixa o SDK quando você entra), sincronização e aliança
js/timers.js        cronômetros, som, voz, notificação e agenda
js/folha.js         folha que sobe de baixo (arrastar para fechar, voltar do Android)
js/views/           inicio, imperio, militar, alvos, cronometros, pve, guias, alianca, sistema
```

## Dados a conferir no jogo

Conferidos na Wiki: velocidade do mercante (60), do Trirreme (40) e das tropas de terra, distância 0,5 na mesma ilha, peso das tropas no navio e a regra do Palácio/Residência.
Vieram da v1 ou de memória (troque em `js/data.js` se o jogo mostrar outro valor):

- velocidade dos outros navios de guerra;
- custo em recursos das unidades (usado nos generais);
- capacidade do cargueiro;
- recarga dos milagres (dá para ajustar no próprio app).
