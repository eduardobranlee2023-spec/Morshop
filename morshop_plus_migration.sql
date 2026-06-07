-- 1. Agregar columnas de plan a la tabla stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS plan_activated_at timestamptz;

-- 2. Tabla de suscripciones para historial de pagos
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan text NOT NULL DEFAULT 'plus',
  status text NOT NULL DEFAULT 'pending',
  -- status puede ser: pending, active, cancelled, expired
  amount_paid numeric,
  currency text DEFAULT 'ARS',
  payment_id text, -- ID del pago de Mercado Pago
  payment_method text,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_store_id ON subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stores_plan ON stores(plan);

-- 4. RLS en subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
ON subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. Agregar campos de redes sociales a stores (feature del Plus)
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS tiktok_url text,
ADD COLUMN IF NOT EXISTS facebook_url text;

-- 6. Función para verificar si un store tiene plan plus activo
CREATE OR REPLACE FUNCTION is_plan_plus_active(store_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM stores
    WHERE id = store_id
    AND plan = 'plus'
    AND (plan_expires_at IS NULL OR plan_expires_at > now())
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Función para contar productos de un store
CREATE OR REPLACE FUNCTION get_product_count(p_store_id uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer FROM products WHERE store_id = p_store_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 8. Tabla waitlist — captura de emails interesados en Plus (antes de Mercado Pago)
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Índice para evitar emails duplicados por tienda
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_email_store ON waitlist(email, store_id);

-- RLS para waitlist
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert to waitlist"
ON waitlist FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own waitlist entries"
ON waitlist FOR SELECT
USING (
  store_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
  )
);

-- 9. Tabla store_views para métricas de visitas
CREATE TABLE IF NOT EXISTS store_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_views_store_id ON store_views(store_id);
CREATE INDEX IF NOT EXISTS idx_store_views_viewed_at ON store_views(viewed_at);

ALTER TABLE store_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_sees_own_views" ON store_views
  FOR SELECT USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  );

CREATE POLICY "anyone_can_insert_view" ON store_views
  FOR INSERT WITH CHECK (true);

-- 10. Columna whatsapp_clicks en stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS whatsapp_clicks INTEGER DEFAULT 0;
