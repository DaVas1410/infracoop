-- RLS en tablas de revisión: solo admin puede leer/modificar

ALTER TABLE formularios_en_revision ENABLE ROW LEVEL SECURITY;
ALTER TABLE normativas_en_revision  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin only formularios_revision" ON formularios_en_revision
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admin only normativas_revision" ON normativas_en_revision
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND rol = 'admin')
  );
