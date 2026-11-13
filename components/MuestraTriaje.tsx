'use client';

import { useEffect, useMemo, useState } from 'react';

type FotoTriaje = { id: number; nombre: string; tipo: string; fecha: string; triaje_id: number };

const fechaLima = (fecha: string) => {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(fecha));
  const valor = (tipo: string) => partes.find(parte => parte.type === tipo)?.value || '';
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
};

export default function MuestraTriaje({ dni }: { dni: string }) {
  const [fotos, setFotos] = useState<FotoTriaje[]>([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [rotaciones, setRotaciones] = useState<Record<number, number>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/triaje/adjuntos?dni=${encodeURIComponent(dni)}`, { cache: 'no-store', signal: controller.signal })
      .then(async respuesta => {
        if (!respuesta.ok) throw new Error('No se pudieron cargar las fotos de triaje.');
        return respuesta.json() as Promise<FotoTriaje[]>;
      })
      .then(setFotos)
      .catch(err => { if (err.name !== 'AbortError') setError(err.message || 'No se pudieron cargar las fotos de triaje.'); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [dni]);

  const visibles = useMemo(() => fotos.filter(foto => {
    const fecha = fechaLima(foto.fecha);
    return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
  }), [fotos, desde, hasta]);

  const rotar = (id: number, grados: number) => setRotaciones(actual => ({ ...actual, [id]: ((actual[id] || 0) + grados + 360) % 360 }));

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 sm:p-6" aria-label="Muestra de triaje del paciente">
      <h3 className="m-0 text-lg font-extrabold text-violet-900">Fotos de triaje</h3>
      <p className="mt-1 text-xs text-slate-600">Imágenes subidas en Enfermería, ordenadas por fecha de subida.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-xs font-bold text-slate-700">Desde
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-bold text-slate-700">Hasta
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
        </label>
        {(desde || hasta) && <button type="button" onClick={() => { setDesde(''); setHasta(''); }} className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-800">Limpiar fechas</button>}
      </div>
      {cargando ? <p role="status" className="mt-4 text-sm text-slate-600">Cargando fotos...</p>
        : error ? <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>
        : fotos.length === 0 ? <p className="mt-4 text-sm text-slate-600">Este paciente aún no tiene fotos de triaje.</p>
        : visibles.length === 0 ? <p className="mt-4 text-sm text-slate-600">No hay fotos subidas en las fechas seleccionadas.</p>
        : <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibles.map(foto => (
              <article key={foto.id} className="min-w-0 rounded-xl border border-violet-200 bg-white p-3 shadow-sm">
                <div className="mb-2 text-xs text-slate-700">
                  <strong className="block break-words text-sm text-slate-900">{foto.nombre}</strong>
                  <span>Subida: {new Date(foto.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <div className="mx-auto flex aspect-square w-full max-w-[28rem] items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                  {/* La superficie cuadrada mantiene visible la imagen al girarla 90 grados. */}
                  <img src={`/api/triaje/adjuntos/${foto.id}`} alt={`Foto de triaje: ${foto.nombre}`} className="h-full w-full object-contain transition-transform duration-200" style={{ transform: `rotate(${rotaciones[foto.id] || 0}deg)` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => rotar(foto.id, -90)} aria-label={`Girar ${foto.nombre} a la izquierda`} className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-800">↶ Girar izquierda</button>
                  <button type="button" onClick={() => rotar(foto.id, 90)} aria-label={`Girar ${foto.nombre} a la derecha`} className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-800">↷ Girar derecha</button>
                  <button type="button" onClick={() => setRotaciones(actual => ({ ...actual, [foto.id]: 0 }))} className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-800">Horizontal</button>
                  <button type="button" onClick={() => setRotaciones(actual => ({ ...actual, [foto.id]: 90 }))} className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-800">Vertical</button>
                </div>
              </article>
            ))}
          </div>}
    </section>
  );
}

