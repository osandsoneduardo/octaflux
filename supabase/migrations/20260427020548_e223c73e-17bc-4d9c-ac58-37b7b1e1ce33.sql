DROP POLICY IF EXISTS "Brand assets are publicly viewable" ON storage.objects;

CREATE POLICY "Public can read brand asset files by path"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'brand-assets'
  AND name IS NOT NULL
  AND array_length(storage.foldername(name), 1) >= 2
);