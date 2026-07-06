## Diagnóstico

A implementação atual já moveu `ActiveSessionProvider` para `src/routes/__root.tsx`, envolvendo o `<Outlet />`. Porém o erro continua no bundle publicado ao abrir `/treino`, o que aponta para um problema de hierarquia/escopo em tempo de renderização: a rota `/treino` chama `useActiveSession()` diretamente e qualquer carregamento que não passe pelo layout esperado explode antes da tela conseguir renderizar.

Também confirmei que os usos atuais do hook são apenas:
- `/_tabs` / barra inferior
- `/_tabs/treinos`
- `/treino`

Não há evidência no código de modal, portal ou rota paralela renderizando `/treino` fora do provider. O ponto frágil é a dependência rígida de `/treino` no contexto global para executar apenas `refresh()` ao finalizar.

## Plano de correção

1. **Manter o provider no nível raiz**
   - Preservar `ActiveSessionProvider` em `src/routes/__root.tsx`, dentro de `AuthProvider` e acima do `<Outlet />`, para que todas as rotas tenham contexto desde entrada direta por URL.

2. **Remover a dependência obrigatória da rota `/treino`**
   - Em `src/routes/treino.tsx`, substituir o uso direto de `useActiveSession()` por uma forma segura/fallback.
   - A tela de treino não precisa do estado ativo para renderizar; ela só precisa atualizar o estado global ao finalizar.
   - Se o contexto existir, chama `refresh()`; se não existir, invalida/refaz as queries relevantes sem quebrar a página.

3. **Expor um hook seguro no contexto**
   - Em `src/lib/active-session.tsx`, adicionar um hook opcional como `useOptionalActiveSession()` que retorna `null` quando não há provider.
   - Manter `useActiveSession()` estrito para telas que realmente devem falhar se usadas fora do provider.

4. **Conferir a navegação de sessão**
   - Verificar o botão “Iniciar/Continuar sessão” na barra inferior: ele continua dentro de `/_tabs`, que está coberto pelo provider raiz.
   - `StartSessionModal` não usa o contexto diretamente e não renderiza `/treino` fora da árvore; apenas navega para `/treino?sid=...`.

5. **Validar entrada direta**
   - Testar `/treino?sid=...` diretamente no navegador/preview.
   - Confirmar que a rota não dispara mais `useActiveSession must be used within ActiveSessionProvider`.
   - Confirmar que clicar em “Iniciar/Continuar sessão” também navega sem erro.

## Resultado esperado

`/treino` deixa de quebrar por ausência de contexto, tanto via clique quanto via URL direta, e o provider raiz continua sendo a fonte global para barra inferior e telas dentro das abas.