const formatoPeru = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});

export function fechaPeruParaInput(fechaIso: string) {
  const partes = Object.fromEntries(formatoPeru.formatToParts(new Date(fechaIso)).map(parte => [parte.type, parte.value]));
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}:${partes.second}`;
}

export function fechaManualIso(fecha: string | null): string | null {
  if (!fecha) return null;
  const valor = new Date(`${fecha}-05:00`);
  return Number.isNaN(valor.getTime()) ? null : valor.toISOString();
}
