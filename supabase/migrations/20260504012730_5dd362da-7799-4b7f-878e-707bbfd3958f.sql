
-- 1) Tabela de comentários de leads
CREATE TABLE IF NOT EXISTS public.lead_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  user_id uuid NOT NULL,
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_comments_lead ON public.lead_comments(lead_id, created_at DESC);

ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

-- Apenas o dono (mesmo user_id do lead) pode ler/escrever
CREATE POLICY "Owners read lead comments"
  ON public.lead_comments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners insert lead comments"
  ON public.lead_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_comments.lead_id AND l.user_id = auth.uid())
  );

CREATE POLICY "Owners update lead comments"
  ON public.lead_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners delete lead comments"
  ON public.lead_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_lead_comments_updated
  BEFORE UPDATE ON public.lead_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Restringir SELECT público em profiles (manter via RPC get_public_profile_by_slug)
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;

-- Owner já pode SELECT via profiles_owner_select existente.

-- 3) Remover leads da publicação realtime aberta (continua funcionando via polling no client; o canal só vazava PII)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='leads'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.leads';
  END IF;
END $$;
