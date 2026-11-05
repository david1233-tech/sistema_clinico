export const normalizarBusqueda = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function primerApellido(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return partes.length >= 3 ? partes[partes.length - 2] : partes[partes.length - 1] || '';
}

export function coincideInicialApellido(nombre: string, letra: string) {
  return !letra || normalizarBusqueda(primerApellido(nombre)).startsWith(normalizarBusqueda(letra));
}

export function coincideBusquedaPaciente(nombre: string, dni: string, busqueda: string) {
  const filtro = normalizarBusqueda(busqueda);
  if (!filtro) return true;
  if (/^\d+$/.test(filtro)) return dni.includes(filtro);
  const apellido = normalizarBusqueda(primerApellido(nombre));
  if (filtro.length === 1 && /^[a-z]$/.test(filtro)) return apellido.startsWith(filtro);
  return apellido.startsWith(filtro) || normalizarBusqueda(nombre).includes(filtro);
}
