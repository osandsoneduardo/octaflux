-- Restringir listagem do bucket público brand-assets (mantém downloads públicos via /object/public)
DROP POLICY IF EXISTS "Public can read brand asset files by path" ON storage.objects;

-- Mantém leitura apenas pelo dono via API (downloads públicos continuam funcionando porque o bucket é public)
CREATE POLICY "Owners can read own brand assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);