-- VeciRed: migración incremental, segura para las cuentas existentes.
-- El esquema original ya incluye ambas columnas. Las instrucciones
-- IF NOT EXISTS permiten ejecutarla nuevamente sin borrar información.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE users ALTER COLUMN avatar_url DROP NOT NULL;
COMMENT ON COLUMN users.avatar_url IS 'Ruta local /uploads/uuid.webp; fotografía de perfil opcional';
COMMIT;
-- IMPORTANTE: no guarda fotos dentro de PostgreSQL; solo su ruta.
-- No ejecutar DROP TABLE ni reconstruir la base de datos.
