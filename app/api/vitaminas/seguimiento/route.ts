import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { CATEGORIAS_SEGUIMIENTO, ensureVitaminasSeguimiento } from '@/lib/vitaminas-seguimiento';

export const dynamic = 'force-dynamic';

const campos = ['presion', 'pulso', 'saturacion', 'frecuencia_respiratoria', 'temperatura', 'peso', 'imc', 'grasa_corporal', 'grasa_visceral'] as const;
const fechaValida = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
const dniValido = (value: unknown): value is string => typeof value === 'string' && /^\d{8}$/.test(value);
const idValido = (value: unknown) => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const errorDb = (error: unknown) => { console.error('Seguimiento de vitaminas:', error); return NextResponse.json({ error: 'No se pudo acceder a la ficha. Intente nuevamente.' }, { status: 503 }); };

async function pacienteExiste(dni: string) {
  const result = await pgPool.query('SELECT 1 FROM pacientes WHERE dni = $1 UNION SELECT 1 FROM triaje WHERE dni_paciente = $1 UNION SELECT 1 FROM recetas WHERE dni_paciente = $1 LIMIT 1', [dni]);
  return Boolean(result.rowCount);
}

export async function GET(request: Request) {
  const dni = new URL(request.url).searchParams.get('dni');
  if (!dniValido(dni)) return NextResponse.json({ error: 'DNI inválido' }, { status: 400 });
  try {
    await ensureVitaminasSeguimiento();
    const [controles, procedimientos] = await Promise.all([
      pgPool.query('SELECT * FROM vitaminas_controles WHERE dni_paciente = $1 ORDER BY fecha DESC, id DESC', [dni]),
      pgPool.query('SELECT * FROM vitaminas_procedimientos WHERE dni_paciente = $1 ORDER BY fecha DESC, id DESC', [dni])
    ]);
    return NextResponse.json({ controles: controles.rows, procedimientos: procedimientos.rows });
  } catch (error) { return errorDb(error); }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 }); }
  const dni = body.dni_paciente;
  if (!dniValido(dni) || !fechaValida(body.fecha)) return NextResponse.json({ error: 'Paciente o fecha inválidos.' }, { status: 400 });
  try {
    await ensureVitaminasSeguimiento();
    if (!await pacienteExiste(dni)) return NextResponse.json({ error: 'Paciente no encontrado.' }, { status: 404 });
    if (body.tipo === 'control') {
      const valores = campos.map(campo => String(body[campo] ?? '').trim());
      if (valores.some(valor => valor.length > 30) || valores.every(valor => !valor)) return NextResponse.json({ error: 'Ingrese al menos un indicador válido.' }, { status: 400 });
      const result = await pgPool.query(`INSERT INTO vitaminas_controles (dni_paciente, fecha, ${campos.join(', ')}) VALUES ($1, $2, ${campos.map((_, i) => `$${i + 3}`).join(', ')}) ON CONFLICT (dni_paciente, fecha) DO NOTHING RETURNING *`, [dni, body.fecha, ...valores]);
      if (!result.rowCount) return NextResponse.json({ error: 'Ya existe un control para esa fecha. Edite el registro existente.' }, { status: 409 });
      return NextResponse.json(result.rows[0], { status: 201 });
    }
    if (body.tipo === 'procedimiento') {
      const categoria = String(body.categoria ?? '');
      const descripcion = String(body.descripcion ?? '').trim();
      const clave = String(body.clave_solicitud ?? '');
      if (!CATEGORIAS_SEGUIMIENTO.includes(categoria as typeof CATEGORIAS_SEGUIMIENTO[number]) || !descripcion || descripcion.length > 5000 || !/^[0-9a-f-]{36}$/i.test(clave)) return NextResponse.json({ error: 'Revise categoría, descripción y solicitud.' }, { status: 400 });
      const result = await pgPool.query('INSERT INTO vitaminas_procedimientos (dni_paciente, categoria, fecha, descripcion, clave_solicitud) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (clave_solicitud) DO NOTHING RETURNING *', [dni, categoria, body.fecha, descripcion, clave]);
      if (!result.rowCount) return NextResponse.json({ error: 'Esta solicitud ya fue guardada. Recargue la ficha.' }, { status: 409 });
      return NextResponse.json(result.rows[0], { status: 201 });
    }
    return NextResponse.json({ error: 'Tipo de registro inválido.' }, { status: 400 });
  } catch (error) { return errorDb(error); }
}

export async function PUT(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 }); }
  if (!dniValido(body.dni_paciente) || !idValido(body.id) || !fechaValida(body.fecha)) return NextResponse.json({ error: 'Registro inválido.' }, { status: 400 });
  try {
    await ensureVitaminasSeguimiento();
    if (body.tipo === 'control') {
      const valores = campos.map(campo => String(body[campo] ?? '').trim());
      if (valores.some(valor => valor.length > 30) || valores.every(valor => !valor)) return NextResponse.json({ error: 'Ingrese al menos un indicador válido.' }, { status: 400 });
      const result = await pgPool.query(`UPDATE vitaminas_controles SET fecha = $1, ${campos.map((campo, i) => `${campo} = $${i + 2}`).join(', ')}, actualizado_en = NOW() WHERE id = $11 AND dni_paciente = $12 RETURNING *`, [body.fecha, ...valores, body.id, body.dni_paciente]);
      if (!result.rowCount) return NextResponse.json({ error: 'Control no encontrado.' }, { status: 404 });
      return NextResponse.json(result.rows[0]);
    }
    if (body.tipo === 'procedimiento') {
      const categoria = String(body.categoria ?? '');
      const descripcion = String(body.descripcion ?? '').trim();
      if (!CATEGORIAS_SEGUIMIENTO.includes(categoria as typeof CATEGORIAS_SEGUIMIENTO[number]) || !descripcion || descripcion.length > 5000) return NextResponse.json({ error: 'Revise categoría y descripción.' }, { status: 400 });
      const result = await pgPool.query('UPDATE vitaminas_procedimientos SET categoria = $1, fecha = $2, descripcion = $3, actualizado_en = NOW() WHERE id = $4 AND dni_paciente = $5 RETURNING *', [categoria, body.fecha, descripcion, body.id, body.dni_paciente]);
      if (!result.rowCount) return NextResponse.json({ error: 'Tratamiento no encontrado.' }, { status: 404 });
      return NextResponse.json(result.rows[0]);
    }
    return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') return NextResponse.json({ error: 'Ya existe un control para esa fecha.' }, { status: 409 });
    return errorDb(error);
  }
}
