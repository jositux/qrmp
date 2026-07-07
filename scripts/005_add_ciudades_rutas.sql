-- Ciudades
CREATE TABLE ciudades (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, nombre)
);

ALTER TABLE ciudades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ciudades: usuario ve las suyas"
  ON ciudades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ciudades: usuario crea las suyas"
  ON ciudades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ciudades: usuario borra las suyas"
  ON ciudades FOR DELETE USING (auth.uid() = user_id);

-- Rutas (pertenecen a una ciudad)
CREATE TABLE rutas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ciudad_id  UUID REFERENCES ciudades(id) ON DELETE SET NULL,
  numero     INTEGER NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, numero)
);

ALTER TABLE rutas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rutas: usuario ve las suyas"
  ON rutas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rutas: usuario crea las suyas"
  ON rutas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rutas: usuario borra las suyas"
  ON rutas FOR DELETE USING (auth.uid() = user_id);

-- Viajantes: agregar ruta_id
ALTER TABLE viajantes
  ADD COLUMN ruta_id UUID REFERENCES rutas(id) ON DELETE SET NULL;
