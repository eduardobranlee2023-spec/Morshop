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
