# Plano — Edição de Planos, Fluxo de Sessão e PWA instalável

## Escopo

Três frentes independentes, entregues no mesmo passe:

1. Edição completa de planos de treino (`/api/workout-plans`)
2. Fluxo de sessão ativa — modo plano e modo livre (`/api/sessions`)
3. PWA instalável (manifest válido + SW básico)

Toda comunicação usa o cliente `src/lib/api.ts` já existente; endpoints novos serão adicionados lá quando faltarem.

---

## PARTE 1 — Planos

### 1.1 Ajustes em `src/lib/api.ts`
- Adicionar tipo `WorkoutGoal = "HIPERTROFIA" | "FORCA" | "QUEIMA" | "RESISTENCIA"` e substituir usos do antigo `Goal`.
- Endpoint que faltava: `SessionsAPI.active()` → `GET /api/sessions/active` (retorna `WorkoutSessionResponse | null`, tratando 204).
- Garantir que `PlansAPI` já cobre: create, addDay, updateDay, deleteDay, reorderDays, addExercise, updateExercise, deleteExercise, reorderExercises, deactivate, reactivate. (Já cobre — só ajustar o goal.)

### 1.2 Aba Planos — estado vazio
Arquivo: `src/routes/_tabs.treinos.tsx`
- Quando `plans.filter(active).length === 0`, renderizar bloco centralizado (ícone tocha + texto “Você ainda não tem um plano ativo” + botão dourado grande “CRIAR PLANO”).
- Não usar mais o card discreto atual.

### 1.3 Criação em 2 etapas
Novo componente `src/components/olympus/CreatePlanFlow.tsx` (Dialog em tela cheia mobile):
- Etapa 1: nome + goal (4 chips: Hipertrofia / Força / Queima / Resistência). Botão “Criar”.
- Ao sucesso: transição para Etapa 2 no mesmo dialog: campo “Nome do primeiro dia” + botão “Adicionar dia”. `dayOrder = 1`.
- Ao concluir, fecha e navega para a tela de detalhe do plano criado.

### 1.4 Tela de detalhe do plano
Novo arquivo: `src/routes/plano.$planId.tsx`
- Header com nome do plano + goal + botão “Arquivar” (chama `deactivate` e volta).
- Lista de dias (dnd-kit sortable, drag handle), cada dia é um card colapsável com:
  - Editar nome (inline ou pequeno modal) → `updateDay`.
  - Excluir dia (confirm) → `deleteDay`.
  - Lista de exercícios (dnd-kit sortable dentro do dia) com sets×reps, rest.
  - Botão “Adicionar exercício” → abre `ExercisePickerSheet` (1.5), depois pequeno form (sets, reps, restTime).
  - Tocar num exercício abre form de edição (mesmos campos) → `updateExercise` / `deleteExercise`.
- Botão “Adicionar dia” fixo no rodapé, desabilitado (com tooltip) quando `days.length >= 7`.
- Todas as mutações atualizam estado local com o `WorkoutPlanResponse` retornado; `warnings[]` → toast informativo.

### 1.5 ExercisePickerSheet reutilizável
Novo: `src/components/olympus/ExercisePickerSheet.tsx`
- Sheet/Drawer com input de busca (debounce 300ms), filtro por `muscleGroups` (chips), lista paginada (usa `LoadMoreButton` já existente).
- `onSelect(exerciseId, exerciseName)` retorna ao chamador.
- Usado tanto na tela do plano quanto na sessão livre.

### 1.6 Arquivar plano
Na aba **Perfil** (`src/routes/_tabs.perfil.tsx`), cada card de plano ganha menu (⋯) com:
- “Arquivar” → `PlansAPI.deactivate` → refetch da lista.
- (Reativar fica fora do escopo desta entrega.)

---

## PARTE 2 — Sessões

### 2.1 Estado global de sessão ativa
Novo: `src/lib/active-session.tsx`
- Hook `useActiveSession()` que faz `SessionsAPI.active()` no mount, no `visibilitychange` (foreground) e após `start/finish`.
- Expor `{ session, refresh, isActive }`.
- Providers acima de `<Outlet />` em `src/routes/_tabs.tsx`.

### 2.2 BottomNav — botão central dinâmico
`src/components/olympus/BottomNav.tsx`:
- Se `isActive`: ícone `Dumbbell`; clique → navega para `/treino?id=<sessionId>`.
- Se não: ícone `Play`; clique → abre `StartSessionModal` (já existe, mantém).
- Após `createFree`/`createFromPlan`, chamar `refresh()` para trocar o ícone imediatamente.

### 2.3 Painel de sessão ativa
Reescrever `src/routes/treino.tsx` como painel unificado:
- Carrega sessão via `SessionsAPI.get(sessionId)`.
- Modo plano (`workoutDayId` != null): busca o plano correspondente (via `PlansAPI.get`) só para obter `sets` esperados por exercício; renderiza cada exercício como checklist (feitas/esperadas). Exercício “completo” quando `sets.length >= esperado`.
- Modo livre (`workoutDayId == null`): sem “esperado”, botão “ADICIONAR EXERCÍCIO” (abre `ExercisePickerSheet`) sempre visível.
- Ambos modos:
  - dnd-kit para reordenar exercícios → `SessionsAPI.reorderExercises` (com aviso no comentário: valor a enviar é `sessionExerciseId`, confirmar em teste).
  - Botão de remover exercício.
  - Tocar num exercício → navega para tela de registro de série.
- Rodapé: botão “FINALIZAR TREINO” → dialog com textarea de notas → `SessionsAPI.finish` → navega para tela de resumo.

### 2.4 Tela de registro de série
Reescrever `src/routes/serie.tsx` (params: `sessionId`, `sessionExerciseId`):
- Header: “Série X de Y” + nome do exercício.
- Barra segmentada de progresso (uma célula por série esperada, ou por série feita no livre).
- Campos Carga (step 2.5kg) e Reps (step 1) com +/−.
- RPE oculto atrás de “Mostrar mais”.
- Botão “SALVAR SÉRIE” → `SessionsAPI.addSet` com `setOrder = sets.length + 1`, `restTime` e `rpe` opcionais.
- Lista “Séries anteriores” abaixo, com editar (abre mesmo form) e remover.

### 2.5 Tela de resumo pós-finalização
Novo: `src/routes/resumo.$sessionId.tsx`
- Consome `SessionsAPI.summary(sessionId)`: duração, volume total, exercícios, volumes por grupo muscular, `muscleVolumeChanges` (deltas vs sessão anterior).
- Botão “Voltar ao início” → `/home`.

---

## PARTE 3 — PWA instalável

### 3.1 Manifest e ícones
- Manter `vite-plugin-pwa` já configurado (`vite.config.ts`), apenas garantir que os ícones referenciados existam em `public/`:
  - `public/icon-192.png`, `public/icon-512.png` (já existem).
  - Adicionar `public/icon-512-maskable.png` (gerar via imagegen a partir do “L” dourado).
  - Ajustar `manifest.icons` no `vite.config.ts` para incluir a variante maskable como entrada separada.
- Manifest final expõe: name, short_name, description, start_url `/`, scope `/`, display `standalone`, orientation `portrait`, `background_color: #0A0A0A`, `theme_color: #C8A46A` (dourado da marca — mais alinhado ao pedido “se fizer mais sentido visualmente”).

### 3.2 Registro do service worker
- `src/lib/pwa.ts` já registra `/sw.js` com todos os guards de preview/dev — manter.
- Confirmar que `registerServiceWorker()` é chamado em `src/start.ts` ou `__root.tsx`. Se não estiver, adicionar chamada.
- Estratégia atual (NetworkFirst para navegações, CacheFirst para assets, NetworkOnly para API) já satisfaz o pedido: instalabilidade + fallback offline básico dos assets, sem sync de dados.

### 3.3 Critérios de aceite (verificação manual pós-deploy)
- `GET /manifest.webmanifest` → 200.
- DevTools → Application → Manifest sem erros; Service Worker “activated and running”; prompt de instalação disponível.

---

## Detalhes técnicos

- **Rotas novas** (TanStack file-based):
  - `src/routes/plano.$planId.tsx` → `/plano/$planId`
  - `src/routes/resumo.$sessionId.tsx` → `/resumo/$sessionId`
  - `src/routes/serie.tsx` já existe; será estendida para aceitar `?sessionId=&sessionExerciseId=` via `validateSearch`.
- **Cache**: mantém `staleTime: 0` global; após cada mutação, atualizar diretamente o cache com o response (evita GET redundante), exceto para `deactivate/reactivate` (204) onde re-fetch é necessário.
- **Warnings**: helper único `showWarnings(warnings: string[])` que dispara um toast por item.
- **Erros de validação**: interceptar `ApiError` com payload `{ fieldErrors: [{field, message}] }` e mostrar mensagem do primeiro campo em toast destrutivo.
- **Depêndencias**: nenhuma nova; `@dnd-kit/*` e `sonner` já instalados.
- **Ícone maskable**: gerar 512×512 com safe area (logo centralizado em ~80% do canvas, fundo `#0A0A0A`).

## Fora de escopo (explicitado no pedido)
- Editar nome/goal de plano existente (endpoint não existe).
- Reativar plano arquivado (aba “Arquivados”).
- Sincronização offline de dados (IndexedDB / background sync).
