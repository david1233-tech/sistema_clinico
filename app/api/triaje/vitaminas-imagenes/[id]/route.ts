import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { ensureTriajeVitaminasImagenes } from '@/lib/triaje-vitaminas-imagenes';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Imagen inválida' }, { status: 400 });
  try {
    await ensureTriajeVitaminasImagenes();
    const result = await pgPool.query('SELECT tipo, contenido FROM triaje_vitaminas_imagenes WHERE id = $1', [id]);
    if (!result.rowCount) return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    return new Response(new Uint8Array(result.rows[0].contenido), { headers: { 'Content-Type': result.rows[0].tipo, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    console.error('Error al abrir imagen de vitaminas:', error);
    return NextResponse.json({ error: 'No se pudo abrir la imagen' }, { status: 500 });
  }
}

