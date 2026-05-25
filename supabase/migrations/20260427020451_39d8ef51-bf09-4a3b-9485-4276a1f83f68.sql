CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  base_slug := lower(regexp_replace(default_brand, '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'user'; END IF;
  new_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;

  INSERT INTO public.profiles (id, user_id, brand_name, slug)
  VALUES (gen_random_uuid(), NEW.id, default_brand, new_slug)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.settings (
    user_id,
    calendly_url,
    wa_msg_qualificado,
    wa_msg_nao_qualificado,
    whatsapp_confirmation_message,
    schedule_confirmation_message,
    schedule_cancellation_message,
    cancellation_policy,
    cancellation_min_hours
  )
  VALUES (
    NEW.id,
    'https://calendly.com/seu-usuario/30min',
    'Olá {nome}! Parabéns, você foi qualificado. Agende sua reunião: {calendly}',
    'Olá {nome}! Obrigado pelo interesse. Convidamos você para nossa comunidade!',
    'Olá {nome}! Sua reunião foi confirmada para {data}.{meet_line}',
    'Olá {nome}! Sua reunião foi confirmada para {data}. Link: {meet}',
    'Olá {nome}, sua reunião de {data} foi cancelada.',
    'Cancelamentos podem ser feitos com até 24 horas de antecedência.',
    24
  )
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
  WHERE NOT EXISTS (
    SELECT 1 FROM public.form_fields WHERE user_id = NEW.id
  );

  RETURN NEW;
END;
$function$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;