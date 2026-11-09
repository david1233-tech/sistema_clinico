import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { ensureTriajeVitaminasImagenes } from '@/lib/triaje-vitaminas-imagenes';
import sharp from 'sharp';

const tipos = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif']);
const fechaValida = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && !Number.isNaN(Date.parse(value));

export async function GET(request: Request) {
  const dni = new URL(request.url).searchParams.get('dni') || '';
  if (!/^\d{8}$/.test(dni)) return NextResponse.json({ error: 'DNI inválido' }, { status: 400 });
  try {
    await ensureTriajeVitaminasImagenes();
    const result = await pgPool.query('SELECT id, nombre, tipo, fecha_subida, fecha_aplicacion FROM triaje_vitaminas_imagenes WHERE dni_paciente = $1 ORDER BY fecha_aplicacion DESC, id DESC', [dni]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al listar imágenes de vitaminas:', error);
    return NextResponse.json({ error: 'No se pudieron cargar las imágenes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const dni = String(form.get('dni') || '');
  const archivo = form.get('archivo');
  const fecha = form.get('fecha_aplicacion');
  if (!/^\d{8}$/.test(dni) || !(archivo instanceof File) || !fechaValida(fecha)) return NextResponse.json({ error: 'Paciente, imagen o fecha inválidos' }, { status: 400 });
  if (!tipos.has(archivo.type.toLowerCase()) || !archivo.size || archivo.size > 15 * 1024 * 1024) return NextResponse.json({ error: 'Use una imagen de hasta 15 MB' }, { status: 400 });
  let contenido: Buffer;
  let nombre = archivo.name.slice(0, 255);
  let tipo = archivo.type.toLowerCase();
  try {
    const original = Buffer.from(await archivo.arrayBuffer());
    if (original.length <= 3 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(tipo)) {
      await sharp(original).metadata();
      contenido = original;
    } else {
      contenido = await sharp(original, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
      if (contenido.length > 3 * 1024 * 1024) return NextResponse.json({ error: 'La imagen es demasiado grande para guardarla' }, { status: 400 });
      tipo = 'image/jpeg';
      nombre = `${nombre.replace(/\.[^.]+$/, '').slice(0, 240)}.jpg`;
    }
  } catch {
    return NextResponse.json({ error: 'No se pudo leer esta imagen. Pruebe con otra foto.' }, { status: 400 });
  }
  try {
    await ensureTriajeVitaminasImagenes();
    const paciente = await pgPool.query('SELECT 1 FROM pacientes WHERE dni = $1 LIMIT 1', [dni]);
    if (!paciente.rowCount) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`triaje-vitaminas-${dni}`]);
      const count = await client.query('SELECT COUNT(*)::int AS total FROM triaje_vitaminas_imagenes WHERE dni_paciente = $1', [dni]);
      if (count.rows[0].total >= 200) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Máximo 200 imágenes de vitaminas por paciente' }, { status: 400 }); }
      const result = await client.query('INSERT INTO triaje_vitaminas_imagenes (dni_paciente, nombre, tipo, contenido, fecha_aplicacion) VALUES ($1,$2,$3,$4,$5) RETURNING id, nombre, tipo, fecha_subida, fecha_aplicacion', [dni, nombre, tipo, contenido, fecha]);
      await client.query('COMMIT');
      return NextResponse.json(result.rows[0]);
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  } catch (error) {
    console.error('Error al guardar imagen de vitaminas:', error);
    return NextResponse.json({ error: 'No se pudo guardar la imagen' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { id, fecha_aplicacion } = await request.json();
  if (!/^\d+$/.test(String(id)) || !fechaValida(fecha_aplicacion)) return NextResponse.json({ error: 'Imagen o fecha inválida' }, { status: 400 });
  try {
    await ensureTriajeVitaminasImagenes();
    const result = await pgPool.query('UPDATE triaje_vitaminas_imagenes SET fecha_aplicacion = $1 WHERE id = $2 RETURNING id, nombre, tipo, fecha_subida, fecha_aplicacion', [fecha_aplicacion, id]);
    return result.rowCount ? NextResponse.json(result.rows[0]) : NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
  } catch (error) {
    console.error('Error al editar fecha de vitaminas:', error);
    return NextResponse.json({ error: 'No se pudo editar la fecha' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 });
  try {
    await ensureTriajeVitaminasImagenes();
    const result = await pgPool.query('DELETE FROM triaje_vitaminas_imagenes WHERE id = $1', [id]);
    return NextResponse.json({ success: Boolean(result.rowCount) }, { status: result.rowCount ? 200 : 404 });
  } catch (error) {
    console.error('Error al eliminar imagen de vitaminas:', error);
    return NextResponse.json({ error: 'No se pudo eliminar la imagen' }, { status: 500 });
  }
}

