import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { ensureVitaminasAdjuntos } from '@/lib/vitaminas-adjuntos';

const MAX_ADJUNTOS = 200;
const MAX_BYTES = 3 * 1024 * 1024;
const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Tratamiento inválido' }, { status: 400 });
  try {
    await ensureVitaminasAdjuntos();
    const result = await pgPool.query('SELECT id, nombre, tipo, fecha FROM vitaminas_adjuntos WHERE receta_id = $1 ORDER BY id', [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al listar adjuntos de vitaminas:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los adjuntos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const id = String(form.get('receta_id') || '');
  const archivo = form.get('archivo');
  if (!/^\d+$/.test(id) || !(archivo instanceof File)) return NextResponse.json({ error: 'Tratamiento o archivo inválido' }, { status: 400 });
  if (!TIPOS.has(archivo.type) || !archivo.size || archivo.size > MAX_BYTES) return NextResponse.json({ error: 'Solo JPG, PNG, WebP, GIF o PDF de hasta 3 MB' }, { status: 400 });
  try {
    await ensureVitaminasAdjuntos();
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const receta = await client.query('SELECT id FROM recetas WHERE id = $1 FOR UPDATE', [id]);
      if (!receta.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Tratamiento no encontrado' }, { status: 404 });
      }
      const count = await client.query('SELECT COUNT(*)::int AS total FROM vitaminas_adjuntos WHERE receta_id = $1', [id]);
      if (count.rows[0].total >= MAX_ADJUNTOS) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Máximo 200 adjuntos por tratamiento' }, { status: 400 });
      }
      const saved = await client.query('INSERT INTO vitaminas_adjuntos (receta_id, nombre, tipo, contenido) VALUES ($1,$2,$3,$4) RETURNING id, nombre, tipo, fecha', [id, archivo.name.slice(0, 255), archivo.type, Buffer.from(await archivo.arrayBuffer())]);
      await client.query('COMMIT');
      return NextResponse.json(saved.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  } catch (error) {
    console.error('Error al guardar adjunto de vitaminas:', error);
    return NextResponse.json({ error: 'No se pudo guardar el adjunto' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Adjunto inválido' }, { status: 400 });
  try {
    await ensureVitaminasAdjuntos();
    const result = await pgPool.query('DELETE FROM vitaminas_adjuntos WHERE id = $1', [id]);
    return NextResponse.json({ success: Boolean(result.rowCount) }, { status: result.rowCount ? 200 : 404 });
  } catch (error) {
    console.error('Error al eliminar adjunto de vitaminas:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el adjunto' }, { status: 500 });
  }
}
