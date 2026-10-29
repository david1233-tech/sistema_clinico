-- Para bases existentes; la API también crea la columna al primer uso.
ALTER TABLE triaje ADD COLUMN IF NOT EXISTS datos_opcionales JSONB NOT NULL DEFAULT '{}'::jsonb;

