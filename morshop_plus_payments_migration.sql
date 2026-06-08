-- Tabla de solicitudes de activación del Plus
CREATE TABLE payment_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  amount INTEGER DEFAULT 18900,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vendors_see_own" ON payment_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vendors_insert_own" ON payment_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_all_access" ON payment_requests
  FOR ALL USING (auth.jwt() ->> 'email' = 'morshop.vercel.app@gmail.com');

-- Campos adicionales en stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan_activated_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;
