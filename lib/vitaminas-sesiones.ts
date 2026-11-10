export interface AplicacionConFecha {
  id: number;
  fechaAplicacion?: string;
}

const formatoDia = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit'
});

export function diaAplicacion(fecha: string): string | null {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;
  const partes = Object.fromEntries(formatoDia.formatToParts(valor).map(parte => [parte.type, parte.value]));
  return `${partes.year}-${partes.month}-${partes.day}`;
}

export function agruparSesiones<T extends AplicacionConFecha>(tratamientos: T[]): [string, T[]][] {
  const grupos = new Map<string, T[]>();
  for (const tratamiento of tratamientos) {
    const fecha = tratamiento.fechaAplicacion;
    const clave = fecha ? diaAplicacion(fecha) || `registro-${tratamiento.id}` : `registro-${tratamiento.id}`;
    const sesion = grupos.get(clave) || [];
    sesion.push(tratamiento);
    grupos.set(clave, sesion);
  }
  return Array.from(grupos.entries()).sort(([a], [b]) => b.localeCompare(a));
}
