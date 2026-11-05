import { NextResponse } from 'next/server';
import { pgPool } from '@/lib/db';
import { ensureVitaminasPacienteAdjuntos } from '@/lib/vitaminas-paciente-adjuntos';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 });
  try {
    await ensureVitaminasPacienteAdjuntos();
    const result = await pgPool.query('SELECT nombre, tipo, contenido FROM vitaminas_paciente_adjuntos WHERE id = $1', [id]);
    if (!result.rowCount) return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    const { nombre, tipo, contenido } = result.rows[0];
    return new Response(new Uint8Array(contenido), { headers: {
      'Content-Type': tipo,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    } });
  } catch (error) {
    console.error('Error al abrir archivo del paciente:', error);
    return NextResponse.json({ error: 'No se pudo abrir el archivo' }, { status: 500 });
  }
}
