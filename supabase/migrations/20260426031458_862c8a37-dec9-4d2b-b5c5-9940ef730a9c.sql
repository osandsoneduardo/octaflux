-- 1. Tokens OAuth Google por usuário (multi-tenant)
CREATE TABLE IF NOT EXISTS public.google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  google_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: tokens sensíveis. Apenas o dono pode ler/escrever. NUNCA SELECT público.
CREATE POLICY "Owner reads own google tokens" ON public.google_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner inserts own google tokens" ON public.google_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates own google tokens" ON public.google_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner deletes own google tokens" ON public.google_tokens FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_google_tokens_updated BEFORE UPDATE ON public.google_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Reuniões agendadas (link público ao lead, mas sem expor tokens)
CREATE TABLE IF NOT EXISTS public.scheduled_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lead_id UUID,
  slot_id UUID,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  attendee_name TEXT,
  attendee_email TEXT,
  attendee_whatsapp TEXT,
  google_event_id TEXT,
  meet_link TEXT,
  event_link TEXT,
  email_sent_at TIMESTAMPTZ,
  whatsapp_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_meetings ENABLE ROW LEVEL SECURITY;

-- Apenas o dono lê. Inserção pública (vinda do formulário) precisa ser permitida.
CREATE POLICY "Owner reads own meetings" ON public.scheduled_meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create a meeting" ON public.scheduled_meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner updates own meetings" ON public.scheduled_meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner deletes own meetings" ON public.scheduled_meetings FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_user ON public.scheduled_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_lead ON public.scheduled_meetings(lead_id);

-- 3. Sites: domínio externo + pixels
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS google_analytics_id TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS gtm_id TEXT;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS custom_head TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_custom_domain ON public.sites(custom_domain) WHERE custom_domain IS NOT NULL;

-- 4. Blocos: estilos de seção em coluna estruturada (mantém props, adiciona styles)
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS section_styles JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 5. Funis: persistir resultado da última etapa em metadados do funil para auditoria
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS last_step_type TEXT;

-- 6. BACKFILL: leads existentes sem pipeline coerente
-- Define pipeline para "Agendamento" se tiver scheduled_at e estiver "Novo"
UPDATE public.leads
SET pipeline = 'Agendamento'
WHERE scheduled_at IS NOT NULL AND pipeline IN ('Novo', '');

-- Marca leads não qualificados sem pipeline próprio como "Comunidade"
UPDATE public.leads
SET pipeline = 'Comunidade'
WHERE status = 'Não qualificado' AND pipeline IN ('Novo', '');

-- 7. Helper: atualizar last_step_type quando funnel_steps mudar
CREATE OR REPLACE FUNCTION public.refresh_funnel_last_step()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE target_funnel UUID;
BEGIN
  target_funnel := COALESCE(NEW.funnel_id, OLD.funnel_id);
  UPDATE public.funnels f
  SET last_step_type = (
    SELECT step_type FROM public.funnel_steps
    WHERE funnel_id = target_funnel
    ORDER BY position DESC LIMIT 1
  )
  WHERE f.id = target_funnel;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_funnel_steps_refresh ON public.funnel_steps;
CREATE TRIGGER trg_funnel_steps_refresh
AFTER INSERT OR UPDATE OR DELETE ON public.funnel_steps
FOR EACH ROW EXECUTE FUNCTION public.refresh_funnel_last_step();

-- Backfill last_step_type para funis existentes
UPDATE public.funnels f
SET last_step_type = (
  SELECT step_type FROM public.funnel_steps
  WHERE funnel_id = f.id ORDER BY position DESC LIMIT 1
);