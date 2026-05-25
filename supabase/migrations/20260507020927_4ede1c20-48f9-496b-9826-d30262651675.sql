ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS welcome_title text NOT NULL DEFAULT 'Bem-vindo(a)!',
  ADD COLUMN IF NOT EXISTS welcome_text text NOT NULL DEFAULT 'Leva menos de 1 minuto.',
  ADD COLUMN IF NOT EXISTS welcome_cta_label text NOT NULL DEFAULT 'Começar',
  ADD COLUMN IF NOT EXISTS form_border_radius integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS form_submit_label text NOT NULL DEFAULT 'Enviar';

ALTER TABLE public.form_fields
  ADD COLUMN IF NOT EXISTS show_if jsonb;

DROP FUNCTION IF EXISTS public.get_public_profile_by_slug(text);

CREATE OR REPLACE FUNCTION public.get_public_profile_by_slug(_slug text)
RETURNS TABLE(
  user_id uuid, brand_name text, slug text, logo_url text,
  primary_color text, background_color text, accent_color text,
  form_title text, form_subtitle text,
  thanks_qualified_title text, thanks_qualified_text text,
  thanks_unqualified_title text, thanks_unqualified_text text,
  cta_calendly_label text, calendly_url text, whatsapp_group_url text,
  cta_qualified_label text, cta_unqualified_label text, community_url text,
  welcome_enabled boolean, welcome_title text, welcome_text text, welcome_cta_label text,
  form_border_radius integer, form_submit_label text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT user_id, brand_name, slug, logo_url, primary_color, background_color, accent_color,
         form_title, form_subtitle, thanks_qualified_title, thanks_qualified_text,
         thanks_unqualified_title, thanks_unqualified_text, cta_calendly_label,
         calendly_url, whatsapp_group_url,
         cta_qualified_label, cta_unqualified_label, community_url,
         welcome_enabled, welcome_title, welcome_text, welcome_cta_label,
         form_border_radius, form_submit_label
  FROM public.profiles
  WHERE slug = _slug
  LIMIT 1;
$$;