
-- 1. transactions: unified financial entries
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receita','despesa','quitacao','investimento')),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  vencimento DATE,
  categoria TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  credor TEXT,
  parcelas_total INTEGER,
  parcela_atual INTEGER,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  frequencia TEXT,
  observacao TEXT,
  debt_id UUID REFERENCES public.debts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. debt_payments
CREATE TABLE public.debt_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  valor_pago NUMERIC NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own debt_payments" ON public.debt_payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Add columns to debts for expanded debt management
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS data_inicio DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'outro';
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS valor_parcela NUMERIC;
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS frequencia TEXT DEFAULT 'mensal';
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS observacao TEXT;

-- 4. Add columns to workout_exercises for exercise types
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'musculacao';
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS carga_kg NUMERIC;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS descanso_segundos INTEGER;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS modalidade_cardio TEXT;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS intensidade TEXT;
ALTER TABLE public.workout_exercises ADD COLUMN IF NOT EXISTS distancia_km NUMERIC;

-- 5. exercise_sessions: per-session set logging
CREATE TABLE public.exercise_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  sets_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exercise_sessions" ON public.exercise_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Add columns to body_weight_logs
ALTER TABLE public.body_weight_logs ADD COLUMN IF NOT EXISTS horario TEXT;
ALTER TABLE public.body_weight_logs ADD COLUMN IF NOT EXISTS observacao TEXT;

-- 7. food_library
CREATE TABLE public.food_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  calorias_por_100g NUMERIC,
  proteina_por_100g NUMERIC,
  carboidrato_por_100g NUMERIC,
  gordura_por_100g NUMERIC,
  preco_aproximado NUMERIC,
  unidade_padrao TEXT DEFAULT 'g',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.food_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own food_library" ON public.food_library FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Add columns to meal_plans for enhanced plans
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 9. meals: individual meals within a plan
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  horario TIME,
  ordem INTEGER DEFAULT 0,
  repete_igual_refeicao_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own meals" ON public.meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. meal_ingredients
CREATE TABLE public.meal_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.food_library(id) ON DELETE CASCADE,
  quantidade NUMERIC NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'g',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own meal_ingredients" ON public.meal_ingredients FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 11. weekly_stock
CREATE TABLE public.weekly_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_id UUID NOT NULL REFERENCES public.food_library(id) ON DELETE CASCADE,
  quantidade_disponivel NUMERIC NOT NULL DEFAULT 0,
  semana_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own weekly_stock" ON public.weekly_stock FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 12. Add ativo column to workout_plans
ALTER TABLE public.workout_plans ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
