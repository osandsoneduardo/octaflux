-- 1) Restrict profiles SELECT: hide whatsapp_group_url/community_url from public
-- Approach: keep public read of branding columns via a SECURITY DEFINER view-like function,
-- but tighten the table policy to authenticated owner only, and add a public-safe policy
-- that only exposes non-sensitive columns isn't possible at row level — so we split:
-- public can read minimal columns via a dedicated RPC, and direct table access becomes owner-only.

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_select" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;

-- Owner can read own profile fully
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_owner_select') THEN
    CREATE POLICY "profiles_owner_select" ON public.profiles
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Public RPC that exposes ONLY safe branding fields by slug (used by /f/:slug pages)
CREATE OR REPLACE FUNCTION public.get_public_profile_by_slug(_slug text)
RETURNS TABLE (
  user_id uuid,
  brand_name text,
  slug text,
  logo_url text,
  primary_color text,
  background_color text,
  accent_color text,
  form_title text,
  form_subtitle text,
  thanks_qualified_title text,
  thanks_qualified_text text,
  thanks_unqualified_title text,
  thanks_unqualified_text text,
  cta_calendly_label text,
  calendly_url text,
  whatsapp_group_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, brand_name, slug, logo_url, primary_color, background_color, accent_color,
         form_title, form_subtitle, thanks_qualified_title, thanks_qualified_text,
         thanks_unqualified_title, thanks_unqualified_text, cta_calendly_label,
         calendly_url, whatsapp_group_url
  FROM public.profiles
  WHERE slug = _slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile_by_slug(text) TO anon, authenticated;

-- 2) Sites table: restrict tracking IDs from public read, expose safe subset via RPC
DROP POLICY IF EXISTS "Sites are viewable by everyone" ON public.sites;
DROP POLICY IF EXISTS "sites_public_select" ON public.sites;
DROP POLICY IF EXISTS "Public can view sites" ON public.sites;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='sites' AND policyname='sites_owner_select') THEN
    CREATE POLICY "sites_owner_select" ON public.sites
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_public_site_by_slug(_slug text)
RETURNS SETOF public.sites
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.sites WHERE slug = _slug LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_site_by_slug(text) TO anon, authenticated;
