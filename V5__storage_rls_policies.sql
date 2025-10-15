-- Policies for 'volunteer-photos' Storage Bucket

-- 1. Policy for viewing photos
-- This allows anyone to view photos, as the bucket is public.
CREATE POLICY "Anyone can view volunteer photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'volunteer-photos' );

-- 2. Policy for uploading photos
-- This allows an authenticated user to upload a photo into a folder matching their own user ID.
CREATE POLICY "Volunteers can upload photos to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'volunteer-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policy for updating photos
-- This allows an authenticated user to update a photo in their own folder.
CREATE POLICY "Volunteers can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'volunteer-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy for deleting photos
-- This allows an authenticated user to delete a photo from their own folder.
CREATE POLICY "Volunteers can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'volunteer-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
