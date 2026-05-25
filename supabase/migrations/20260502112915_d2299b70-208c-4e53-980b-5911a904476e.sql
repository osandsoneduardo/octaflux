-- 1) settings: remover SELECT público; apenas o dono lê
DROP POLICY IF EXISTS "Settings are publicly viewable" ON public.settings;

CREATE POLICY "Owners read own settings"
  ON public.settings FOR SELECT
  USING (auth.uid() = user_id);

-- 2) leads: apertar INSERT público para exigir profile existente
DROP POLICY IF EXISTS "Public can submit leads to existing owners" ON public.leads;

CREATE POLICY "Public can submit leads to existing owners"
  ON public.leads FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = leads.user_id)
  );