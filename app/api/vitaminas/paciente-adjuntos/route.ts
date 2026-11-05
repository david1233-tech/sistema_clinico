import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { ensureVitaminasAdjuntos } from '@/lib/vitaminas-adjuntos';
import { ensureVitaminasPacienteAdjuntos } from '@/lib/vitaminas-paciente-adjuntos';

const MAX_ARCHIVOS = 200;
const MAX_BYTES = 3 * 1024 * 1024;
const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);

export async function GET(request: Request) {
  const dni = new URL(request.url).searchParams.get('dni') || '';
  if (!/^\d{8}$/.test(dni)) return NextResponse.json({ error: 'DNI inválido' }, { status: 400 });
  try {
    await Promise.all([ensureVitaminasAdjuntos(), ensureVitaminasPacienteAdjuntos()]);
    const result = await pgPool.query(`
      SELECT id, nombre, tipo, fecha, 'paciente' AS origen FROM vitaminas_paciente_adjuntos WHERE dni_paciente = $1
      UNION ALL
      SELECT a.id, a.nombre, a.tipo, a.fecha, 'tratamiento' AS origen
      FROM vitaminas_adjuntos a JOIN recetas r ON r.id = a.receta_id WHERE r.dni_paciente = $1
      ORDER BY fecha DESC, id DESC
    `, [dni]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al listar archivos del paciente:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los archivos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const dni = String(form.get('dni_paciente') || '');
  const archivo = form.get('archivo');
  if (!/^\d{8}$/.test(dni) || !(archivo instanceof File)) return NextResponse.json({ error: 'Paciente o archivo inválido' }, { status: 400 });
  if (!TIPOS.has(archivo.type) || !archivo.size || archivo.size > MAX_BYTES) return NextResponse.json({ error: 'Solo JPG, PNG, WebP, GIF o PDF de hasta 3 MB' }, { status: 400 });
  try {
    await ensureVitaminasPacienteAdjuntos();
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`vitaminas-archivos-${dni}`]);
      const paciente = await client.query(`SELECT 1 FROM pacientes WHERE dni = $1 UNION SELECT 1 FROM triaje WHERE dni_paciente = $1 UNION SELECT 1 FROM recetas WHERE dni_paciente = $1 LIMIT 1`, [dni]);
      if (!paciente.rowCount) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
      }
      const count = await client.query('SELECT COUNT(*)::int AS total FROM vitaminas_paciente_adjuntos WHERE dni_paciente = $1', [dni]);
      if (count.rows[0].total >= MAX_ARCHIVOS) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Máximo 200 archivos por paciente' }, { status: 400 });
      }
      const result = await client.query('INSERT INTO vitaminas_paciente_adjuntos (dni_paciente, nombre, tipo, contenido) VALUES ($1,$2,$3,$4) RETURNING id, nombre, tipo, fecha', [dni, archivo.name.slice(0, 255), archivo.type, Buffer.from(await archivo.arrayBuffer())]);
      await client.query('COMMIT');
      return NextResponse.json({ ...result.rows[0], origen: 'paciente' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  } catch (error) {
    console.error('Error al guardar archivo del paciente:', error);
    return NextResponse.json({ error: 'No se pudo guardar el archivo' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 });
  try {
    await ensureVitaminasPacienteAdjuntos();
    const result = await pgPool.query('DELETE FROM vitaminas_paciente_adjuntos WHERE id = $1', [id]);
    return NextResponse.json({ success: Boolean(result.rowCount) }, { status: result.rowCount ? 200 : 404 });
  } catch (error) {
    console.error('Error al eliminar archivo del paciente:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el archivo' }, { status: 500 });
  }
}
