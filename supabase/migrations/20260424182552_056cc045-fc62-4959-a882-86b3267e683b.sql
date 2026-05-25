-- Slots de disponibilidade configurados pelo dono
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  slot_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_availability_user ON public.availability_slots(user_id, slot_at);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slots are publicly viewable"
  ON public.availability_slots FOR SELECT USING (true);

CREATE POLICY "Owners insert own slots"
  ON public.availability_slots FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update own slots"
  ON public.availability_slots FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners delete own slots"
  ON public.availability_slots FOR DELETE USING (auth.uid() = user_id);

-- Permitir que o público marque um slot ao agendar (somente alterar is_booked/lead_id)
CREATE POLICY "Public can book a slot"
  ON public.availability_slots FOR UPDATE
  USING (is_booked = false)
  WITH CHECK (is_booked = true);

-- Lead: horário agendado
ALTER TABLE public.leads ADD COLUMN scheduled_at TIMESTAMPTZ;