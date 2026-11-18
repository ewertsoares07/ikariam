# Instruções do projeto Ikariam (Comando Imperial)

App PWA estático de apoio ao jogo Ikariam (Gameforge). HTML + JS puro em módulos, sem build e sem npm. Firebase para login Google, nuvem e aliança. Responda sempre em português.

## Onde o app mora (os dois lugares precisam ficar iguais)

- **Meu computador:** `D:\Ewerton\Projetos\Ikariam\v2`
- **GitHub:** repositório `ewertsoares07/ikariam`, branch `main`, tudo dentro da pasta `Ikariam/` (com I maiúsculo). Não deixe arquivos soltos na raiz do repositório.
- **Netlify:** publica sozinho a pasta `Ikariam/` do GitHub a cada push. Base directory = `Ikariam`, sem comando de build.

A pasta `v2` do computador corresponde à pasta `Ikariam/` do GitHub, arquivo por arquivo.

## Economizar créditos

1. Comece lendo só `indice.md`. Ele diz qual arquivo mexer para cada tipo de pedido.
2. Abra apenas os arquivos que o índice indicar. Não leia a pasta inteira nem o `LEIA-ME.md` ou o Dossiê sem necessidade.
3. Em arquivo grande, leia só o trecho necessário (procure pelo nome da função ou do texto antes).
4. Edite trechos, não reescreva arquivos inteiros.
5. Não peça confirmação para mudanças pequenas e claras: faça e diga em poucas linhas o que mudou.
6. Respostas curtas, sem repetir o código que já foi salvo.

## Toda alteração no app segue este fluxo

1. Ler `indice.md` e os arquivos indicados (do computador ou do GitHub; os dois são iguais).
2. Fazer a mudança.
3. Subir a `VERSAO` no topo do `sw.js` (ex.: `imperial-2.0.1` → `imperial-2.0.2`). Arquivo novo também entra na lista `ARQUIVOS` do `sw.js`.
4. Se mexeu em `js/calc.js` ou `js/parser.js`, rodar `node testes/teste_calc.mjs`.
5. Se criou arquivo ou mudou o papel de um, atualizar `indice.md`.
6. **Salvar no meu computador**, em `D:\Ewerton\Projetos\Ikariam\v2`, os mesmos arquivos alterados.
7. **Enviar ao GitHub** dentro de `Ikariam/`: commit em `main` com mensagem curta em português e push. O Netlify atualiza sozinho.
8. Me dizer em uma ou duas frases o que mudou e se o computador e o GitHub ficaram iguais. Se algum dos dois não deu, avisar claramente.

## Não mudar

- Nomes de armazenamento e backup: `ikariam_v2_state`, `ikariam_v2_logado`, prefixos `IKV2.`/`IKV2Z.`, `app: 'ikariam-v2'`. Trocar apaga dados salvos e quebra backups.
- `js/config.js` (Firebase) e `firestore.rules` só quando eu pedir. Se mudar as regras, lembrar que preciso publicá-las no console do Firebase.
- Não adicionar build, framework nem dependências npm.
