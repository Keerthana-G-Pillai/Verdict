-- ============================================================
-- VERDICT — Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- Enable Row Level Security on all user-owned tables.
-- ============================================================

-- ── Profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email        TEXT NOT NULL,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Analyses ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analyses (
  id              TEXT PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  change_type     TEXT NOT NULL,
  language        TEXT,
  domain          TEXT,
  verdict         TEXT NOT NULL,
  risk_score      INTEGER NOT NULL DEFAULT 0,
  confidence      INTEGER NOT NULL DEFAULT 0,
  critical_count  INTEGER NOT NULL DEFAULT 0,
  high_count      INTEGER NOT NULL DEFAULT 0,
  result          JSONB NOT NULL,
  ai_provider     TEXT,
  ai_enhanced     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS analyses_created_at_idx ON public.analyses(created_at DESC);

-- ── Simulations ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.simulations (
  id                      TEXT PRIMARY KEY,
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_a                 TEXT NOT NULL,
  title_b                 TEXT NOT NULL,
  domains_a               TEXT[] NOT NULL DEFAULT '{}',
  domains_b               TEXT[] NOT NULL DEFAULT '{}',
  conflict_count          INTEGER NOT NULL DEFAULT 0,
  critical_conflict_count INTEGER NOT NULL DEFAULT 0,
  integration_risk_score  INTEGER NOT NULL DEFAULT 0,
  verdict                 TEXT NOT NULL,
  verdict_rationale       TEXT NOT NULL DEFAULT '',
  result                  JSONB NOT NULL,
  ai_provider             TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own simulations"
  ON public.simulations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulations"
  ON public.simulations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulations"
  ON public.simulations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulations"
  ON public.simulations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS simulations_user_id_idx ON public.simulations(user_id);
CREATE INDEX IF NOT EXISTS simulations_created_at_idx ON public.simulations(created_at DESC);

-- ── Memory (saved analyses bookmark) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id   TEXT NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  saved_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, analysis_id)
);

ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memory"
  ON public.memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory"
  ON public.memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memory"
  ON public.memory FOR DELETE
  USING (auth.uid() = user_id);

-- ── Simulation Memory ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.simulation_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  simulation_id   TEXT NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, simulation_id)
);

ALTER TABLE public.simulation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own simulation memory"
  ON public.simulation_memory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulation memory"
  ON public.simulation_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulation memory"
  ON public.simulation_memory FOR DELETE
  USING (auth.uid() = user_id);
