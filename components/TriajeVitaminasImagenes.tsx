'use client';

import { useEffect, useRef, useState } from 'react';

type Imagen = { id: string; nombre: string; fecha_subida: string; fecha_aplicacion: string };
type Pendiente = { id: number; archivo: File; fecha: string };
const localDateTime = (value: string | Date) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function TriajeVitaminasImagenes({ dni }: { dni: string }) {
  const [imagenes, setImagenes] = useState<Imagen[]>([]);
  const [archivos, setArchivos] = useState<Pendiente[]>([]);
  const [fecha, setFecha] = useState(() => localDateTime(new Date()));
  const camaraRef = useRef<HTMLInputElement>(null);
  const siguienteId = useRef(0);
  const [editando, setEditando] = useState<string | null>(null);
  const [fechaEditada, setFechaEditada] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [imagenAbierta, setImagenAbierta] = useState<Imagen | null>(null);
  const [zoom, setZoom] = useState(1);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!imagenAbierta) return;
    cerrarRef.current?.focus();
    const cerrarConEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setImagenAbierta(null); };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [imagenAbierta]);

  useEffect(() => {
    if (!/^\d{8}$/.test(dni)) return;
    let vigente = true;
    fetch(`/api/triaje/vitaminas-imagenes?dni=${dni}`)
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error); return data; })
      .then(data => { if (vigente) setImagenes(data); })
      .catch(error => { if (vigente) setMensaje(error.message || 'No se pudieron cargar las imágenes'); });
    return () => { vigente = false; };
  }, [dni]);

  const guardarArchivos = async (pendientes: Pendiente[], esCamara = false) => {
    if (!pendientes.length || !dni) return;
    if (imagenes.length + pendientes.length > 200) { setMensaje('Máximo 200 imágenes de vitaminas por paciente'); return; }
    setOcupado(true); setMensaje('');
    let guardadas = 0;
    try {
      for (const pendiente of pendientes) {
        const { archivo } = pendiente;
        if (!pendiente.fecha || Number.isNaN(new Date(pendiente.fecha).getTime())) throw new Error(`Indique la fecha y hora de ${archivo.name}`);
        setMensaje(`Guardando ${guardadas + 1} de ${pendientes.length}: ${archivo.name}`);
        const form = new FormData();
        form.set('dni', dni); form.set('archivo', archivo); form.set('fecha_aplicacion', new Date(pendiente.fecha).toISOString());
        const response = await fetch('/api/triaje/vitaminas-imagenes', { method: 'POST', body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(`${archivo.name}: ${data.error || 'No se pudo guardar'}`);
        setImagenes(prev => [data, ...prev]);
        if (!esCamara) setArchivos(prev => prev.filter(item => item.id !== pendiente.id));
        guardadas++;
      }
      setMensaje(`${guardadas} imagen(es) guardada(s) con su fecha y hora de aplicación.`);
    } catch (error) {
      setMensaje(`${guardadas} imagen(es) guardada(s). ${error instanceof Error ? error.message : 'No se pudo continuar'}`);
    }
    finally { setOcupado(false); }
  };

  const subir = (event: React.FormEvent) => { event.preventDefault(); void guardarArchivos(archivos); };
  const seleccionarArchivos = (files: FileList | null) => {
    if (!files?.length) return;
    setArchivos(prev => [...prev, ...Array.from(files, archivo => ({ id: ++siguienteId.current, archivo, fecha }))]);
  };
  const tomarFoto = async (files: FileList | null) => {
    const archivo = files?.[0];
    if (camaraRef.current) camaraRef.current.value = '';
    if (archivo) await guardarArchivos([{ id: ++siguienteId.current, archivo, fecha }], true);
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
    <div><h2 className="text-base font-extrabold m-0 text-slate-900">💉 Imágenes de vitaminas ({imagenes.length}/200)</h2><p className="text-xs text-slate-500 mt-1 mb-0">Elija la fecha de aplicación antes de tomar una foto: se guardará automáticamente. Si selecciona varias imágenes, puede indicar una fecha diferente para cada una antes de guardarlas.</p></div>
    {!dni && <p className="text-sm text-amber-700">Seleccione un paciente para agregar o consultar sus imágenes.</p>}
    <form onSubmit={subir} className="flex flex-col gap-3">
      <label className="text-xs font-bold text-slate-700">Fecha y hora de aplicación<input type="datetime-local" required value={fecha} onChange={event => setFecha(event.target.value)} disabled={!dni || ocupado} className="block w-full mt-1 p-2 rounded-lg border border-slate-300" /></label>
      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" disabled={!dni || ocupado || !fecha || imagenes.length + archivos.length >= 200} onClick={() => camaraRef.current?.click()} className="bg-violet-600 text-white px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-50">📷 Tomar foto y guardar</button>
        <input ref={camaraRef} type="file" accept="image/*" capture="environment" onChange={event => void tomarFoto(event.target.files)} className="sr-only" aria-label="Tomar foto de vitamina" />
        <label className="text-xs font-bold text-slate-700">Elegir imágenes<input type="file" multiple accept="image/*" disabled={!dni || ocupado} onChange={event => { seleccionarArchivos(event.target.files); event.target.value = ''; }} className="block w-full mt-1 text-xs" /></label>
      </div>
      {archivos.map(item => <div key={item.id} className="flex flex-wrap gap-2 items-center text-xs border border-slate-200 rounded-lg p-2"><span className="min-w-0 flex-1 truncate" title={item.archivo.name}>{item.archivo.name}</span><label>Fecha y hora<input type="datetime-local" required value={item.fecha} onChange={event => setArchivos(prev => prev.map(actual => actual.id === item.id ? { ...actual, fecha: event.target.value } : actual))} className="block border border-slate-300 rounded-lg p-1" /></label><button type="button" onClick={() => setArchivos(prev => prev.filter(actual => actual.id !== item.id))} className="text-rose-700 font-bold">Quitar</button></div>)}
      {archivos.length > 0 && <button type="submit" disabled={!dni || ocupado || imagenes.length + archivos.length > 200} className="bg-violet-600 text-white px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-50">Guardar {archivos.length} imagen(es)</button>}
    </form>
    {mensaje && <p role="status" className="text-xs text-slate-700 m-0">{mensaje}</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {imagenes.map(item => <article key={item.id} className="rounded-xl border border-slate-200 p-3 flex flex-col gap-2 min-w-0">
        <button type="button" onClick={() => { setImagenAbierta(item); setZoom(1); }} aria-label={`Abrir imagen ${item.nombre}`} className="cursor-zoom-in"><img src={`/api/triaje/vitaminas-imagenes/${item.id}`} alt={item.nombre} className="w-full h-36 object-contain bg-slate-50 rounded-lg" /></button>
        <strong className="text-xs truncate" title={item.nombre}>{item.nombre}</strong>
        <span className="text-xs text-slate-600">Subida: {new Date(item.fecha_subida).toLocaleString('es-PE')}</span>
        {editando === String(item.id) ? <div className="flex flex-wrap gap-2"><input type="datetime-local" value={fechaEditada} onChange={event => setFechaEditada(event.target.value)} className="border border-slate-300 rounded-lg p-1 text-xs" /><button disabled={ocupado} onClick={() => guardarFecha(String(item.id))} className="text-violet-700 text-xs font-bold">Guardar fecha</button><button onClick={() => setEditando(null)} className="text-xs">Cancelar</button></div> : <span className="text-xs text-slate-700">Aplicación: {new Date(item.fecha_aplicacion).toLocaleString('es-PE')}</span>}
        <div className="flex gap-3"><button onClick={() => { setEditando(String(item.id)); setFechaEditada(localDateTime(item.fecha_aplicacion)); }} className="text-violet-700 text-xs font-bold">Editar fecha</button><button disabled={ocupado} onClick={() => eliminar(String(item.id))} className="text-rose-700 text-xs font-bold">Eliminar</button></div>
      </article>)}
    </div>
    {imagenAbierta && <div role="dialog" aria-modal="true" aria-label={`Imagen ${imagenAbierta.nombre}`} className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-white" onClick={event => { if (event.target === event.currentTarget) setImagenAbierta(null); }}>
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-white/20">
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{imagenAbierta.nombre}</span>
        <button type="button" onClick={() => setZoom(value => Math.max(1, Number((value - 0.5).toFixed(1))))} disabled={zoom <= 1} aria-label="Alejar imagen" className="rounded-lg border border-white/40 px-3 py-1 text-lg disabled:opacity-40">−</button>
        <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(value => Math.min(4, Number((value + 0.5).toFixed(1))))} disabled={zoom >= 4} aria-label="Acercar imagen" className="rounded-lg border border-white/40 px-3 py-1 text-lg disabled:opacity-40">+</button>
        <button ref={cerrarRef} type="button" onClick={() => setImagenAbierta(null)} aria-label="Cerrar imagen y volver" className="rounded-lg bg-white text-slate-950 px-3 py-1 text-xl font-bold">×</button>
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-6 text-center">
        <img src={`/api/triaje/vitaminas-imagenes/${imagenAbierta.id}`} alt={imagenAbierta.nombre} className="block mx-auto h-auto object-contain" style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? '100%' : 'none', maxHeight: zoom === 1 ? 'calc(100vh - 110px)' : 'none' }} />
      </div>
    </div>}
  </section>;
}

