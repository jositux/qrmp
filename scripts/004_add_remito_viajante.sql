-- Tabla de viajantes
CREATE TABLE viajantes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dni        VARCHAR(8) NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, dni)
);

ALTER TABLE viajantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viajantes: usuario ve los suyos"
  ON viajantes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "viajantes: usuario crea los suyos"
  ON viajantes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "viajantes: usuario borra los suyos"
  ON viajantes FOR DELETE
  USING (auth.uid() = user_id);

-- Columnas en payments
ALTER TABLE payments
  ADD COLUMN remito      VARCHAR(50),
  ADD COLUMN viajante_id UUID REFERENCES viajantes(id) ON DELETE SET NULL;

-- Remito único por usuario
CREATE UNIQUE INDEX payments_remito_user_unique
  ON payments (user_id, remito)
  WHERE remito IS NOT NULL;
