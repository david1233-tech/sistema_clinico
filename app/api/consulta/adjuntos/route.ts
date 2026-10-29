import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { ensureConsultaAdjuntos } from '@/lib/consulta-adjuntos';

const MAX_ADJUNTOS = 50;
const MAX_BYTES = 3 * 1024 * 1024;
const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Consulta inválida' }, { status: 400 });
  try {
    await ensureConsultaAdjuntos();
    const result = await pgPool.query('SELECT id, nombre, tipo, fecha FROM consulta_adjuntos WHERE consulta_id = $1 ORDER BY id', [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al listar adjuntos de consulta:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los adjuntos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 }); }
  const id = String(form.get('consulta_id') || '');
  const archivo = form.get('archivo');
  if (!/^\d+$/.test(id) || !(archivo instanceof File)) return NextResponse.json({ error: 'Consulta o archivo inválido' }, { status: 400 });
  if (!TIPOS.has(archivo.type) || archivo.size === 0 || archivo.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Solo imágenes JPG, PNG, WebP, GIF o PDF de hasta 3 MB' }, { status: 400 });
  }
  try {
    await ensureConsultaAdjuntos();
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const consulta = await client.query('SELECT id FROM consultas WHERE id = $1 FOR UPDATE', [id]);
      if (!consulta.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
      }
      const count = await client.query('SELECT COUNT(*)::int AS total FROM consulta_adjuntos WHERE consulta_id = $1', [id]);
      if (count.rows[0].total >= MAX_ADJUNTOS) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Máximo 50 adjuntos por consulta' }, { status: 400 });
      }
      const saved = await client.query(
        'INSERT INTO consulta_adjuntos (consulta_id, nombre, tipo, contenido) VALUES ($1, $2, $3, $4) RETURNING id, nombre, tipo, fecha',
        [id, archivo.name.slice(0, 255), archivo.type, Buffer.from(await archivo.arrayBuffer())]
      );
      await client.query('COMMIT');
      return NextResponse.json(saved.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error al guardar adjunto de consulta:', error);
    return NextResponse.json({ error: 'No se pudo guardar el adjunto' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Adjunto inválido' }, { status: 400 });
  try {
    await ensureConsultaAdjuntos();
    const result = await pgPool.query('DELETE FROM consulta_adjuntos WHERE id = $1', [id]);
    return NextResponse.json({ success: Boolean(result.rowCount) }, { status: result.rowCount ? 200 : 404 });
  } catch (error) {
    console.error('Error al eliminar adjunto de consulta:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el adjunto' }, { status: 500 });
  }
}

