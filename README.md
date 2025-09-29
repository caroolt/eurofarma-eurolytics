# Eurolytics – Plataforma de Inovação Corporativa

Eurolytics é uma plataforma web para colaboradores da Eurofarma engajarem com ideias, quizzes e projetos de inovação, com gamificação e dashboards executivos.

## Tecnologias
- Frontend: React + TypeScript (Vite)
- UI: Tailwind CSS v4 + shadcn/ui + lucide-react
- Dados: Supabase (Postgres + RLS) + React Query
- Gráficos: Recharts

## Funcionalidades
- Autenticação (email/senha) validada via RPC `verify_user_password`
- Registro com email corporativo `@eurofarma.com` via RPC `create_user_with_password`
- Dashboard do colaborador com pontos, ranking, badges e ações rápidas
- Gestão (gestor/executivo) com KPIs, filtros e gerenciamento de ideias/projetos
- Quizzes com tempo, pontuação, histórico e atualização de pontos
- Projetos com status, limite de participantes, participação e detalhes
- Totem (interface simplificada) para ranking/quiz em telas públicas
- Notificações conectadas ao Supabase
- Gamificação com badges automáticas via triggers

## Requisitos
- Node 18+
- PNPM (recomendado) ou NPM
- Projeto Supabase (URL/Anon Key)

## Setup
1. Instalação
```bash
pnpm install
```
2. Ambiente – crie `.env` na raiz
```bash
VITE_SUPABASE_URL=SUABASE_URL
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
VITE_APP_ENV=development
```
3. Desenvolvimento
```bash
pnpm dev
```
Acesse `http://localhost:5173`.

## Scripts
- `pnpm dev` – ambiente de desenvolvimento
- `pnpm build` – build de produção
- `pnpm preview` – preview do build
- `pnpm lint` – lint

## Supabase
Tabelas principais: `users`, `ideas`, `quizzes`, `quiz_questions`, `quiz_attempts`, `badges`, `user_badges`, `projects`, `project_participants`.

Policies (RLS):
- Leitura aberta em `projects` e `project_participants`
- Insert liberado em `projects` (ajuste conforme papéis se desejar)

RPCs:
- `verify_user_password(p_email, p_password)` – verifica senha com `pgcrypto`
- `create_user_with_password(p_email, p_password, p_full_name, p_department, p_role)` – cria usuário e valida domínio `@eurofarma.com`

Badges automáticas (triggers):
- Primeira Ideia – ao inserir em `ideas`
- Inovador – 3 ideias aprovadas (update em `ideas`)
- Quiz Master – 3 tentativas (insert em `quiz_attempts`)
- Colaborador – 10 atividades (ideas + quiz_attempts + project_participants)
- Líder – top 5 por pontos (update de `users.points`)

## Estrutura (parcial)
- `src/components` – layout/UX (sidebar, header, notificações)
- `src/pages` – `Dashboard`, `Ideas`, `Quizzes`, `Ranking`, `Management`, `Projects`, `ProjectDetails`, `Profile`, `Totem`, `Login`, `Register`, `Loading`
- `src/lib` – `supabase.ts` (client) e `supabaseService.ts` (serviços)
- `src/contexts` – `AuthContext`, `NotificationContext`
- `src/types` – modelos TS

## Rotas
- Públicas: `/login`, `/registro`, `/totem`, `/loading`
- Protegidas: `/dashboard`, `/ideias`, `/quizzes`, `/ranking`, `/perfil`, `/projetos`, `/projetos/:id`
- Gestão (apenas `gestor`/`executivo`): `/gestao`, `/gestao/ideias`, `/gestao/projetos`

## Dicas
- Se as classes do Tailwind não aplicarem, confirme o import em `src/index.css`
- Erros 42501 indicam RLS; ajuste policies no Supabase
- Para troca de domínio no registro, altere a RPC `create_user_with_password`

## Licença
Uso interno para demonstração/prova de conceito.