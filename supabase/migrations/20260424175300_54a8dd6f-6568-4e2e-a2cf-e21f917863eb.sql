
-- Drop old permissive policies
DROP POLICY IF EXISTS "Public read leads" ON public.leads;
DROP POLICY IF EXISTS "Public insert leads" ON public.leads;
DROP POLICY IF EXISTS "Public update leads" ON public.leads;
DROP POLICY IF EXISTS "Public delete leads" ON public.leads;
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
DROP POLICY IF EXISTS "Public update settings" ON public.settings;
DROP POLICY IF EXISTS "Public insert settings" ON public.settings;

-- Clean old data
TRUNCATE public.leads;
TRUNCATE public.settings;

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  brand_name TEXT NOT NULL DEFAULT 'Meu CRM',
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#3B6D11',
  background_color TEXT NOT NULL DEFAULT '#0a0a0a',
  accent_color TEXT NOT NULL DEFAULT '#86efac',
  form_title TEXT NOT NULL DEFAULT 'Vamos conversar',
  form_subtitle TEXT NOT NULL DEFAULT 'Preencha os dados para começarmos.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ leads (add user_id) ============
ALTER TABLE public.leads ADD COLUMN user_id UUID NOT NULL;
ALTER TABLE public.leads ADD COLUMN custom_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.leads ALTER COLUMN nome DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN whatsapp DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'Qualificado';

CREATE POLICY "Owners read own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners update own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);

-- ============ settings (add user_id) ============
ALTER TABLE public.settings ADD COLUMN user_id UUID NOT NULL UNIQUE;

CREATE POLICY "Settings are publicly viewable" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Owners update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ form_fields ============
CREATE TABLE public.form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',  -- text, email, tel, number, select, qualification
  placeholder TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  options JSONB DEFAULT '[]'::jsonb,  -- for select / qualification: [{label, qualified}]
  position INTEGER NOT NULL DEFAULT 0,
  is_qualifier BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Form fields are publicly viewable" ON public.form_fields FOR SELECT USING (true);
CREATE POLICY "Owners insert own fields" ON public.form_fields FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own fields" ON public.form_fields FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own fields" ON public.form_fields FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_form_fields_user ON public.form_fields(user_id, position);
CREATE INDEX idx_leads_user ON public.leads(user_id, created_at DESC);

-- ============ Bootstrap function ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_slug TEXT;
  base_slug TEXT;
  counter INT := 0;
BEGIN
  base_slug := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'brand_name', split_part(NEW.email, '@', 1)), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'user'; END IF;
  new_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO public.profiles (id, user_id, brand_name, slug)
  VALUES (gen_random_uuid(), NEW.id, coalesce(NEW.raw_user_meta_data->>'brand_name', 'Meu CRM'), new_slug);

  INSERT INTO public.settings (user_id, calendly_url, wa_msg_qualificado, wa_msg_nao_qualificado)
  VALUES (NEW.id,
    'https://calendly.com/seu-usuario/30min',
    'Olá {nome}! Parabéns, você foi qualificado. Agende sua reunião: {calendly}',
    'Olá {nome}! Obrigado pelo interesse. Convidamos você para nossa comunidade!');

  -- Default form fields
  INSERT INTO public.form_fields (user_id, label, field_key, field_type, placeholder, required, position, is_qualifier, options) VALUES
    (NEW.id, 'Nome completo', 'nome', 'text', 'Seu nome', true, 0, false, '[]'::jsonb),
    (NEW.id, 'WhatsApp', 'whatsapp', 'tel', '(11) 99999-9999', true, 1, false, '[]'::jsonb),
    (NEW.id, 'E-mail', 'email', 'email', 'voce@email.com', true, 2, false, '[]'::jsonb),
    (NEW.id, 'Faixa de investimento', 'faixa_investimento', 'qualification', null, true, 3, true,
     '[{"label":"R$ 100 – R$ 999","qualified":false},{"label":"R$ 1.000 – R$ 1.999","qualified":false},{"label":"R$ 2.000 – R$ 3.000","qualified":true},{"label":"Acima de R$ 3.000","qualified":true}]'::jsonb);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
