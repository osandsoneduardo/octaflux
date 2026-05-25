ALTER TABLE public.scheduled_meetings
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS canceled_by TEXT;

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS cancellation_min_hours INTEGER NOT NULL DEFAULT 24,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT NOT NULL DEFAULT 'Cancelamentos podem ser feitos com até 24 horas de antecedência.',
ADD COLUMN IF NOT EXISTS schedule_confirmation_message TEXT NOT NULL DEFAULT 'Olá {nome}! Sua reunião foi confirmada para {data}. Link: {meet}',
ADD COLUMN IF NOT EXISTS schedule_cancellation_message TEXT NOT NULL DEFAULT 'Olá {nome}, sua reunião de {data} foi cancelada.',
ADD COLUMN IF NOT EXISTS whatsapp_confirmation_message TEXT NOT NULL DEFAULT 'Olá {nome}! Sua reunião foi confirmada para {data}.{meet_line}';

CREATE TABLE IF NOT EXISTS public.meeting_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lead_id UUID,
  meeting_id UUID,
  slot_id UUID,
  action TEXT NOT NULL DEFAULT 'schedule_attempt',
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read own meeting attempts" ON public.meeting_attempts;
CREATE POLICY "Owners read own meeting attempts"
ON public.meeting_attempts
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create meeting attempts" ON public.meeting_attempts;
CREATE POLICY "Anyone can create meeting attempts"
ON public.meeting_attempts
FOR INSERT
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_meeting_attempts_user_created ON public.meeting_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_attempts_meeting ON public.meeting_attempts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_user_starts ON public.scheduled_meetings(user_id, starts_at DESC);