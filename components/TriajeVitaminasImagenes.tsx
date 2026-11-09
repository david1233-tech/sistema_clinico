'use client';

import { useEffect, useState } from 'react';

type Imagen = { id: string; nombre: string; fecha_subida: string; fecha_aplicacion: string };
const localDateTime = (value: string | Date) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function TriajeVitaminasImagenes({ dni }: { dni: string }) {
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fecha, setFecha] = useState(() => localDateTime(new Date()));
  const [editando, setEditando] = useState<string | null>(null);
  const [fechaEditada, setFechaEditada] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!/^\d{8}$/.test(dni)) return;
    let vigente = true;
    fetch(`/api/triaje/vitaminas-imagenes?dni=${dni}`)
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error); return data; })
      .then(data => { if (vigente) setImagenes(data); })
      .catch(error => { if (vigente) setMensaje(error.message || 'No se pudieron cargar las imágenes'); });
    return () => { vigente = false; };
  }, [dni]);

  const subir = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!archivo || !dni) return;
    if (imagenes.length >= 200) { setMensaje('Máximo 200 imágenes de vitaminas por paciente'); return; }
    setOcupado(true); setMensaje('');
    try {
      const form = new FormData();
      form.set('dni', dni); form.set('archivo', archivo); form.set('fecha_aplicacion', new Date(fecha).toISOString());
      const response = await fetch('/api/triaje/vitaminas-imagenes', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setImagenes(prev => [data, ...prev]); setArchivo(null); setFecha(localDateTime(new Date()));
      const input = document.getElementById('triaje-vitaminas-archivo') as HTMLInputElement | null;
      if (input) input.value = '';
      setMensaje('Imagen guardada. Puede corregir la fecha y hora cuando lo necesite.');
    } catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo subir la imagen'); }
    finally { setOcupado(false); }
  };

  const guardarFecha = async (id: string) => {
    setOcupado(true); setMensaje('');
    try {
      const response = await fetch('/api/triaje/vitaminas-imagenes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, fecha_aplicacion: new Date(fechaEditada).toISOString() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setImagenes(prev => prev.map(item => String(item.id) === String(id) ? data : item)); setEditando(null);
    } catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo guardar la fecha'); }
    finally { setOcupado(false); }
  };

  const eliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar esta imagen de vitaminas?')) return;
    setOcupado(true); setMensaje('');
    try {
      const response = await fetch(`/api/triaje/vitaminas-imagenes?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No se pudo eliminar la imagen');
      setImagenes(prev => prev.filter(item => String(item.id) !== String(id)));
    } catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo eliminar'); }
    finally { setOcupado(false); }
  };

  return <section className="bg-white rounded-2xl p-5 border border-violet-200 shadow-sm flex flex-col gap-4">
    <div><h2 className="text-base font-extrabold m-0 text-slate-900">💉 Imágenes de vitaminas ({imagenes.length}/200)</h2><p className="text-xs text-slate-500 mt-1 mb-0">Fotos del paciente seleccionado. Indique cuándo se aplicaron las vitaminas; la fecha de subida se registra automáticamente.</p></div>
    {!dni && <p className="text-sm text-amber-700">Seleccione un paciente para agregar o consultar sus imágenes.</p>}
    <form onSubmit={subir} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
      <label className="text-xs font-bold text-slate-700">Imagen<input id="triaje-vitaminas-archivo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required disabled={!dni || ocupado} onChange={event => setArchivo(event.target.files?.[0] || null)} className="block w-full mt-1 text-xs" /></label>
      <label className="text-xs font-bold text-slate-700">Fecha y hora de aplicación<input type="datetime-local" required value={fecha} onChange={event => setFecha(event.target.value)} disabled={!dni || ocupado} className="block w-full mt-1 p-2 rounded-lg border border-slate-300" /></label>
      <button type="submit" disabled={!dni || ocupado || imagenes.length >= 200} className="bg-violet-600 text-white px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-50">Guardar imagen</button>
    </form>
    {mensaje && <p role="status" className="text-xs text-slate-700 m-0">{mensaje}</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {imagenes.map(item => <article key={item.id} className="rounded-xl border border-slate-200 p-3 flex flex-col gap-2 min-w-0">
        <a href={`/api/triaje/vitaminas-imagenes/${item.id}`} target="_blank" rel="noreferrer"><img src={`/api/triaje/vitaminas-imagenes/${item.id}`} alt={item.nombre} className="w-full h-36 object-contain bg-slate-50 rounded-lg" /></a>
        <strong className="text-xs truncate" title={item.nombre}>{item.nombre}</strong>
        <span className="text-xs text-slate-600">Subida: {new Date(item.fecha_subida).toLocaleString('es-PE')}</span>
        {editando === String(item.id) ? <div className="flex flex-wrap gap-2"><input type="datetime-local" value={fechaEditada} onChange={event => setFechaEditada(event.target.value)} className="border border-slate-300 rounded-lg p-1 text-xs" /><button disabled={ocupado} onClick={() => guardarFecha(String(item.id))} className="text-violet-700 text-xs font-bold">Guardar fecha</button><button onClick={() => setEditando(null)} className="text-xs">Cancelar</button></div> : <span className="text-xs text-slate-700">Aplicación: {new Date(item.fecha_aplicacion).toLocaleString('es-PE')}</span>}
        <div className="flex gap-3"><button onClick={() => { setEditando(String(item.id)); setFechaEditada(localDateTime(item.fecha_aplicacion)); }} className="text-violet-700 text-xs font-bold">Editar fecha</button><button disabled={ocupado} onClick={() => eliminar(String(item.id))} className="text-rose-700 text-xs font-bold">Eliminar</button></div>
      </article>)}
    </div>
  </section>;
}

