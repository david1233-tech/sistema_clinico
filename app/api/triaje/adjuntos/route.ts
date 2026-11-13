import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { ensureTriajeAdjuntos } from '@/lib/triaje-adjuntos';

const MAX_ADJUNTOS = 200;
const MAX_BYTES = 3 * 1024 * 1024;
const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const id = searchParams.get('id');
  const dni = searchParams.get('dni');
  if (dni && !/^\d{8}$/.test(dni)) return NextResponse.json({ error: 'DNI inválido' }, { status: 400 });
  if (!dni && (!id || !/^\d+$/.test(id))) return NextResponse.json({ error: 'Triaje inválido' }, { status: 400 });
  try {
    await ensureTriajeAdjuntos();
    if (dni) {
      const result = await pgPool.query(
        `SELECT a.id, a.nombre, a.tipo, a.fecha, a.triaje_id, a.fecha_consulta::text AS fecha_consulta
         FROM triaje_adjuntos a
         JOIN triaje t ON t.id = a.triaje_id
         WHERE t.dni_paciente = $1 AND a.tipo LIKE 'image/%'
         ORDER BY a.fecha DESC, a.id DESC`, [dni]
      );
      return NextResponse.json(result.rows);
    }
    const result = await pgPool.query(
      'SELECT id, nombre, tipo, fecha, fecha_consulta::text AS fecha_consulta FROM triaje_adjuntos WHERE triaje_id = $1 ORDER BY id', [id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al listar adjuntos:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los adjuntos' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: { id?: unknown; fecha_consulta?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 }); }
  const id = String(body.id ?? '');
  const fecha = body.fecha_consulta;
  if (!/^\d+$/.test(id) || (fecha !== null && (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(`${fecha}T00:00:00Z`)) || new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) !== fecha))) {
    return NextResponse.json({ error: 'Fecha de consulta inválida' }, { status: 400 });
  }
  try {
    await ensureTriajeAdjuntos();
    const result = await pgPool.query('UPDATE triaje_adjuntos SET fecha_consulta = $1::date WHERE id = $2 RETURNING id, fecha_consulta::text AS fecha_consulta', [fecha, id]);
    return result.rowCount ? NextResponse.json(result.rows[0]) : NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
  } catch (error) {
    console.error('Error al guardar fecha de consulta:', error);
    return NextResponse.json({ error: 'No se pudo guardar la fecha de consulta' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const id = String(form.get('triaje_id') || '');
  const archivo = form.get('archivo');
  if (!/^\d+$/.test(id) || !(archivo instanceof File)) {
    return NextResponse.json({ error: 'Triaje o archivo inválido' }, { status: 400 });
  }
  if (!TIPOS.has(archivo.type) || archivo.size === 0 || archivo.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Solo imágenes JPG, PNG, WebP, GIF o PDF de hasta 3 MB' }, { status: 400 });
  }
  let client;
  try {
    await ensureTriajeAdjuntos();
    client = await pgPool.connect();
  } catch (error) {
    console.error('Error al preparar adjuntos:', error);
    return NextResponse.json({ error: 'No se pudo preparar el almacenamiento de adjuntos' }, { status: 500 });
  }
  try {
    await client.query('BEGIN');
    const triaje = await client.query('SELECT id FROM triaje WHERE id = $1 FOR UPDATE', [id]);
    if (!triaje.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Triaje no encontrado' }, { status: 404 });
    }
    const count = await client.query('SELECT COUNT(*)::int AS total FROM triaje_adjuntos WHERE triaje_id = $1', [id]);
    if (count.rows[0].total >= MAX_ADJUNTOS) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Máximo 200 adjuntos por triaje' }, { status: 400 });
    }
    const data = Buffer.from(await archivo.arrayBuffer());
    const saved = await client.query(
      'INSERT INTO triaje_adjuntos (triaje_id, nombre, tipo, contenido) VALUES ($1, $2, $3, $4) RETURNING id, nombre, tipo, fecha',
      [id, archivo.name.slice(0, 255), archivo.type, data]
    );
    await client.query('COMMIT');
    return NextResponse.json(saved.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar adjunto:', error);
    return NextResponse.json({ error: 'No se pudo guardar el adjunto' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Adjunto inválido' }, { status: 400 });
  try {
    await ensureTriajeAdjuntos();
    const result = await pgPool.query('DELETE FROM triaje_adjuntos WHERE id = $1', [id]);
    return NextResponse.json({ success: Boolean(result.rowCount) }, { status: result.rowCount ? 200 : 404 });
  } catch (error) {
    console.error('Error al eliminar adjunto:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el adjunto' }, { status: 500 });
  }
}

