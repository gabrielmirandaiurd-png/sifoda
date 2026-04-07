

# TáPago — App de Gestão de Vida Pessoal

## Visão geral
App pessoal mobile-first em PT-BR com autenticação, 6 módulos de gestão e PWA instalável. Backend via Lovable Cloud (Supabase).

## Autenticação & Perfil
- Login/cadastro com email e senha
- Tabela `profiles` com nome, avatar_url, criada automaticamente via trigger
- Todas as tabelas com RLS vinculado ao `auth.uid()`

## Banco de Dados (todas com RLS)
- `profiles` — nome, avatar
- `income` — nome, valor, data, categoria (ST fixo/comissão ST/Uber/VR/outro)
- `expenses` — nome, valor, data, status (pago/pendente/atrasado), categoria
- `debts` — credor, valor_original, valor_atual, parcelas_pagas, parcelas_total, status
- `uber_daily_log` — data, valor_rodado; `uber_goals` — meta semanal
- `projects` — nome, descrição, prazo, status; `milestones` — nome, concluído, project_id
- `breakeven_goals` — meta mensal de renda
- `tasks` — título, prioridade, data_limite, status (a_fazer/em_andamento/feito), project_id opcional
- `workout_plans` — nome, dias da semana; `workout_exercises` — nome, séries, repetições, plan_id
- `workout_logs` — data, plan_id, exercícios concluídos
- `body_weight_logs` — data, peso
- `meal_plans` — refeição, descrição; `meal_logs` — data, refeição, concluída, observação
- `daily_checklist` — data, treino_feito, dieta_seguida, uber_batida, tarefa_feita

## Navegação
- Bottom navigation bar (mobile-first) com 6 ícones: Home, Financeiro, Projetos, Tarefas, Treino, Dieta
- Sidebar colapsável no desktop
- Dark mode toggle

## Módulos & Telas

### 1. Home (Checklist Diário)
- Card com checklist do dia: treino, dieta, Uber, tarefa principal
- Saldo restante do mês e próximo vencimento crítico

### 2. Financeiro
- Abas: Entradas | Saídas | Dívidas | Dashboard | Meta Uber
- Dashboard: saldo mensal, total pago/pendente, barras de progresso das dívidas
- Meta Uber: registro diário + barra de progresso semanal configurável

### 3. Projetos e Objetivos
- Lista de projetos com status (ativo/pausado/concluído)
- Detalhe com marcos (checkbox)
- Card de breakeven: meta mensal e projeção visual

### 4. Tarefas
- Kanban: A fazer → Em andamento → Feito (drag & drop)
- Filtros: hoje / esta semana / todas
- Vínculo opcional com projeto

### 5. Treino
- Planos por dia da semana com exercícios (séries × repetições)
- Checklist diário de exercícios
- Registro de peso corporal com gráfico simples
- Streak de dias consecutivos

### 6. Dieta e Alimentação
- Plano por refeição (café/almoço/lanche/jantar)
- Checklist diário de refeições
- Campo de observação por dia
- Peso compartilhado com módulo Treino

## Design
- Clean, flat, mobile-first
- Dark mode com toggle
- Cores neutras com acentos em azul/verde
- Tipografia clara e legível
- Tudo em português brasileiro

## PWA
- Manifest + ícones para instalação mobile
- Service worker apenas em produção (sem interferir no preview)

## Implementação em fases
**Fase 1**: Auth + perfil + navegação + Home checklist + estrutura de banco
**Fase 2**: Financeiro completo (entradas, saídas, dívidas, dashboard, Uber)
**Fase 3**: Projetos + Tarefas (kanban)
**Fase 4**: Treino + Dieta
**Fase 5**: PWA + polish final

