'use client';

import { useEffect, useState } from 'react';

type Adjunto = { id: string; nombre: string; tipo: string; fecha: string };

export default function TriajeImagenes({ triajeId }: { triajeId: string }) {
  const [archivos, setArchivos] = useState<Adjunto[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;
    fetch(`/api/triaje/adjuntos?id=${triajeId}`)
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error); return data; })
      .then(data => { if (activo) setArchivos(data); })
      .catch(error => { if (activo) setMensaje(error.message); });
    return () => { activo = false; };
  }, [triajeId]);

  const subir = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const seleccionados = Array.from(event.target.files || []);
    event.target.value = '';
    if (!seleccionados.length) return;
    if (archivos.length + seleccionados.length > 200) { setMensaje('Máximo 200 imágenes por triaje'); return; }
    setOcupado(true); setMensaje('');
    try {
      for (const archivo of seleccionados) {
        const form = new FormData(); form.set('triaje_id', triajeId); form.set('archivo', archivo);
        const response = await fetch('/api/triaje/adjuntos', { method: 'POST', body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setArchivos(prev => [...prev, data]);
      }
    } catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo subir la imagen'); }
    finally { setOcupado(false); }
  };

  const eliminar = async (id: string) => {
    if (!window.confirm('¿Eliminar este adjunto de triaje?')) return;
    setOcupado(true); setMensaje('');
    try {
      const response = await fetch(`/api/triaje/adjuntos?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No se pudo eliminar');
      setArchivos(prev => prev.filter(item => String(item.id) !== String(id)));
    } catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo eliminar'); }
    finally { setOcupado(false); }
  };

  return <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
    <label className="text-xs font-bold text-slate-700">Imágenes del triaje ({archivos.length}/200)
      <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={subir} disabled={ocupado || archivos.length >= 200} className="block mt-1 text-xs" />
    </label>
    {mensaje && <p role="status" className="text-xs text-rose-700 m-0">{mensaje}</p>}
    <div className="flex flex-wrap gap-2">{archivos.map(item => <span key={item.id} className="inline-flex gap-2 items-center rounded-lg bg-slate-100 px-2 py-1 text-xs"><a href={`/api/triaje/adjuntos/${item.id}`} target="_blank" rel="noreferrer" className="text-sky-700 max-w-36 truncate">{item.nombre}</a><button disabled={ocupado} onClick={() => eliminar(String(item.id))} className="text-rose-700" aria-label={`Eliminar ${item.nombre}`}>✕</button></span>)}</div>
  </div>;
}

