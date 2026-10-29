-- Para bases existentes; la API también crea estas columnas al primer uso.
ALTER TABLE triaje ADD COLUMN IF NOT EXISTS frecuencia_respiratoria VARCHAR(30);
ALTER TABLE triaje ADD COLUMN IF NOT EXISTS glucosa VARCHAR(50);

