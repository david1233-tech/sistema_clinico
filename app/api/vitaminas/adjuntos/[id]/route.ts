import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { ensureVitaminasAdjuntos } from '@/lib/vitaminas-adjuntos';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Adjunto inválido' }, { status: 400 });
  try {
    await ensureVitaminasAdjuntos();
    const result = await pgPool.query('SELECT nombre, tipo, contenido FROM vitaminas_adjuntos WHERE id = $1', [id]);
    if (!result.rowCount) return NextResponse.json({ error: 'Adjunto no encontrado' }, { status: 404 });
    const { nombre, tipo, contenido } = result.rows[0];
    return new Response(new Uint8Array(contenido), { headers: {
      'Content-Type': tipo, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(nombre)}`
    } });
  } catch (error) {
    console.error('Error al abrir adjunto de vitaminas:', error);
    return NextResponse.json({ error: 'No se pudo abrir el adjunto' }, { status: 500 });
  }
}
