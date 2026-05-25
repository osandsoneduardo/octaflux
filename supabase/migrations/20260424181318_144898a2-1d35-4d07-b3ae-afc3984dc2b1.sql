ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS thanks_qualified_title TEXT NOT NULL DEFAULT 'Parabéns, você foi qualificado!',
  ADD COLUMN IF NOT EXISTS thanks_qualified_text TEXT NOT NULL DEFAULT 'Agende sua reunião com nosso time.',
  ADD COLUMN IF NOT EXISTS thanks_unqualified_title TEXT NOT NULL DEFAULT 'Bem-vindo à comunidade!',
  ADD COLUMN IF NOT EXISTS thanks_unqualified_text TEXT NOT NULL DEFAULT 'Em breve entraremos em contato pelo WhatsApp.',
  ADD COLUMN IF NOT EXISTS cta_calendly_label TEXT NOT NULL DEFAULT 'Agendar reunião';