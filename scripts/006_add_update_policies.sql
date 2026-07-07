-- Política de UPDATE para viajantes (faltaba, bloquea PATCH de ruta_id)
CREATE POLICY "viajantes: usuario actualiza los suyos"
  ON viajantes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas de UPDATE para ciudades y rutas (preventivo)
CREATE POLICY "ciudades: usuario actualiza las suyas"
  ON ciudades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rutas: usuario actualiza las suyas"
  ON rutas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
