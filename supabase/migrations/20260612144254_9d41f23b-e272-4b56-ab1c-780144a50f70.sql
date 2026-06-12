
-- 1. Extend artisans
ALTER TABLE public.artisans
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS completed_jobs INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_min NUMERIC,
  ADD COLUMN IF NOT EXISTS price_max NUMERIC,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC,
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

-- 2. Profiles: add suspended flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;

-- 3. Portfolio items
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portfolio public read" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Artisan manages own portfolio" ON public.portfolio_items
  FOR ALL TO authenticated USING (artisan_id = auth.uid()) WITH CHECK (artisan_id = auth.uid());
CREATE POLICY "Admin manages all portfolio" ON public.portfolio_items
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. Verification requests
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  cin_url TEXT,
  photo_url TEXT,
  doc_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artisan reads/writes own verif" ON public.verification_requests
  FOR ALL TO authenticated USING (artisan_id = auth.uid()) WITH CHECK (artisan_id = auth.uid());
CREATE POLICY "Admin manages all verif" ON public.verification_requests
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_verif_updated BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5. Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 6. Trigger to bump completed_jobs on completion
CREATE OR REPLACE FUNCTION public.tg_bump_completed_jobs()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') AND NEW.artisan_id IS NOT NULL THEN
    UPDATE public.artisans SET completed_jobs = completed_jobs + 1 WHERE id = NEW.artisan_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_bump_completed ON public.service_requests;
CREATE TRIGGER trg_bump_completed AFTER UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_bump_completed_jobs();

-- 7. Seed lat/lng + professions for existing demo artisans
UPDATE public.artisans a SET
  latitude = CASE a.city
    WHEN 'Casablanca' THEN 33.5731 WHEN 'Rabat' THEN 34.0209 WHEN 'Marrakech' THEN 31.6295
    WHEN 'Fès' THEN 34.0181 WHEN 'Tanger' THEN 35.7595 WHEN 'Agadir' THEN 30.4278
    ELSE 33.5731 END,
  longitude = CASE a.city
    WHEN 'Casablanca' THEN -7.5898 WHEN 'Rabat' THEN -6.8416 WHEN 'Marrakech' THEN -7.9811
    WHEN 'Fès' THEN -5.0078 WHEN 'Tanger' THEN -5.8340 WHEN 'Agadir' THEN -9.5981
    ELSE -7.5898 END,
  price_min = COALESCE(price_min, hourly_rate * 0.8),
  price_max = COALESCE(price_max, hourly_rate * 2.5),
  description = COALESCE(description, bio),
  profession = COALESCE(profession, (SELECT name FROM public.categories c WHERE c.id = a.category_id)),
  is_verified = true,
  verification_status = 'approved',
  completed_jobs = floor(random()*60+10)::int
WHERE latitude IS NULL;

-- 8. Sync phone from profiles into artisans
UPDATE public.artisans a SET phone = p.phone, profile_photo_url = COALESCE(a.profile_photo_url, p.avatar_url)
FROM public.profiles p WHERE p.id = a.id AND a.phone IS NULL;
