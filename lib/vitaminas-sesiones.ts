export interface AplicacionConFecha {
  id: number;
  fechaAplicacion?: string;
}

export function agruparSesiones<T extends AplicacionConFecha>(tratamientos: T[]): [string, T[]][] {
  const grupos = new Map<string, T[]>();
  for (const tratamiento of tratamientos) {
    const fecha = tratamiento.fechaAplicacion;
    const clave = fecha && !Number.isNaN(new Date(fecha).getTime()) ? new Date(fecha).toISOString() : `registro-${tratamiento.id}`;
    const sesion = grupos.get(clave) || [];
    sesion.push(tratamiento);
    grupos.set(clave, sesion);
  }
  return Array.from(grupos.entries());
}
