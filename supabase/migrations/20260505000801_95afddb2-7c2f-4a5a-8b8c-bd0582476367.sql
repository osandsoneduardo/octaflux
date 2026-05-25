-- Fix slug generation: lower + unaccent BEFORE regex
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.unaccent(coalesce(_input,''))), '[^a-z0-9]+', '-', 'g'));
$$;

-- Fix handle_new_user to use slugify
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_slug TEXT;
  base_slug TEXT;
  counter INT := 0;
  default_brand TEXT;
BEGIN
  default_brand := coalesce(
    NEW.raw_user_meta_data->>'brand_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Meu CRM'
  );

  base_slug := public.slugify(default_brand);
  IF base_slug = '' THEN base_slug := 'user'; END IF;
  new_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO public.profiles (id, user_id, brand_name, slug)
  VALUES (gen_random_uuid(), NEW.id, default_brand, new_slug)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.settings (user_id, calendly_url, wa_msg_qualificado, wa_msg_nao_qualificado, whatsapp_confirmation_message, schedule_confirmation_message, schedule_cancellation_message, cancellation_policy, cancellation_min_hours)
  VALUES (NEW.id, 'https://calendly.com/seu-usuario/30min',
    'Olá {nome}! Parabéns, você foi qualificado. Agende sua reunião: {calendly}',
    'Olá {nome}! Obrigado pelo interesse. Convidamos você para nossa comunidade!',
    'Olá {nome}! Sua reunião foi confirmada para {data}.{meet_line}',
    'Olá {nome}! Sua reunião foi confirmada para {data}. Link: {meet}',
    'Olá {nome}, sua reunião de {data} foi cancelada.',
    'Cancelamentos podem ser feitos com até 24 horas de antecedência.', 24)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.form_fields (user_id, label, field_key, field_type, placeholder, required, position, is_qualifier, options)
  SELECT NEW.id, v.label, v.field_key, v.field_type, v.placeholder, v.required, v.position, v.is_qualifier, v.options
  FROM (VALUES
    ('Nome completo', 'nome', 'text', 'Seu nome', true, 0, false, '[]'::jsonb),
    ('WhatsApp', 'whatsapp', 'tel', '(11) 99999-9999', true, 1, false, '[]'::jsonb),
    ('E-mail', 'email', 'email', 'voce@email.com', true, 2, false, '[]'::jsonb),
    ('Faixa de investimento', 'faixa_investimento', 'qualification', null, true, 3, true,
     '[{"label":"R$ 100 – R$ 999","qualified":false},{"label":"R$ 1.000 – R$ 1.999","qualified":false},{"label":"R$ 2.000 – R$ 3.000","qualified":true},{"label":"Acima de R$ 3.000","qualified":true}]'::jsonb)
  ) AS v(label, field_key, field_type, placeholder, required, position, is_qualifier, options)
  WHERE NOT EXISTS (SELECT 1 FROM public.form_fields WHERE user_id = NEW.id);

  RETURN NEW;
END;
$function$;

-- Fix existing broken slugs (that start with '-' or have leading char stripped)
-- Re-derive from brand_name when current slug differs from properly-slugified brand
DO $$
DECLARE r RECORD; new_s TEXT; base_s TEXT; ctr INT;
BEGIN
  FOR r IN SELECT user_id, brand_name, slug FROM public.profiles LOOP
    base_s := public.slugify(r.brand_name);
    IF base_s = '' THEN base_s := 'user'; END IF;
    -- Only fix if current slug is clearly broken (doesn't match proper slugify)
    IF r.slug <> base_s AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE slug = r.slug AND slug LIKE base_s || '%'
    ) THEN
      new_s := base_s; ctr := 0;
      WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = new_s AND user_id <> r.user_id) LOOP
        ctr := ctr + 1; new_s := base_s || '-' || ctr;
      END LOOP;
      UPDATE public.profiles SET slug = new_s WHERE user_id = r.user_id;
    END IF;
  END LOOP;
END $$;