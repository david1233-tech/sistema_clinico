import { pgPool } from '@/lib/db';

export const CAMPOS_OPCIONALES_TRIAJE = [
  'agua_porcentaje', 'grasa_porcentaje', 'grasa_visceral',
  'musculo_esqueletico_porcentaje', 'musculos_porcentaje', 'metabolismo',
  'proteina', 'grado_obesidad_porcentaje', 'edad_metabolica',
  'circunferencia_abdominal', 'globulos_rojos', 'globulos_blancos',
  'hb_glicosilada', 'vcm', 'colesterol', 'trigliceridos',
  'creatinina', 'urea', 'tgo', 'tgp', 't3_t4_tsh',
  'examenes_solicitados', 'antecedentes'
] as const;

export function datosOpcionalesTriaje(input: Record<string, unknown>) {
  return Object.fromEntries(CAMPOS_OPCIONALES_TRIAJE.map(campo => [campo, String(input[campo] ?? '')]));
}

let initialized: Promise<void> | undefined;

export function ensureTriajeCampos() {
  if (!initialized) {
    initialized = (async () => {
      await pgPool.query('ALTER TABLE triaje ADD COLUMN IF NOT EXISTS frecuencia_respiratoria VARCHAR(30)');
      await pgPool.query('ALTER TABLE triaje ADD COLUMN IF NOT EXISTS glucosa VARCHAR(50)');
      await pgPool.query("ALTER TABLE triaje ADD COLUMN IF NOT EXISTS datos_opcionales JSONB NOT NULL DEFAULT '{}'::jsonb");
    })().catch(error => {
      initialized = undefined;
      throw error;
    });
  }
  return initialized;
}

