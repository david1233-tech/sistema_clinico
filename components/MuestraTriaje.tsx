'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { reconocerTextoLocal } from '@/lib/ocr-navegador';
import { extraerFechaConsultaTriaje } from '@/lib/ocr-triaje';

type FotoTriaje = { id: number; nombre: string; tipo: string; fecha: string; fecha_consulta: string | null; triaje_id: number };

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
  const [fechaEditada, setFechaEditada] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState<number | null>(null);
  const [erroresFecha, setErroresFecha] = useState<Record<number, string>>({});
  const [lectura, setLectura] = useState<{ actual: number; total: number } | null>(null);
  const [avisoLectura, setAvisoLectura] = useState('');
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const cambiosManuales = useRef(new Set<number>());

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/triaje/adjuntos?dni=${encodeURIComponent(dni)}`, { cache: 'no-store', signal: controller.signal })
      .then(async respuesta => {
        if (!respuesta.ok) throw new Error('No se pudieron cargar las fotos de triaje.');
        return respuesta.json() as Promise<FotoTriaje[]>;
      })
      .then(async (items) => {
        if (controller.signal.aborted) return;
        setFotos(items);
        setCargando(false);
        const pendientes = items.filter(foto => !foto.fecha_consulta);
        if (!pendientes.length) return;
        setLectura({ actual: 0, total: pendientes.length });
        for (const [indice, foto] of pendientes.entries()) {
          if (controller.signal.aborted) break;
          setLectura({ actual: indice + 1, total: pendientes.length });
          try {
            const respuesta = await fetch(`/api/triaje/adjuntos/${foto.id}`, { signal: controller.signal });
            if (!respuesta.ok) continue;
            const archivo = new File([await respuesta.blob()], foto.nombre, { type: foto.tipo });
            const fecha = extraerFechaConsultaTriaje(await reconocerTextoLocal(archivo, () => {}));
            if (!fecha || controller.signal.aborted || cambiosManuales.current.has(foto.id)) continue;
            const guardado = await fetch('/api/triaje/adjuntos', {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: foto.id, fecha_consulta: fecha }), signal: controller.signal
            });
            if (guardado.ok && !controller.signal.aborted) setFotos(actual => actual.map(item => item.id === foto.id ? { ...item, fecha_consulta: fecha } : item));
            else if (!guardado.ok) setErroresFecha(actual => ({ ...actual, [foto.id]: 'Se leyó una fecha, pero no se pudo guardar. Ingrésela de nuevo.' }));
          } catch (err) {
            if (err instanceof Error && /lector de texto|conexi[oó]n a internet/i.test(err.message)) {
              if (!controller.signal.aborted) setAvisoLectura('No se pudo leer el texto de las fichas. Puede ingresar las fechas manualmente.');
              break;
            }
          }
        }
        if (!controller.signal.aborted) setLectura(null);
      })
      .catch(err => { if (err.name !== 'AbortError') { setError(err.message || 'No se pudieron cargar las fotos de triaje.'); setCargando(false); } });
    return () => controller.abort();
  }, [dni]);

  const visibles = useMemo(() => fotos.filter(foto => {
    const fecha = foto.fecha_consulta || fechaLima(foto.fecha);
    return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
  }).sort((a, b) => (b.fecha_consulta || fechaLima(b.fecha)).localeCompare(a.fecha_consulta || fechaLima(a.fecha)) || b.id - a.id), [fotos, desde, hasta]);

  const rotar = (id: number, grados: number) => setRotaciones(actual => ({ ...actual, [id]: ((actual[id] || 0) + grados + 360) % 360 }));
  const fotoSeleccionada = fotos.find(foto => foto.id === seleccionada);
  const abrirFoto = (id: number) => { setSeleccionada(id); setZoom(1); };

  useEffect(() => {
    if (seleccionada === null) return;
    const cerrarConEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSeleccionada(null); };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [seleccionada]);

  const guardarFecha = async (foto: FotoTriaje) => {
    const fecha = fechaEditada[foto.id] || null;
    cambiosManuales.current.add(foto.id);
    setGuardando(foto.id);
    setErroresFecha(actual => ({ ...actual, [foto.id]: '' }));
    try {
      const respuesta = await fetch('/api/triaje/adjuntos', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: foto.id, fecha_consulta: fecha })
      });
      if (!respuesta.ok) throw new Error((await respuesta.json()).error || 'No se pudo guardar la fecha.');
      setFotos(actual => actual.map(item => item.id === foto.id ? { ...item, fecha_consulta: fecha } : item));
      setFechaEditada(actual => { const siguiente = { ...actual }; delete siguiente[foto.id]; return siguiente; });
    } catch (err) {
      setErroresFecha(actual => ({ ...actual, [foto.id]: err instanceof Error ? err.message : 'No se pudo guardar la fecha.' }));
    } finally { setGuardando(null); }
  };

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 sm:p-6" aria-label="Muestra de triaje del paciente">
      <h3 className="m-0 text-lg font-extrabold text-violet-900">Fotos de triaje</h3>
      <p className="mt-1 text-xs text-slate-600">Fotos de Enfermería. Las fechas de consulta se leen de la ficha cuando son legibles; puede corregirlas debajo de cada imagen.</p>
      {lectura && <p role="status" className="mt-2 text-xs font-semibold text-violet-800">Leyendo fechas de las fichas: {lectura.actual} de {lectura.total}</p>}
      {avisoLectura && <p role="alert" className="mt-2 text-xs text-amber-800">{avisoLectura}</p>}
      <div className="mt-4 flex flex-wrap items-end gap-3 no-print">
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
        : <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-4">
            {visibles.map(foto => (
              <article key={foto.id} className="min-w-0 break-inside-avoid rounded-xl border border-violet-200 bg-white p-3 shadow-sm">
                <div className="mb-2 text-xs text-slate-700">
                  <strong className="block break-words text-sm text-slate-900">{foto.nombre}</strong>
                  <span className="block">{foto.fecha_consulta ? `Consulta: ${foto.fecha_consulta.split('-').reverse().join('/')}` : 'Fecha de consulta pendiente'}</span>
                  <span className="block text-slate-500">Subida: {new Date(foto.fecha).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
                <button type="button" onClick={() => abrirFoto(foto.id)} aria-label={`Ampliar foto de triaje ${foto.nombre}`} className="mx-auto flex aspect-square w-full max-w-[28rem] items-center justify-center overflow-hidden rounded-lg bg-slate-100 cursor-zoom-in">
                  {/* La superficie cuadrada mantiene visible la imagen al girarla 90 grados. */}
                  <img src={`/api/triaje/adjuntos/${foto.id}`} alt={`Foto de triaje: ${foto.nombre}`} className="h-full w-full object-contain transition-transform duration-200" style={{ transform: `rotate(${rotaciones[foto.id] || 0}deg)` }} />
                </button>
                <div className="mt-3 flex flex-wrap items-end gap-2 no-print">
                  <label className="min-w-0 text-xs font-bold text-slate-700">Fecha de consulta en la ficha
                    <input type="date" value={fechaEditada[foto.id] ?? foto.fecha_consulta ?? ''} onChange={e => { cambiosManuales.current.add(foto.id); setFechaEditada(actual => ({ ...actual, [foto.id]: e.target.value })); }} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" />
                  </label>
                  <button type="button" disabled={guardando === foto.id || fechaEditada[foto.id] === undefined} onClick={() => guardarFecha(foto)} className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{guardando === foto.id ? 'Guardando...' : 'Guardar fecha'}</button>
                </div>
                {erroresFecha[foto.id] && <p role="alert" className="mt-1 text-xs text-rose-700">{erroresFecha[foto.id]}</p>}
                <div className="mt-3 flex flex-wrap gap-2 no-print">
                  <button type="button" onClick={() => rotar(foto.id, -90)} aria-label={`Girar ${foto.nombre} a la izquierda`} className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-800">↶ Girar izquierda</button>
                  <button type="button" onClick={() => rotar(foto.id, 90)} aria-label={`Girar ${foto.nombre} a la derecha`} className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-800">↷ Girar derecha</button>
                  <button type="button" onClick={() => setRotaciones(actual => ({ ...actual, [foto.id]: 0 }))} className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-800">Horizontal</button>
                  <button type="button" onClick={() => setRotaciones(actual => ({ ...actual, [foto.id]: 90 }))} className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-800">Vertical</button>
                </div>
              </article>
            ))}
          </div>}
      {fotoSeleccionada && <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 p-3 text-white no-print" role="dialog" aria-modal="true" aria-label={`Foto ampliada: ${fotoSeleccionada.nombre}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
          <strong className="max-w-full truncate text-sm">{fotoSeleccionada.nombre}</strong>
          <button type="button" onClick={() => setSeleccionada(null)} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900">✕ Cerrar</button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg bg-black">
          <img src={`/api/triaje/adjuntos/${fotoSeleccionada.id}`} alt={`Foto ampliada: ${fotoSeleccionada.nombre}`} draggable={false} className="max-h-[70vh] max-w-[90vw] object-contain transition-transform duration-150" style={{ transform: `rotate(${rotaciones[fotoSeleccionada.id] || 0}deg) scale(${zoom})` }} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs">
          <button type="button" onClick={() => setZoom(valor => Math.max(0.5, Math.round((valor - 0.25) * 100) / 100))} className="rounded-lg bg-white px-3 py-2 font-bold text-slate-900">− Alejar</button>
          <span className="min-w-12 text-center font-bold">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom(valor => Math.min(4, Math.round((valor + 0.25) * 100) / 100))} className="rounded-lg bg-white px-3 py-2 font-bold text-slate-900">+ Acercar</button>
          <button type="button" onClick={() => setZoom(1)} className="rounded-lg bg-slate-700 px-3 py-2 font-bold">Restablecer zoom</button>
          <button type="button" onClick={() => rotar(fotoSeleccionada.id, -90)} className="rounded-lg bg-violet-700 px-3 py-2 font-bold">↶ Girar izquierda</button>
          <button type="button" onClick={() => rotar(fotoSeleccionada.id, 90)} className="rounded-lg bg-violet-700 px-3 py-2 font-bold">↷ Girar derecha</button>
        </div>
      </div>}
    </section>
  );
}

