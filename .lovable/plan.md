## Objetivo

Adaptar o frontend às mudanças do backend: endpoints que agora retornam `Page<T>` (Spring Data padrão) em vez de `List<T>`, com UX de "Carregar mais" e page size padrão 20.

## Endpoints afetados

- `GET /api/exercises`
- `GET /api/users/search`
- `GET /api/workout-plans`
- `GET /api/sessions`

## Mudanças no `src/lib/api.ts`

1. Adicionar tipo genérico `Page<T>`:
   ```ts
   type Page<T> = {
     content: T[];
     totalElements: number; totalPages: number;
     number: number; size: number;
     first: boolean; last: boolean;
   }
   ```
2. Adicionar tipo `PageParams = { page?: number; size?: number; sort?: string }` e helper que serializa em query string (`page`, `size`, `sort`), com `size=20` default.
3. Atualizar assinaturas para retornar `Page<T>`:
   - `ExercisesAPI.list(params, page)` → `Page<ExerciseResponse>`
   - `UsersAPI.search(name, page)` → `Page<UserSummary>`
   - `PlansAPI.list(page)` → `Page<WorkoutPlanResponse>`
   - `SessionsAPI.list(page)` → `Page<WorkoutSessionResponse>`

## Mudanças nas telas (consumers)

Padrão: usar `useQuery` mantendo estado local `const [page, setPage] = useState(0)` e acumulando `content` em uma lista. Ao final da lista, botão **"Carregar mais"** desabilitado quando `data.last === true` e com estado de loading.

Arquivos:

- **`src/routes/_tabs.social.tsx`** — busca de usuários: ler `search.data.content`; botão "Carregar mais" abaixo da lista.
- **`src/routes/_tabs.treinos.tsx`** — lista de planos: consumir `PlansAPI.list`; ajustar filtro de `active===true` sobre `.content`; botão "Carregar mais".
- **`src/routes/_tabs.home.tsx`** — se consome `PlansAPI.list` para detectar plano ativo, adaptar para `.content`.
- **`src/routes/_tabs.evolucao.tsx`** — se lista sessões via `SessionsAPI.list`, adaptar para `.content` + "Carregar mais".
- Qualquer outro consumidor de `ExercisesAPI.list` (ex.: seleção de exercício no editor de plano/treino, se existir) — adaptar para `.content`.

## Componente reutilizável

Criar `src/components/olympus/LoadMoreButton.tsx`: botão minimalista no design system (borda dourada, `bg-card`, texto uppercase "CARREGAR MAIS"), props `onClick`, `loading`, `disabled`. Usado por todas as listas paginadas.

## Detalhes técnicos

- **Acumulação**: manter um `useState<T[]>` local para `items` e um `useEffect` que faz `setItems(prev => page === 0 ? data.content : [...prev, ...data.content])` quando `data` muda; resetar `items` e `page` quando muda a query (ex.: novo termo de busca em `Social`).
- **queryKey** inclui `page` e o filtro relevante para cache correto.
- **Comportamento offline (PWA)**: nada muda — o workbox `NetworkFirst` já cobre `/api/*`.
- Não mexer em outros endpoints, autenticação, tema ou service worker.

## Verificação

- `bun run build` sem erros de tipo.
- Manualmente na preview: busca no Social lista 20, "Carregar mais" traz mais 20, some no final; Treinos exibe plano ativo corretamente.