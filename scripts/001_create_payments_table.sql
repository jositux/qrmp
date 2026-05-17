-- Tabla para guardar los pagos generados
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  monto DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  payment_url TEXT,
  preference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - cada usuario solo ve sus propios pagos
CREATE POLICY "payments_select_own" ON public.payments 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payments_insert_own" ON public.payments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments_update_own" ON public.payments 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "payments_delete_own" ON public.payments 
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_nombre ON public.payments(nombre);
