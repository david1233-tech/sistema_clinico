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

  const token = process.env.RENIEC_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'La consulta de DNI aún no está configurada. Puede ingresar los datos manualmente.' }, { status: 503 });
  }

  try {
    const response = await fetch('https://api.json.pe/api/dni', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) return NextResponse.json({ error: 'DNI no encontrado.' }, { status: 404 });
    if (response.status === 401 || response.status === 403) return NextResponse.json({ error: 'La clave de consulta de DNI no fue aceptada por JSON.pe.' }, { status: 502 });
    if (!response.ok) throw new Error(`Proveedor respondió ${response.status}`);

    const raw: unknown = await response.json();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Respuesta inválida');
    const root = raw as DniRecord;
    if (root.success === false) return NextResponse.json({ error: value(root, 'message', 'error') || 'DNI no encontrado.' }, { status: 404 });
    const record = root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? root.data as DniRecord
      : root;
    const nombreCompleto = value(record, 'nombreCompleto', 'nombre_completo', 'full_name') ||
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

