DROP POLICY IF EXISTS "Owners read own google oauth states" ON public.google_oauth_states;
CREATE POLICY "Owners read own google oauth states"
ON public.google_oauth_states
FOR SELECT
USING (auth.uid() = user_id);