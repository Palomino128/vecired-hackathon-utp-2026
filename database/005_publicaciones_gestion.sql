-- Migración incremental VeciRed: seguimiento de publicaciones completadas.
-- Compatible con 001_schema.sql. No borra cuentas ni publicaciones.
BEGIN;
ALTER TABLE items ADD COLUMN IF NOT EXISTS completion_type VARCHAR(20);
ALTER TABLE items ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'items_completion_type_check'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_completion_type_check
      CHECK (completion_type IS NULL OR completion_type IN ('venta', 'prestamo', 'donacion', 'otro'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_items_usuario_estado ON items(user_id, status, created_at DESC);
COMMIT;
