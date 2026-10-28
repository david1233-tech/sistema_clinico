import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type DniRecord = Record<string, unknown>;

const value = (record: DniRecord, ...keys: string[]) => {
  for (const key of keys) {
    const item = record[key];
    if (typeof item === 'string' && item.trim()) return item.trim();
  }
  return '';
};

export async function GET(request: Request) {
  const dni = new URL(request.url).searchParams.get('dni')?.trim() || '';
  if (!/^\d{8}$/.test(dni)) {
    return NextResponse.json({ error: 'Ingrese un DNI válido de 8 dígitos.' }, { status: 400 });
  }

  const endpoint = process.env.RENIEC_API_URL;
  const token = process.env.RENIEC_API_TOKEN;
  if (!endpoint || !token || !endpoint.includes('{dni}')) {
    return NextResponse.json({ error: 'La consulta de DNI aún no está configurada. Puede ingresar los datos manualmente.' }, { status: 503 });
  }

  let url: URL;
  try {
    url = new URL(endpoint.replace('{dni}', dni));
    if (url.protocol !== 'https:') throw new Error('HTTPS requerido');
  } catch {
    return NextResponse.json({ error: 'La URL del proveedor de DNI no es válida.' }, { status: 503 });
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) return NextResponse.json({ error: 'DNI no encontrado.' }, { status: 404 });
    if (!response.ok) throw new Error(`Proveedor respondió ${response.status}`);

    const raw: unknown = await response.json();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Respuesta inválida');
    const root = raw as DniRecord;
    const record = root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? root.data as DniRecord
      : root;
    const nombreCompleto = value(record, 'nombreCompleto', 'nombre_completo') ||
      [value(record, 'nombres', 'nombre'), value(record, 'apellidoPaterno', 'apellido_paterno'), value(record, 'apellidoMaterno', 'apellido_materno')].filter(Boolean).join(' ');
    if (!nombreCompleto) throw new Error('Proveedor no devolvió un nombre');
    const sexo = value(record, 'genero', 'sexo').toLowerCase();
    const genero = sexo === 'm' || sexo === 'masculino' ? 'Masculino'
      : sexo === 'f' || sexo === 'femenino' ? 'Femenino' : '';

    return NextResponse.json({
      success: true,
      nombreCompleto,
      direccion: value(record, 'direccion', 'domicilio'),
      genero,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error al consultar proveedor de DNI:', error);
    return NextResponse.json({ error: 'No se pudo consultar el DNI. Ingrese los datos manualmente o intente de nuevo.' }, { status: 502 });
  }
}

