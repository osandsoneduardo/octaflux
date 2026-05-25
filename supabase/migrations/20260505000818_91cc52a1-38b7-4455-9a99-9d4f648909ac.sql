-- Make slugify SECURITY INVOKER (it doesn't need elevated privs)
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.unaccent(coalesce(_input,''))), '[^a-z0-9]+', '-', 'g'));
$$;