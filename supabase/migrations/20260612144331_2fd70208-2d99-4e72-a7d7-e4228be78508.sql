
CREATE POLICY "Artisan reads own verif files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Artisan uploads own verif files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Artisan updates own verif files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admin reads all verif files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs' AND public.has_role(auth.uid(),'admin'));
