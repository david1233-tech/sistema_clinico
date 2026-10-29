import { pgPool } from '@/lib/db';

let initialized: Promise<void> | undefined;

export function ensureTriajeCampos() {
  if (!initialized) {
    initialized = (async () => {
      await pgPool.query('ALTER TABLE triaje ADD COLUMN IF NOT EXISTS frecuencia_respiratoria VARCHAR(30)');
      await pgPool.query('ALTER TABLE triaje ADD COLUMN IF NOT EXISTS glucosa VARCHAR(50)');
    })().catch(error => {
      initialized = undefined;
      throw error;
    });
  }
  return initialized;
}

