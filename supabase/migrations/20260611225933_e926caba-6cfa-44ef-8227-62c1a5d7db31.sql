
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('client', 'artisan', 'admin');
CREATE TYPE public.request_status AS ENUM ('pending','accepted','rejected','in_progress','completed','cancelled');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view their own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Artisans
CREATE TABLE public.artisans (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_years INT DEFAULT 0,
  hourly_rate NUMERIC(10,2),
  city TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  approved BOOLEAN NOT NULL DEFAULT false,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artisans TO anon, authenticated;
GRANT INSERT, UPDATE ON public.artisans TO authenticated;
GRANT ALL ON public.artisans TO service_role;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved artisans public" ON public.artisans FOR SELECT USING (approved = true);
CREATE POLICY "Artisan sees own row" ON public.artisans FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Artisan insert own" ON public.artisans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Artisan update own" ON public.artisans FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins manage artisans" ON public.artisans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Service Requests
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT,
  city TEXT,
  preferred_date DATE,
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_requests TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view requests" ON public.service_requests FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = artisan_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Clients create requests" ON public.service_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Parties update requests" ON public.service_requests FOR UPDATE TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = artisan_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = client_id OR auth.uid() = artisan_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete requests" ON public.service_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Clients create reviews" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients update own reviews" ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients/admins delete reviews" ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = client_id OR public.has_role(auth.uid(),'admin'));

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view messages" ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver mark read" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER artisans_updated BEFORE UPDATE ON public.artisans FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER requests_updated BEFORE UPDATE ON public.service_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city'
  );
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'client');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);
  IF v_role = 'artisan' THEN
    INSERT INTO public.artisans (id, city) VALUES (NEW.id, NEW.raw_user_meta_data->>'city');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update artisan rating after review change
CREATE OR REPLACE FUNCTION public.tg_update_artisan_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID;
BEGIN
  v_id := COALESCE(NEW.artisan_id, OLD.artisan_id);
  UPDATE public.artisans SET
    rating_avg = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE artisan_id = v_id), 0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE artisan_id = v_id)
  WHERE id = v_id;
  RETURN NULL;
END $$;
CREATE TRIGGER reviews_rating_aiud AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.tg_update_artisan_rating();

-- Seed default categories
INSERT INTO public.categories (name, slug, icon, description) VALUES
  ('Plombier','plombier','Wrench','Réparation et installation de plomberie'),
  ('Électricien','electricien','Zap','Installation et dépannage électrique'),
  ('Menuisier','menuisier','Hammer','Travaux de menuiserie et bois'),
  ('Peintre','peintre','PaintBucket','Peinture intérieure et extérieure'),
  ('Maçon','macon','Brick','Maçonnerie et gros œuvre'),
  ('Climatisation','climatisation','Snowflake','Installation et entretien de climatisation'),
  ('Carreleur','carreleur','Grid3x3','Pose de carrelage et faïence'),
  ('Serrurier','serrurier','Key','Serrurerie et dépannage');
