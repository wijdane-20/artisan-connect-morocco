
-- 1) Extend service_requests
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- 2) Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MAD',
  provider TEXT NOT NULL DEFAULT 'mock',
  status TEXT NOT NULL DEFAULT 'pending',
  reference TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients create own payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients update own pending payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = client_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3) App settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins manage settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tg_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.app_settings (key, value)
VALUES ('booking_fee', '{"amount": 20, "currency": "MAD"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4) Allow artisans to see only PAID requests (block unpaid leakage)
-- Tighten existing policy if it shows all requests addressed to them.
DROP POLICY IF EXISTS "Artisans view their requests" ON public.service_requests;
CREATE POLICY "Artisans view their paid requests" ON public.service_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() = client_id
    OR (auth.uid() = artisan_id AND payment_status = 'paid')
    OR public.has_role(auth.uid(), 'admin')
  );
