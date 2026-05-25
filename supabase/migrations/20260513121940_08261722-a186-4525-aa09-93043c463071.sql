DROP POLICY IF EXISTS "Sites publicly viewable" ON public.sites;

CREATE POLICY "Published sites publicly viewable"
ON public.sites
FOR SELECT
TO anon, authenticated
USING (published = true);
