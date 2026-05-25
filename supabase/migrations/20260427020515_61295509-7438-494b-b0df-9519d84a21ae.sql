DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.leads;
CREATE POLICY "Public can submit leads to existing owners"
ON public.leads
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = leads.user_id
  )
);

DROP POLICY IF EXISTS "Anyone can create a meeting" ON public.scheduled_meetings;
CREATE POLICY "Authenticated owners can create own meetings"
ON public.scheduled_meetings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;