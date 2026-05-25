
-- Drop unused tables
DROP TABLE IF EXISTS public.meeting_attempts CASCADE;
DROP TABLE IF EXISTS public.scheduled_meetings CASCADE;
DROP TABLE IF EXISTS public.availability_slots CASCADE;
DROP TABLE IF EXISTS public.google_tokens CASCADE;
DROP TABLE IF EXISTS public.google_oauth_states CASCADE;
DROP TABLE IF EXISTS public.funnel_steps CASCADE;
DROP TABLE IF EXISTS public.funnels CASCADE;

-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calendly_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_qualified_label TEXT NOT NULL DEFAULT 'Agendar minha reunião',
  ADD COLUMN IF NOT EXISTS cta_unqualified_label TEXT NOT NULL DEFAULT 'Entrar na comunidade';

-- Leads additions
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Pipeline columns customizadas
CREATE TABLE IF NOT EXISTS public.pipeline_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners select pipeline columns" ON public.pipeline_columns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners insert pipeline columns" ON public.pipeline_columns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update pipeline columns" ON public.pipeline_columns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete pipeline columns" ON public.pipeline_columns FOR DELETE USING (auth.uid() = user_id);

-- Public read for rendering form (need profile owner's columns? not really; pipeline only for owner)

-- Site additions for sticky header + dark mode
ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS sticky_header BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS theme_mode TEXT NOT NULL DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS social_instagram TEXT,
  ADD COLUMN IF NOT EXISTS social_facebook TEXT,
  ADD COLUMN IF NOT EXISTS social_youtube TEXT,
  ADD COLUMN IF NOT EXISTS social_twitter TEXT,
  ADD COLUMN IF NOT EXISTS social_linkedin TEXT,
  ADD COLUMN IF NOT EXISTS social_tiktok TEXT,
  ADD COLUMN IF NOT EXISTS social_whatsapp TEXT;

-- Refresh trigger uses dropped table; remove trigger function dependency
DROP FUNCTION IF EXISTS public.refresh_funnel_last_step() CASCADE;
