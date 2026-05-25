DROP POLICY IF EXISTS "Anyone can create meeting attempts" ON public.meeting_attempts;

CREATE POLICY "Owners create own meeting attempts"
ON public.meeting_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);