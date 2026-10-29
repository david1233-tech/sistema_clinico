import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { ensureTriajeAdjuntos } from '@/lib/triaje-adjuntos';

const MAX_ADJUNTOS = 200;
const MAX_BYTES = 3 * 1024 * 1024;
const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Triaje inválido' }, { status: 400 });
  try {
    await ensureTriajeAdjuntos();
    const result = await pgPool.query(
      'SELECT id, nombre, tipo, fecha FROM triaje_adjuntos WHERE triaje_id = $1 ORDER BY id', [id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al listar adjuntos:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los adjuntos' }, { status: 500 });
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

