# 📖 Dossiê Ikariam: Mecânicas Avançadas e Metagame (Guia de Desenvolvimento)

Este documento centraliza as regras, fórmulas e estratégias do meta atual do **Ikariam (Versão Horizontes Infinitos - 2026)**. O objetivo é fornecer contexto para o desenvolvimento de ferramentas auxiliares (PWA), definindo claramente **o que importa** e **o que deve ser descartado** na modelagem de dados.

---

## 🛑 1. O Que Descartar (Não Tentar Modelar no App)
Para manter o aplicativo leve e útil, as seguintes mecânicas do jogo **não** devem ser rastreadas continuamente:
*   **Saldo Contínuo de Recursos:** Madeira, Mármore, Cristal e Enxofre flutuam a cada segundo. O app deve calcular apenas necessidades pontuais (ex: capacidade de barcos para saque) e ignorar saldos gerais.
*   **Simulação de Dano Fracionado 100% Exata:** O jogo usa matrizes complexas, precisão oculta e redistribuição de dano (RR - *Reserve Redistribution*). O simulador do app deve prever a **vitória/derrota e perdas médias**, e alertar sobre impasses, mas não precisa calcular a sobra de HP exata de cada unidade individual.

---

## ⚔️ 2. Mecânicas de Combate e Prioridades de Alvo
No Ikariam, as unidades não atacam alvos aleatórios. O sistema segue prioridades estritas.

### 2.1 Ordem de Ataque Terrestre
1.  **Linha de Frente (Hoplitas / Gigantes a Vapor / Espartanos):** Focam a Linha de Frente inimiga -> Linha de Longo Alcance -> Artilharia -> Flancos (Espadachins/Lanceiros).
2.  **Flancos (Espadachins / Lanceiros):** Focam Flancos -> Longo Alcance -> Artilharia -> Linha de Frente.
3.  **Longo Alcance (Carabineiros / Arqueiros):** Focam Linha de Frente -> Flancos -> Longo Alcance.
4.  **Artilharia (Morteiros / Catapultas / Aríetes):** Focam primariamente na Linha de Frente.
5.  **Aéreo:** Girocópteros focam Balões (depois outros girocópteros). Balões focam Artilharia (depois Longo Alcance e Linha de Frente).

### 2.2 Ordem de Ataque Naval
1.  **Linha Principal (Lancha-Chamas / Aríetes a Vapor):** Focam exclusivamente a Linha Principal inimiga.
2.  **Flancos (Trirremes):** Focam estritamente Trirremes inimigos.
3.  **Aéreo (Porta-Balões / Lanchas Rápidas):** Lanchas Rápidas caçam Porta-Balões. Porta-Balões bombardeiam a Artilharia inimiga (Submarinos/Lança-Foguetes).
4.  **Artilharia:** Submarinos / Lança-Foguetes destroem a Linha Principal inimiga.

### 2.3 Regras Críticas do Motor de Combate
*   **Recuo Automático (Impasse):** Se um lado ficar sem a **Linha Principal** (Terrestre ou Naval), o exército inteiro entra em colapso e recua automaticamente, mesmo tendo outras unidades. *Ex: Mandar Submarinos e Lanchas Rápidas sem Lança-Chamas/Aríetes causa recuo imediato (fuga).*
*   **Hierarquia de Força em Alianças:** Em batalhas conjuntas, o jogo posiciona as unidades com **MENORES upgrades primeiro**. Tropas fracas morrem na frente para proteger as de elite.
*   **Dano Excedente (Overkill):** O dano não rola para a próxima unidade além da vida da unidade atual num embate individual (X ataca Y). Isso fundamenta a estratégia do Lança-Chamas Tank.
*   **Substituição Manual (Sem Fusão Automática):** Tropas com munição esgotada (Morteiros, Carabineiros) **NÃO** são substituídas automaticamente por reservas se as reservas entrarem no mesmo round sem que as esgotadas sejam recuadas.

---

## 🧠 3. Estratégias do Metagame (Automações para o App)

### 3.1 A Estratégia "Lança-Chamas (LC) Tank"
Lança-Foguetes (LF) causam dano massivo. Para não perder os caros Aríetes a Vapor (AVs), usa-se uma "parede" barata de Lança-Chamas. Como o LF dá muito mais dano que a vida do LC, o dano excedente é desperdiçado (jogado fora pelo motor do jogo).
*   **Preset 1 (12 LCs):** Preenche 1 slot. Dura 1 rodada (15 min). Morrem todos, devolvendo o Ponto de Ação da cidade.
*   **Preset 2 (36 LCs):** 3 slots. Melhor eficiência de dano vs. generais perdidos (37% perdas contra 63% do oponente). Exige recuo manual.
*   **Preset 3 (43 LCs):** 3 slots (36) + 7 na reserva. Dura 2 rodadas completas (30 min) e zera na segunda rodada sem congelar Ponto de Ação.

### 3.2 O Ciclo de Trocas (Waving) e Controle de Munição
*   Morteiros e Carabineiros têm munição contada (ex: 3 rodadas para Morteiros = 45 minutos).
*   **A Solução (Timer de 45m):** O jogador envia a Reposição no 3º round. *Somente quando a nova chegar* (passo 1), ele dá a ordem de recuo para a leva velha sem munição (passo 2). O app precisa de um **Cronômetro Tático de Munição**.

### 3.3 Dispersão, Reagrupamento e Limpeza de Cidades
Quando um exército sem **Cozinheiros** perde por moral zerada, as tropas "dispersam" e reaparecem na cidade de origem exatamente **60 minutos** depois.
*   **O Problema do Roubo (Farm):** Ao atacar alvos assim, a moral zera antes de você aniquilar as tropas. O exército inimigo foge e volta 1 hora depois, exigindo nova guerra para roubar de novo.
*   **Guerra de Desgaste (Timer de 1 hora):** Atacar com força total na hora exata em que o exército retornar. O app precisa de um timer *"Dispersou Agora"* de 60 minutos para atacar o alvo no retorno e zerar os soldados inimigos permanentemente.

---

## 🛠️ 4. Fórmulas Matemáticas a Embutir no App

### 4.1 Cálculo de Saque e Pontos Generais
*   **Custo em Generais:** $\text{Custo de Produção em Recursos} \div 50$
*   O Ouro saqueado **não** ocupa espaço nos Barcos Mercantes (cada barco leva 500 recursos comuns).

### 4.2 Equação de Combate nos Flancos Navais (Triremes)
Nos flancos navais (Trirreme vs Trirreme), a quantidade $N$ de Trirremes seus necessários para abater 1 Trirreme inimigo por rodada é:
$$N = \frac{\text{Vida}_{\text{Trirreme}}}{(1500 + \text{Upgrade}_{\text{Ataque}} \times 10) \times \text{Forja} - \text{Armadura}_{\text{Forja}} - 180 - \text{Upgrade}_{\text{Armadura}} \times 10}$$

### 4.3 Dano no Evento Emboscada Abissal (PvE)
*   **Regras:** Limite de **1.000 de peso** por ataque. Todas as unidades enviadas são perdidas após 1 rodada. Sem efeito da Oficina ou Milagres.
*   **Cálculo de Dano Eficiente:** Enviar unidades baseadas na Fraqueza atual do monstro (80% a 120% de eficácia). Não enviar unidades focadas em defesa (como Hoplitas) se houverem alternativas de alto dano base.
*   **Fórmula:** $\text{Quantidade} \times \text{Dano Base} \times \text{Eficácia\%}$

---

## 🏗️ 5. Oficina (Horizontes Infinitos) e Forja de Hefesto
No meta atual, a Oficina não tem limite de nível.
*   **Útil para PvP:** Upgrades massivos de Dano e Armadura para Linha de Frente e Triremes. Subir dano do Porta-Balões até atingir o limite para abater 1 Submarino com apenas um tiro (Hit Kill).
*   **Útil para PvE (Bárbaros):** Como bárbaros não têm Milagres (Hefesto), basta subir a Oficina o suficiente para anular o dano deles. (Focar em Armadura do Gigante a Vapor, Dano de Carabineiros e Triremes).

---

## 🏘️ 6. Estrutura do Império e Controle

### 6.1 Papéis Táticos das 12 Cidades
O app deve classificar cidades por *Tags*:
1.  **Capital Hub:** Distribuição central (estoque de Vinho Nv. 50).
2.  **Cristal / Oficina:** Concentração de pesquisas/Oculista.
3.  **Enxofre / Pirotecnia:** Para treinar tropas mais barato.
4.  **Cidade Âncora:** Base fixa perto do *front* de guerra. Evita viagens de 24h a cada ataque.
5.  **Cidade Móvel (Slot Coringa):** Usada para "pular" para áreas de guerra. Checklist: Fundar ao lado da guerra -> Upar Porto -> Colocar Barco Alarme -> Transferir exército de 1 vez. Abandone a cidade ao fim da guerra.

### 6.2 Monitor Inteligente de Vinho (Anti-Revolta)
Apenas informando o Estoque Atual e o Consumo Líquido por hora da Taverna, o app calcula a data e hora do zeramento (Contagem regressiva: Verde > 7 dias; Amarelo < 48h; Vermelho < 12h).

### 6.3 Táticas de Manutenção de Ouro e Defesa Local (Barco Alarme)
*   **Barco Alarme:** Manter sempre **1 Lancha-Chamas** ou **1 Barco-Aríete** na defesa do porto de todas as cidades (nunca deixar Submarinos, pois são caros). Isso força o inimigo a lutar pelo menos 1 round naval, disparando o alarme de invasão e bloqueando furtos rápidos direto nos barcos de transporte.
*   **Manutenção de Ouro:** Tropas estacionadas em cidade própria consomem **1x** (custo base). Tropas ocupando, atacando ou estacionadas longe consomem **2x**.

---

## 🔗 7. Referências dos Guias Oficiais do Fórum (2026)
*   [Guia] Lança Chamas Tank [25] - Por Gaelll
*   [Guia] O que melhorar na Oficina? [2]
*   [Informe] Perdas navais nos flancos [2]
*   [Tutorial] Evento Abyssal [6]
*   [Guia] Campo de batalha e suas prioridades [2]
*   [Guia] Classificação do Ikariam [2]