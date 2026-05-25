CREATE OR REPLACE FUNCTION public.profile_user_exists(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id);
$$;

REVOKE ALL ON FUNCTION public.profile_user_exists(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_user_exists(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Public can submit leads to existing owners" ON public.leads;

CREATE POLICY "Public can submit leads to existing owners"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (public.profile_user_exists(user_id));
