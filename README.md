# Olympus Protocol

Aplicação web (PWA) de treinos, interface para consumir a [Olympus Protocol API](https://olympusprotocol.onrender.com), o backend em Java/Spring Boot que concentra toda a lógica de negócio do projeto.

🔗 **APP:** https://olympus-protocol.vercel.app/
🔗 **Backend/API:** https://olympusprotocol.onrender.com
🔗 **Repositório da API:** [OlympusProtocolAPI](https://github.com/<seu-usuario>/OlympusProtocolAPI)

---

## Sobre o projeto

Este repositório contém o frontend do Olympus Protocol, uma PWA que permite ao usuário criar planos de treino, executar sessões (a partir de um plano ou livre), acompanhar séries/exercícios em tempo real e visualizar estatísticas de evolução.

O frontend foi construído com o auxílio do **[Lovable](https://lovable.dev)**, uma ferramenta de geração de UI orientada por IA. Meu papel no processo foi:

- Definir a arquitetura de integração com a API (tipos TypeScript, interceptors de autenticação, tratamento de erros)
- Escrever os prompts que guiam a geração de cada tela/fluxo
- Revisar, ajustar e validar o código gerado antes de ir para produção
- Garantir consistência entre o que a API retorna e o que a interface espera (ex: distinção entre `sessionExerciseId` e `exerciseId`)

> Uso o Lovable também para iterar diretamente neste repositório ou seja, boa parte dos commits vem de alterações geradas via prompt, sem passar por um fluxo manual de `git clone` a cada ajuste pontual de UI. As decisões de arquitetura, integração com a API e lógica mais sensível (como sincronização offline) são pensadas e validadas por mim.

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Geração de UI | Lovable |
| Linguagem | TypeScript |
| Tipo de app | PWA (Progressive Web App) |
| Sincronização offline (planejado) | Dexie.js (IndexedDB + Background Sync) |

---

## 🔌 Integração com a API

O frontend consome a Olympus Protocol API via REST, com autenticação JWT. Pontos de atenção documentados para manter consistência entre front e back:

- **Tipos TypeScript** gerados a partir dos DTOs de resposta da API
- **Interceptor de autenticação** para anexar o JWT nas requisições e tratar expiração/refresh
- **`sessionExerciseId` vs `exerciseId`**: são conceitos distintos — o primeiro identifica o exercício dentro de uma sessão específica, o segundo é o exercício "catálogo"
- **Modal de confirmação** ao ativar um novo plano, avisando que o plano ativo atual será desativado
- **Toast de `warnings[]`**: a API pode retornar avisos não bloqueantes (ex: incompatibilidade de nível de exercício) que devem ser exibidos ao usuário sem impedir a ação

---

## 📌 Nota sobre o fluxo de desenvolvimento

Este projeto é mantido em paralelo com o Lovable: alterações de UI/UX costumam ser feitas via prompt diretamente na ferramenta, que sincroniza com este repositório. Isso permite iterar rapidamente em telas e componentes enquanto o esforço de engenharia fica concentrado no backend (ver [OlympusProtocolAPI](https://github.com/<seu-usuario>/OlympusProtocolAPI)), que é o foco principal deste portfólio.

---

## 👤 Autor

Desenvolvido por Lucas — estudante de ADS (IFPE Campus Paulista). Foco em Java/Spring Boot como especialização principal, com React/frontend como habilidade complementar apoiada por ferramentas de IA.
