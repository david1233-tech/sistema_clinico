'use client';

import { useEffect, useState } from 'react';

type Control = { id: number; fecha: string; presion: string; pulso: string; saturacion: string; frecuencia_respiratoria: string; temperatura: string; peso: string; imc: string; grasa_corporal: string; grasa_visceral: string };
type Procedimiento = { id: number; fecha: string; categoria: string; descripcion: string };
const campos = [
  ['presion', 'P/A'], ['pulso', 'Pulso'], ['saturacion', 'Sat'], ['frecuencia_respiratoria', 'F. Resp'],
  ['temperatura', 'T°'], ['peso', 'Peso'], ['imc', 'IMC'], ['grasa_corporal', 'Grasa corporal'], ['grasa_visceral', 'Grasa visceral']
] as const;
const grupos = [
  ['Enema de café - Limpieza hepática', 'Vitamina C', 'LVS', 'LII', 'Otros', 'Suero'],
  ['Baño sal', 'Sauna', 'Otro', 'Masajes', 'Hidroterapia de colon', 'Desintoxicación iónica y Zapper']
];
const hoy = () => { const fecha = new Date(); return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`; };
const controlNuevo = (): Control => ({ id: 0, fecha: hoy(), presion: '', pulso: '', saturacion: '', frecuencia_respiratoria: '', temperatura: '', peso: '', imc: '', grasa_corporal: '', grasa_visceral: '' });
const procedimientoNuevo = (): Procedimiento => ({ id: 0, fecha: hoy(), categoria: grupos[0][0], descripcion: '' });
const fechaLocal = (value: string) => value?.slice(0, 10) || '';

export default function VitaminasSeguimiento({ dni, nombre }: { dni: string; nombre: string }) {
  const [controles, setControles] = useState<Control[]>([]);
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  const [control, setControl] = useState<Control>(controlNuevo);
  const [procedimiento, setProcedimiento] = useState<Procedimiento>(procedimientoNuevo);
  const [claveSolicitud, setClaveSolicitud] = useState(() => crypto.randomUUID());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;
    fetch(`/api/vitaminas/seguimiento?dni=${encodeURIComponent(dni)}`, { cache: 'no-store' })
      .then(async respuesta => { if (!respuesta.ok) throw new Error((await respuesta.json()).error || 'No se pudo cargar la ficha.'); return respuesta.json(); })
      .then(data => { if (activo) { setControles(data.controles); setProcedimientos(data.procedimientos); setCargando(false); } })
      .catch(error => { if (activo) { setMensaje(error.message); setCargando(false); } });
    return () => { activo = false; };
  }, [dni]);

  async function guardar(tipo: 'control' | 'procedimiento') {
    const datos = tipo === 'control' ? control : procedimiento;
    setGuardando(true); setMensaje('');
    try {
      const respuesta = await fetch('/api/vitaminas/seguimiento', {
        method: datos.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...datos, tipo, dni_paciente: dni, ...(tipo === 'procedimiento' ? { clave_solicitud: claveSolicitud } : {}) })
      });
      const guardado = await respuesta.json();
      if (!respuesta.ok) throw new Error(guardado.error || 'No se pudo guardar.');
      if (tipo === 'control') {
        setControles(prev => [guardado, ...prev.filter(item => item.id !== guardado.id)].sort((a, b) => b.fecha.localeCompare(a.fecha)));
        setControl(controlNuevo());
      } else {
        setProcedimientos(prev => [guardado, ...prev.filter(item => item.id !== guardado.id)].sort((a, b) => b.fecha.localeCompare(a.fecha)));
        setProcedimiento(procedimientoNuevo());
        setClaveSolicitud(crypto.randomUUID());
      }
      setMensaje('Ficha guardada correctamente.');
    } catch (error) { setMensaje(error instanceof Error ? error.message : 'No se pudo guardar.'); }
    finally { setGuardando(false); }
  }

  const entrada = 'w-full min-w-[76px] rounded-md border border-sky-200 bg-white px-2 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none';
  const boton = 'rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-800 disabled:opacity-50';

  return <section id="ficha-seguimiento" className="order-3 xl:col-span-2 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm md:p-6 print:border-0 print:p-0 print:shadow-none" aria-label="Ficha de seguimiento">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sky-200 pb-4">
      <div><span className="text-xs font-bold uppercase tracking-wider text-sky-700">Módulo Vitaminas</span><h3 className="m-0 text-xl font-black text-slate-900">Ficha de seguimiento</h3><p className="m-0 text-sm text-slate-600">{nombre} · DNI {dni} · Fecha: {new Date().toLocaleDateString('es-PE')}</p></div>
      <div className="flex flex-wrap gap-2 print:hidden"><button type="button" onClick={() => window.print()} className="rounded-lg border border-sky-300 px-3 py-2 text-sm font-bold text-sky-800">Imprimir</button><button type="button" onClick={() => window.print()} className="rounded-lg border border-sky-300 px-3 py-2 text-sm font-bold text-sky-800" title="En el cuadro de impresión, elija Guardar como PDF">Exportar a PDF</button></div>
    </div>
    {mensaje && <p role="status" className="rounded-lg bg-sky-50 p-2 text-sm font-semibold text-sky-900 print:hidden">{mensaje}</p>}
    {cargando ? <p className="text-sm text-slate-600">Cargando historial...</p> : <>
      <div className="mt-5"><div className="mb-2 flex items-center justify-between"><h4 className="m-0 text-base font-extrabold text-sky-900">Registro diario</h4><button type="button" onClick={() => setControl(controlNuevo())} className="text-sm font-bold text-sky-700 print:hidden">＋ Agregar registro diario</button></div>
        <div className="overflow-x-auto rounded-lg border border-sky-200"><table className="w-full min-w-[1120px] border-collapse text-left text-xs"><thead className="bg-sky-100 text-sky-950"><tr><th className="border border-sky-200 p-2">FECHA</th>{campos.map(([, titulo]) => <th key={titulo} className="border border-sky-200 p-2">{titulo}</th>)}<th className="border border-sky-200 p-2 print:hidden">Acción</th></tr></thead><tbody>
          {controles.map(item => <tr key={item.id}><td className="border border-sky-100 p-2">{fechaLocal(item.fecha)}</td>{campos.map(([campo]) => <td key={campo} className="border border-sky-100 p-2">{item[campo] || '—'}</td>)}<td className="border border-sky-100 p-2 print:hidden"><button type="button" onClick={() => setControl({ ...item, fecha: fechaLocal(item.fecha) })} className="font-bold text-sky-700">Editar</button></td></tr>)}
          <tr className="bg-sky-50/60 print:hidden"><td className="border border-sky-100 p-1"><input aria-label="Fecha del control" type="date" required value={control.fecha} onChange={e => setControl({ ...control, fecha: e.target.value })} className={entrada} /></td>{campos.map(([campo, titulo]) => <td key={campo} className="border border-sky-100 p-1"><input aria-label={titulo} value={control[campo]} maxLength={30} onChange={e => setControl({ ...control, [campo]: e.target.value })} className={entrada} /></td>)}<td className="border border-sky-100 p-1"><button type="button" disabled={guardando || !control.fecha} onClick={() => guardar('control')} className={boton}>{guardando ? 'Guardando...' : control.id ? 'Guardar cambios' : 'Guardar ficha'}</button></td></tr>
        </tbody></table></div>
      </div>
      <div className="mt-6"><div className="mb-3 flex items-center justify-between"><h4 className="m-0 text-base font-extrabold text-sky-900">Tratamientos realizados</h4><button type="button" onClick={() => setProcedimiento(procedimientoNuevo())} className="text-sm font-bold text-sky-700 print:hidden">＋ Agregar tratamiento</button></div>
        <div className="grid gap-3 md:grid-cols-2">{grupos.map((grupo, indice) => <div key={indice} className="space-y-3">{grupo.map(categoria => <div key={categoria} className="rounded-lg border border-sky-200 p-3"><h5 className="m-0 text-sm font-extrabold text-sky-900">{categoria}</h5>{procedimientos.filter(item => item.categoria === categoria).map(item => <div key={item.id} className="mt-2 border-t border-sky-100 pt-2 text-sm"><time className="font-bold text-slate-700">{fechaLocal(item.fecha)}</time><p className="m-0 whitespace-pre-wrap text-slate-700">{item.descripcion}</p><button type="button" onClick={() => setProcedimiento({ ...item, fecha: fechaLocal(item.fecha) })} className="mt-1 text-xs font-bold text-sky-700 print:hidden">Editar registro</button></div>)}</div>)}</div>)}</div>
      </div>
      <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 print:hidden"><h5 className="m-0 mb-3 text-sm font-extrabold text-sky-900">{procedimiento.id ? 'Editar tratamiento' : 'Nuevo tratamiento'}</h5><div className="grid gap-3 md:grid-cols-[1fr_180px]"><label className="text-xs font-bold text-slate-700">Categoría<select value={procedimiento.categoria} onChange={e => setProcedimiento({ ...procedimiento, categoria: e.target.value })} className={entrada}>{grupos.flat().map(item => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-bold text-slate-700">Fecha<input type="date" value={procedimiento.fecha} onChange={e => setProcedimiento({ ...procedimiento, fecha: e.target.value })} className={entrada} /></label></div><label className="mt-3 block text-xs font-bold text-slate-700">Descripción del procedimiento<textarea value={procedimiento.descripcion} onChange={e => setProcedimiento({ ...procedimiento, descripcion: e.target.value })} maxLength={5000} rows={3} className={entrada} placeholder="Procedimiento, dosis o evolución observada" /></label><button type="button" onClick={() => guardar('procedimiento')} disabled={guardando || !procedimiento.fecha || !procedimiento.descripcion.trim()} className={`${boton} mt-3`}>{guardando ? 'Guardando...' : procedimiento.id ? 'Guardar cambios' : 'Guardar ficha'}</button></div>
    </>}
  </section>;
}
