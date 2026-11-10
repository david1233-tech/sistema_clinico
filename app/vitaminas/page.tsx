'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { agruparSesiones } from '@/lib/vitaminas-sesiones';
import { normalizarBusqueda } from '@/lib/busqueda-pacientes';
import VitaminasSeguimiento from '@/components/VitaminasSeguimiento';

interface Paciente {
  id: string | number;
  dni_paciente: string;
  nombre_paciente: string;
  edad?: string | number;
  aplicaVitamina?: boolean;
  vitaminaNombre?: string;
  dosis?: string;
  via?: string;
  observaciones?: string;
  fechaAplicacion?: string;
}

interface Tratamiento {
  id: number;
  dni_paciente: string;
  vitaminaNombre: string;
  dosis: string;
  via: string;
  observaciones: string;
  fechaAplicacion: string;
  activo: boolean;
}

interface AdjuntoVitamina { id: number; nombre: string; tipo: string; fecha: string; fecha_aplicacion?: string | null; origen: 'paciente' | 'tratamiento' | 'triaje_vitaminas' }
const TIPOS_ADJUNTOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

interface VitaminaAdicional {
  id: number;
  vitaminaNombre: string;
  dosis: string;
  via: string;
  viaOpcion: string;
  observaciones: string;
}

const nuevaVitamina = (id = 0): VitaminaAdicional => ({ id, vitaminaNombre: '', dosis: '', via: '', viaOpcion: '', observaciones: '' });

const CATALOGO_VITAMINAS = Array.from(new Set(`19 Plus
Ametil Z M
Amin Lsi
Amin Tri
Aminos Plus
Bicarbonato De Sodio
C Joven Plus - Mega Cóctel Antiedad
Calcio
Cartilago
Cerebro
Cholo 2
Cholo 2 - Lote 2
Cock Tail Of Myers
Cocktail Energy Plus
Cocktail Lipolysis
Coctel Alz
Colon
Comlejo B Solucion Inyectable
Corazon
Cusing L-Carnitina
Cutis Compuesto
Dbet 115
Denova - Glutathione
Dfes 106
Drenatox
Drenador Hepatico
Echinacea
Echinacea Lote 2
Estomago
Exohealer
G- Pancreadren
G-Dermodren
G-Digesdren
G-Intesdren
G-M18 Plus
G-Mucodren
G-Nervodren
G-Pancreadren
G-Uridren
Ganglio Linfatico
Gushing  Power B
Gushing Chelating-G
Gusing  Cynara Scolymus D3
Gusing G-Renox
Gusing Glutation
Gusing Methylene
Gusing Uva Ursi D3
Gusing Xanser
Herpes Zoster
Hierro Nim Hs
Higado
Hueso
Inm 103
Jutussin R8
Linea: Ala+ ( Alfa Lipolco)
Linfocitos T Y B
Lymphdiaral
Lymphdiaral Lote 2
Magnesio
Medula Espinal
Msm
Mucosa Gastrointestinal
Nad +
Nad+
Nervio Ciatico
Niquel
Nro 102
Ovario
Oxis
Pancreas
Pasconal Forte
Pasconal Forte - Lote 2
Piel
Prostata
Prostata
Pulmon
Reckeweg R18
Reckeweg R27
Reckeweg R37
Reckeweg R37
Reckeweg R55
Reckeweg R6
Reckeweg R73
Reckeweg Tr14
Reckeweg Tr5
Reckeweg Tr7
Retatrutide
Riñon
Selenio
Silimarina
Tiroides
Tónico De Alfalfa R95
Trutide
Utero
Venas
Virus Papiloma Humano
Vitamin C  50G
Vitamin C 50G
Vitamin C 7,5Gc
Vitamina B12
Vitamina C - 10G
Vitamina C - 15G
Vitamina C - 25G
Vitamina C Con Ala+ (Alfa Lipolco)
Vtb5
Vtb7
Zing`.split('\n')));

function ProductoAplicado({ item, numero, onChange, onRemove }: {
  item: VitaminaAdicional;
  numero: number;
  onChange: (item: VitaminaAdicional) => void;
  onRemove?: () => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const opciones = busqueda.trim()
    ? CATALOGO_VITAMINAS.filter(nombre => normalizarBusqueda(nombre).includes(normalizarBusqueda(busqueda))).slice(0, 12)
    : [];
  const campo = 'w-full rounded-xl border border-sky-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-sky-600';
  const seleccionar = (nombre: string) => { onChange({ ...item, vitaminaNombre: nombre }); setBusqueda(''); setMostrarOpciones(false); };

  return <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 md:p-5">
    <div className="mb-4 flex items-center justify-between gap-3"><h4 className="m-0 text-sm font-extrabold text-sky-900">Vitamina o suero {numero}</h4>{onRemove && <button type="button" onClick={onRemove} className="text-xs font-bold text-rose-700">Quitar este recuadro</button>}</div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="relative rounded-xl border border-sky-100 bg-white p-3" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setMostrarOpciones(false); }}>
        <label htmlFor={`catalogo-vitamina-${item.id}`} className="mb-1 block text-xs font-extrabold text-sky-900">Buscar en el catálogo</label>
        <input id={`catalogo-vitamina-${item.id}`} type="search" autoComplete="off" value={busqueda} onChange={event => { setBusqueda(event.target.value); setMostrarOpciones(true); }} onFocus={() => setMostrarOpciones(true)} onKeyDown={event => { if (event.key === 'Escape') setMostrarOpciones(false); }} placeholder="Escriba el nombre de la vitamina o suero" className={campo} role="combobox" aria-autocomplete="list" aria-controls={`catalogo-opciones-${item.id}`} aria-expanded={mostrarOpciones && Boolean(busqueda.trim())} />
        {mostrarOpciones && busqueda.trim() && <div id={`catalogo-opciones-${item.id}`} className="absolute left-3 right-3 z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-sky-200 bg-white shadow-lg">{opciones.length ? opciones.map(nombre => <button key={nombre} type="button" onClick={() => seleccionar(nombre)} className="block w-full border-b border-sky-50 px-3 py-2 text-left text-sm hover:bg-sky-50">{nombre}</button>) : <p className="m-0 p-3 text-xs text-slate-600">Sin coincidencias. Puede escribir el nombre manualmente.</p>}</div>}
        <p className="mb-0 text-xs text-slate-500">Seleccione un resultado para completar el recuadro de al lado.</p>
      </div>
      <div className="rounded-xl border border-sky-100 bg-white p-3"><label htmlFor={`nombre-vitamina-${item.id}`} className="mb-1 block text-xs font-extrabold text-sky-900">Vitamina o suero aplicado *</label><input id={`nombre-vitamina-${item.id}`} required maxLength={200} value={item.vitaminaNombre} onChange={event => onChange({ ...item, vitaminaNombre: event.target.value })} placeholder="Seleccione del catálogo o escriba aquí" className={campo} /></div>
      <label className="text-xs font-extrabold text-slate-800">Dosis o cantidad *<input required maxLength={100} value={item.dosis} onChange={event => onChange({ ...item, dosis: event.target.value })} placeholder="Ej.: 1 ampolla, 100 ml" className={`${campo} mt-1`} /></label>
      <div><label htmlFor={`via-vitamina-${item.id}`} className="mb-1 block text-xs font-extrabold text-slate-800">Tipo de aplicación *</label><select id={`via-vitamina-${item.id}`} required value={item.viaOpcion} onChange={event => { const viaOpcion = event.target.value; onChange({ ...item, viaOpcion, via: viaOpcion === 'Otra' ? '' : viaOpcion }); }} className={campo}><option value="">Seleccione una vía</option><option value="Intravenosa">Intravenosa</option><option value="Intramuscular">Intramuscular</option><option value="Subcutánea">Subcutánea</option><option value="Otra">Otra (escribir)</option></select>{item.viaOpcion === 'Otra' && <input required maxLength={100} value={item.via} onChange={event => onChange({ ...item, via: event.target.value })} placeholder="Escriba la vía de aplicación" aria-label="Otra vía de aplicación" className={`${campo} mt-2`} />}</div>
      <label className="text-xs font-extrabold text-slate-800 md:col-span-2">Observaciones de esta vitamina o suero<textarea rows={2} value={item.observaciones} onChange={event => onChange({ ...item, observaciones: event.target.value })} placeholder="Notas de aplicación (opcional)" className={`${campo} mt-1 resize-y`} /></label>
    </div>
  </div>;
}

function actualizarResumenPaciente(paciente: Paciente, tratamientos: Tratamiento[]) {
  const ultimo = tratamientos.find(t => t.dni_paciente === paciente.dni_paciente);
  return {
    ...paciente,
    aplicaVitamina: Boolean(ultimo?.activo),
    vitaminaNombre: ultimo?.vitaminaNombre || '',
    dosis: ultimo?.dosis || '',
    via: ultimo?.via || '',
    observaciones: ultimo?.observaciones || '',
    fechaAplicacion: ultimo?.fechaAplicacion || ''
  };
}

function VitaminasPageContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get('dni');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [letraNombre, setLetraNombre] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [fechaMostrada, setFechaMostrada] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorPacientes, setErrorPacientes] = useState('');
  const [saving, setSaving] = useState<boolean>(false);
  const [registroEditando, setRegistroEditando] = useState<Tratamiento | null>(null);
  const [vitaminasAdicionales, setVitaminasAdicionales] = useState<VitaminaAdicional[]>([]);
  const siguienteAdicionalId = useRef(0);
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [filtroAdjuntos, setFiltroAdjuntos] = useState<'todos' | 'imagenes' | 'pdf'>('todos');
  const [busquedaAdjuntos, setBusquedaAdjuntos] = useState('');
  const [adjuntos, setAdjuntos] = useState<AdjuntoVitamina[]>([]);
  const [subiendoAdjuntos, setSubiendoAdjuntos] = useState(false);
  const [cargandoAdjuntos, setCargandoAdjuntos] = useState(false);
  const [avanceAdjuntos, setAvanceAdjuntos] = useState('');
  
  const [formVitamina, setFormVitamina] = useState<VitaminaAdicional>(() => nuevaVitamina());
  const [formVersion, setFormVersion] = useState(0);

  useEffect(() => {
    fetchPacientesTodos();
  }, []);

  useEffect(() => {
    if (pacientes.length === 0 || pacienteSeleccionado) return;
    let dniTarget = dniParam;
    if (!dniTarget) {
      const guardado = localStorage.getItem('paciente_activo_vital_salud');
      if (guardado) {
        try {
          const parsed = JSON.parse(guardado);
          if (parsed && parsed.dni) {
            dniTarget = parsed.dni;
          }
        } catch (e) {
          console.error('Error leyendo paciente activo:', e);
        }
      }
    }
    setPacienteSeleccionado(pacientes.find(p => p.dni_paciente === dniTarget) || pacientes[0]);
    setFechaMostrada(new Date().toISOString());
  }, [dniParam, pacientes, pacienteSeleccionado]);

  useEffect(() => {
    if (!pacienteSeleccionado || saving) return;
    const reloj = window.setInterval(() => setFechaMostrada(new Date().toISOString()), 1000);
    return () => window.clearInterval(reloj);
  }, [pacienteSeleccionado?.dni_paciente, saving]);

  useEffect(() => {
    const dni = pacienteSeleccionado?.dni_paciente;
    if (!dni) return;
    let activo = true;
    queueMicrotask(() => {
      if (!activo) return;
      setAdjuntos([]);
      setCargandoAdjuntos(true);
      setAvanceAdjuntos('Cargando archivos del paciente...');
    });
    fetch(`/api/vitaminas/paciente-adjuntos?dni=${dni}`)
      .then(async response => {
        if (!response.ok) throw new Error('No se pudieron cargar los archivos');
        return response.json();
      })
      .then(items => { if (activo) { setAdjuntos(items); setAvanceAdjuntos(''); setCargandoAdjuntos(false); } })
      .catch(error => { if (activo) { setAvanceAdjuntos(error instanceof Error ? error.message : 'Error al cargar archivos'); setCargandoAdjuntos(false); } });
    return () => { activo = false; };
  }, [pacienteSeleccionado?.dni_paciente]);

  const fetchPacientesTodos = async () => {
    try {
      setLoading(true);
      setErrorPacientes('');
      const resTriaje = await fetch('/api/triaje');
      let triajesData: any[] = [];
      if (resTriaje.ok) {
        triajesData = await resTriaje.json();
      }
      const resPacientes = await fetch('/api/pacientes');
      let basePacientesData: any[] = [];
      if (resPacientes.ok) {
        basePacientesData = await resPacientes.json();
      } else {
        setErrorPacientes('No se pudo cargar el padrón de Recepción. Puede intentar recargar la página.');
      }
      let tratamientosCargados: Tratamiento[] = [];
      try {
        const resVitaminas = await fetch('/api/vitaminas', { cache: 'no-store' });
        if (!resVitaminas.ok) throw new Error((await resVitaminas.json()).error || 'No se pudieron cargar los tratamientos');
        tratamientosCargados = await resVitaminas.json();
      } catch (error) {
        console.error('Error cargando historial de vitaminas:', error);
        setErrorPacientes('Los pacientes están disponibles, pero no se pudo cargar el historial de tratamientos. Recargue antes de guardar cambios.');
      }
      setTratamientos(tratamientosCargados);
      const mapaPacientes = new Map<string, Paciente>();
      basePacientesData.forEach((p) => {
        const dni = p.dni || p.dni_paciente;
        if (dni) {
          mapaPacientes.set(dni, {
            id: p.id || Date.now(),
            dni_paciente: dni,
            nombre_paciente: p.nombre || p.nombre_paciente || 'Paciente sin nombre',
            edad: p.edad || '',
            aplicaVitamina: p.aplicaVitamina || false,
            vitaminaNombre: p.vitaminaNombre || '',
            dosis: p.dosis || '',
            via: p.via || '',
            observaciones: p.observaciones || ''
          });
        }
      });
      // Con varios registros por paciente, prevalecen los datos del más reciente.
      triajesData.slice().reverse().forEach((t) => {
        const dni = t.dni_paciente || t.dni;
        if (dni) {
          const prev = mapaPacientes.get(dni);
          mapaPacientes.set(dni, {
            ...prev,
            ...t,
            dni_paciente: dni,
            nombre_paciente: t.nombre_paciente || prev?.nombre_paciente || 'Paciente sin nombre'
          });
        }
      });
      const ultimoPorDni = new Map<string, any>();
      tratamientosCargados.forEach(t => {
        if (t.dni_paciente && !ultimoPorDni.has(t.dni_paciente)) ultimoPorDni.set(t.dni_paciente, t);
      });
      ultimoPorDni.forEach((t, dni) => {
        const paciente = mapaPacientes.get(dni);
        if (paciente) mapaPacientes.set(dni, {
          ...paciente,
          aplicaVitamina: Boolean(t.activo),
          vitaminaNombre: t.vitaminaNombre || '',
          dosis: t.dosis || '',
          via: t.via || '',
          observaciones: t.observaciones || '',
          fechaAplicacion: t.fechaAplicacion || ''
        });
      });
      const listaCompleta = Array.from(mapaPacientes.values());
      setPacientes(listaCompleta);
    } catch (err) {
      console.error('Error cargando lista unificada de vitaminas:', err);
      setErrorPacientes('No se pudo cargar la lista de pacientes. Intente recargar la página.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPaciente = (p: Paciente) => {
    if (saving || subiendoAdjuntos) return;
    if (p.dni_paciente === pacienteSeleccionado?.dni_paciente) return;
    if ((registroEditando || Object.values(formVitamina).some(Boolean) || vitaminasAdicionales.length > 0) &&
      !confirm('Los datos del formulario que aún no guardó se perderán. ¿Cambiar de paciente?')) return;
    setPacienteSeleccionado(p);
    setFechaMostrada(new Date().toISOString());
    setGaleriaAbierta(false);
    setFichaAbierta(false);
    setRegistroEditando(null);
    setVitaminasAdicionales([]);
    setFormVitamina(nuevaVitamina());
    setFormVersion(prev => prev + 1);
    
    localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({
      dni: p.dni_paciente,
      nombre: p.nombre_paciente
    }));
    window.dispatchEvent(new Event('paciente_activo_changed'));
  };

  const handleLimpiarFormulario = () => {
    setFormVitamina(nuevaVitamina());
    setVitaminasAdicionales([]);
    setFormVersion(prev => prev + 1);
  };

  const handleAgregarVitamina = () => {
    if (registroEditando || vitaminasAdicionales.length >= 49) return;
    siguienteAdicionalId.current += 1;
    setVitaminasAdicionales(prev => [...prev, nuevaVitamina(siguienteAdicionalId.current)]);
  };

  const handleEditarTratamiento = (tratamiento: Tratamiento) => {
    if (saving) return;
    if (vitaminasAdicionales.length > 0 && !confirm('Las vitaminas adicionales sin guardar se perderán. ¿Editar este registro?')) return;
    setRegistroEditando(tratamiento);
    setVitaminasAdicionales([]);
    setFormVersion(prev => prev + 1);
    setFormVitamina({
      id: 0,
      vitaminaNombre: tratamiento.vitaminaNombre,
      dosis: tratamiento.dosis || '',
      via: tratamiento.via || '',
      viaOpcion: ['Endovenosa', 'Intravenosa', 'Intramuscular', 'Subcutánea'].includes(tratamiento.via) ? tratamiento.via : tratamiento.via ? 'Otra' : '',
      observaciones: tratamiento.observaciones || ''
    });
    document.getElementById('formulario-vitamina')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelarEdicion = () => {
    setRegistroEditando(null);
    handleLimpiarFormulario();
  };

  const handleGuardarVitamina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionado) return;
    const aplicaciones = [formVitamina, ...vitaminasAdicionales]
      .map(item => ({
        vitaminaNombre: item.vitaminaNombre.trim(),
        dosis: item.dosis.trim(),
        via: item.via.trim(),
        observaciones: item.observaciones.trim()
      }));
    if (aplicaciones.some(item => !item.vitaminaNombre || !item.dosis || !item.via)) {
      alert('Complete el nombre, la dosis y la vía de cada vitamina o suero.');
      return;
    }
    const fechaCapturada = fechaMostrada || new Date().toISOString();
    try {
      setSaving(true);
      const response = await fetch('/api/vitaminas', {
        method: registroEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...aplicaciones[0],
          dni_paciente: pacienteSeleccionado.dni_paciente,
          nombre_paciente: pacienteSeleccionado.nombre_paciente,
          ...(!registroEditando ? { fechaAplicacion: fechaCapturada } : {}),
          ...(registroEditando ? { id: registroEditando.id } : { tratamientos: aplicaciones })
        })
      });
      if (!response.ok) throw new Error((await response.json()).error || 'No se pudo guardar el tratamiento');
      const guardado: { data?: Tratamiento[] } = await response.json();
      let listaActualizada: Tratamiento[];
      if (registroEditando) {
        listaActualizada = tratamientos.map(t => t.id === registroEditando.id ? { ...t, ...aplicaciones[0] } : t);
      } else {
        if (!Array.isArray(guardado.data) || guardado.data.length !== aplicaciones.length) {
          throw new Error('Las vitaminas se guardaron, pero no se recibió la confirmación completa. Recargue la página antes de volver a intentar.');
        }
        listaActualizada = [...guardado.data.slice().reverse(), ...tratamientos];
      }
      setTratamientos(listaActualizada);
      setPacientes(prev => prev.map(p => p.dni_paciente === pacienteSeleccionado.dni_paciente ? actualizarResumenPaciente(p, listaActualizada) : p));
      setPacienteSeleccionado(prev => prev?.dni_paciente === pacienteSeleccionado.dni_paciente ? actualizarResumenPaciente(prev, listaActualizada) : prev);
      setRegistroEditando(null);
      handleLimpiarFormulario();
      setFechaMostrada(new Date().toISOString());
      alert(registroEditando ? '✅ Tratamiento actualizado.' : `✅ ${aplicaciones.length} ${aplicaciones.length === 1 ? 'tratamiento guardado' : 'tratamientos guardados'} para ${pacienteSeleccionado.nombre_paciente || pacienteSeleccionado.dni_paciente}`);
    } catch (err) {
      console.error('Error guardando vitamina:', err);
      alert(err instanceof Error ? err.message : 'No se pudo guardar el tratamiento');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarTratamiento = async (tratamiento: Tratamiento) => {
    if (saving || !pacienteSeleccionado) return;
    if (!confirm(`¿Eliminar el registro de ${tratamiento.vitaminaNombre}? Esta acción no se puede deshacer.`)) return;
    try {
      setSaving(true);
      const response = await fetch(`/api/vitaminas?id=${tratamiento.id}&dni=${encodeURIComponent(pacienteSeleccionado.dni_paciente)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error || 'No se pudo eliminar el tratamiento');
      const listaActualizada = tratamientos.filter(t => t.id !== tratamiento.id);
      setTratamientos(listaActualizada);
      const archivosResponse = await fetch(`/api/vitaminas/paciente-adjuntos?dni=${pacienteSeleccionado.dni_paciente}`).catch(() => null);
      if (archivosResponse?.ok) setAdjuntos(await archivosResponse.json());
      setPacientes(prev => prev.map(p => p.dni_paciente === pacienteSeleccionado.dni_paciente ? actualizarResumenPaciente(p, listaActualizada) : p));
      setPacienteSeleccionado(prev => prev?.dni_paciente === pacienteSeleccionado.dni_paciente ? actualizarResumenPaciente(prev, listaActualizada) : prev);
      if (registroEditando?.id === tratamiento.id) handleCancelarEdicion();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el tratamiento');
    } finally {
      setSaving(false);
    }
  };

  const subirAdjuntos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(event.target.files || []);
    event.target.value = '';
    const dni = pacienteSeleccionado?.dni_paciente;
    if (!dni || !archivos.length || cargandoAdjuntos) return;
    if (adjuntos.length + archivos.length > 200) return alert('Máximo 200 imágenes o PDF por paciente.');
    if (archivos.some(file => !TIPOS_ADJUNTOS.includes(file.type) || !file.size || file.size > 3 * 1024 * 1024)) return alert('Solo imágenes JPG, PNG, WebP, GIF o PDF de hasta 3 MB por archivo.');
    setSubiendoAdjuntos(true);
    try {
      for (let i = 0; i < archivos.length; i++) {
        setAvanceAdjuntos(`Subiendo ${i + 1} de ${archivos.length}...`);
        const form = new FormData();
        form.append('dni_paciente', dni);
        form.append('archivo', archivos[i]);
        const response = await fetch('/api/vitaminas/paciente-adjuntos', { method: 'POST', body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || `No se pudo subir ${archivos[i].name}`);
        setAdjuntos(prev => [...prev, result]);
      }
      setAvanceAdjuntos(`${archivos.length} archivo(s) guardado(s).`);
    } catch (error) { setAvanceAdjuntos(error instanceof Error ? error.message : 'No se pudo subir el archivo'); }
    finally { setSubiendoAdjuntos(false); }
  };

  const eliminarAdjunto = async (item: AdjuntoVitamina) => {
    if (!confirm('¿Eliminar este archivo?')) return;
    const ruta = item.origen === 'paciente' ? '/api/vitaminas/paciente-adjuntos' : item.origen === 'triaje_vitaminas' ? '/api/triaje/vitaminas-imagenes' : '/api/vitaminas/adjuntos';
    const response = await fetch(`${ruta}?id=${item.id}`, { method: 'DELETE' });
    if (response.ok) setAdjuntos(prev => prev.filter(archivo => archivo.id !== item.id || archivo.origen !== item.origen));
    else alert('No se pudo eliminar el archivo.');
  };

  const handleDesmarcarVitamina = async () => {
    if (!pacienteSeleccionado) return;
    if (confirm('¿Deseas desmarcar la aplicación de vitamina para este paciente?')) {
      try {
        const pacienteSinVitamina: Paciente = {
          ...pacienteSeleccionado,
          aplicaVitamina: false,
          vitaminaNombre: '',
          dosis: '',
          via: '',
          observaciones: ''
        };

        const response = await fetch(`/api/vitaminas?dni=${encodeURIComponent(pacienteSinVitamina.dni_paciente)}`, { method: 'PATCH' });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo actualizar el tratamiento');

        setPacientes(prev =>
          prev.map(p => (p.id === pacienteSeleccionado.id ? pacienteSinVitamina : p))
        );
        setTratamientos(prev => prev.map(t => t.dni_paciente === pacienteSinVitamina.dni_paciente ? { ...t, activo: false } : t));
        setPacienteSeleccionado(pacienteSinVitamina);
        setRegistroEditando(null);
        setFormVitamina(nuevaVitamina());
      } catch (err) {
        console.error('Error desmarcando vitamina:', err);
        alert(err instanceof Error ? err.message : 'No se pudo actualizar el tratamiento');
      }
    }
  };

  const terminoPaciente = normalizarBusqueda(busqueda);
  const pacientesFiltrados = pacientes.filter(p => {
    const nombre = normalizarBusqueda(p.nombre_paciente || '');
    const primerNombre = nombre.split(/\s+/)[0] || '';
    const coincideTexto = !terminoPaciente || nombre.includes(terminoPaciente) || String(p.dni_paciente || '').includes(terminoPaciente);
    return coincideTexto && (!letraNombre || primerNombre.startsWith(normalizarBusqueda(letraNombre)));
  }).sort((a, b) => (a.nombre_paciente || '').localeCompare(b.nombre_paciente || '', 'es-PE', { sensitivity: 'base' }));

  const totalAplicados = pacientes.filter(p => p.aplicaVitamina).length;
  const totalPendientes = pacientes.length - totalAplicados;
  const tratamientosPaciente = tratamientos.filter(t => t.dni_paciente === pacienteSeleccionado?.dni_paciente);
  const sesionesPaciente = agruparSesiones(tratamientosPaciente);
  const adjuntosPacienteCount = adjuntos.filter(item => item.origen === 'paciente').length;
  const adjuntosVisibles = adjuntos.filter(item => (filtroAdjuntos === 'todos' || (filtroAdjuntos === 'pdf' ? item.tipo === 'application/pdf' : item.tipo !== 'application/pdf')) && normalizarBusqueda(item.nombre).includes(normalizarBusqueda(busquedaAdjuntos)));

  return (
    <div className="module-shell flex min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 font-sans text-slate-900">
      <Sidebar />
      <div className="module-content flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        <header className="h-16 md:h-20 bg-white/90 border-b border-teal-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm backdrop-blur">
          <span className="text-xs md:text-sm text-slate-500 font-medium truncate">
            Módulo Médico / <strong className="text-slate-900">Tratamientos y Vitaminas</strong>
          </span>
          <span className="text-xs text-teal-700 font-extrabold bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 shrink-0">
            🧪 Control de Sueros e Inyectables
          </span>
        </header>

        <main className="p-4 md:p-8 flex flex-col gap-6 max-w-[1500px] mx-auto w-full">
          <div>
            <h1 className="m-0 text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
              💉 Registro de Vitaminas y Sueros
            </h1>
            <p className="m-0 text-xs md:text-sm text-slate-500 mt-1">
              Seleccione al paciente ingresado, verifique si aplica tratamiento y especifique las dosis administradas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-sky-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl shrink-0">👥</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Total Ingresados</span>
                <h3 className="m-0 text-xl font-black text-slate-900">{pacientes.length}</h3>
              </div>
            </div>
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">🧪</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Tratamientos Aplicados</span>
                <h3 className="m-0 text-xl font-black text-emerald-700">{totalAplicados}</h3>
              </div>
            </div>
            <div className="bg-white border border-amber-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">⏳</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Pendientes Relleno</span>
                <h3 className="m-0 text-xl font-black text-amber-700">{totalPendientes}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-sky-200 flex items-center gap-3 shadow-sm">
            <span className="text-lg">🔍</span>
            <input
              type="text"
              placeholder="Escriba nombre, apellido o DNI..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setLetraNombre(''); }}
              className="flex-1 border-none outline-none font-bold text-slate-900 text-xs md:text-sm bg-transparent"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')} 
                className="bg-transparent border-none cursor-pointer text-slate-500 font-bold text-xs"
              >
                ✕ Limpiar
              </button>
            )}
          </div>

          {errorPacientes && <p role="alert" className="m-0 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">{errorPacientes}</p>}

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-sky-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-sky-700 via-teal-700 to-emerald-700 p-4 text-white">
                <h3 className="m-0 text-sm md:text-base font-extrabold text-white">👥 Lista de Pacientes</h3>
                <p className="m-0 text-xs text-sky-100">{pacientesFiltrados.length} encontrados · Busque por nombre o DNI, o filtre por la inicial del primer nombre</p>
              </div>
              <div className="flex flex-wrap gap-1.5 p-4 pb-0" aria-label="Filtrar por inicial del primer nombre">
                <button type="button" onClick={() => setLetraNombre('')} aria-pressed={!letraNombre} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${!letraNombre ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-teal-50'}`}>Todos</button>
                {'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').map(letra => <button key={letra} type="button" onClick={() => setLetraNombre(letraNombre === letra ? '' : letra)} aria-pressed={letraNombre === letra} className={`w-8 h-8 rounded-lg text-xs font-bold ${letraNombre === letra ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-teal-50'}`}>{letra}</button>)}
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[440px] overflow-y-auto">
                {loading ? (
                  <p className="text-center py-5 text-slate-500 text-xs">Cargando lista unificada...</p>
                ) : pacientesFiltrados.length === 0 ? (
                  <p className="text-center py-8 text-slate-500 text-xs col-span-full">No se encontró un paciente con ese nombre o DNI. Pruebe con otra letra o pulse «Todos».</p>
                ) : (
                  pacientesFiltrados.map((p) => {
                    const isSelected = pacienteSeleccionado?.id === p.id;
                    return (
                      <button
                        key={p.dni_paciente}
                        type="button"
                        onClick={() => handleSeleccionarPaciente(p)}
                        aria-pressed={isSelected}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 w-full text-left ${
                          isSelected 
                            ? 'border-teal-500 bg-teal-50 shadow-md ring-2 ring-teal-100' 
                            : 'border-sky-100 bg-sky-50/40 hover:border-teal-300 hover:bg-teal-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="m-0 text-xs md:text-sm font-black text-slate-900 truncate">
                              {p.nombre_paciente || 'Paciente'}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-bold block mt-0.5">
                              DNI: {p.dni_paciente}
                            </span>
                          </div>
                        </div>

                        {p.aplicaVitamina ? (
                          <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-900 font-black truncate">
                              <span>🧪</span>
                              <span className="truncate">{p.vitaminaNombre || 'Vitamina asignada'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-emerald-800 font-bold">
                              {p.dosis && (
                                <span className="bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300/60">
                                  💊 {p.dosis}
                                </span>
                              )}
                              {p.via && (
                                <span className="bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-300/60">
                                  🛣️ {p.via}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                            ⏳ Pendiente de asignación
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 w-full min-w-0">
              {pacienteSeleccionado ? (
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-6 items-start animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-teal-200 p-5 md:p-6 shadow-sm xl:col-span-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[11px] font-extrabold text-teal-600 uppercase tracking-wider">
                          EXPEDIENTE DE TRATAMIENTOS
                        </span>
                        <h2 className="m-0 text-xl md:text-2xl font-black text-slate-900 mt-0.5">
                          {pacienteSeleccionado.nombre_paciente || 'Paciente sin nombre'}
                        </h2>
                        <span className="text-xs text-slate-500 font-bold">
                          DNI: {pacienteSeleccionado.dni_paciente} {pacienteSeleccionado.edad ? `• ${pacienteSeleccionado.edad} años` : ''}
                        </span>
                        <p className="m-0 mt-2 inline-flex rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-900" aria-live="off">
                          Hora de aplicación: {fechaMostrada ? new Date(fechaMostrada).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' }) : 'Cargando hora...'}
                        </p>
                      </div>
                      {pacienteSeleccionado.aplicaVitamina && (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm">
                            <span>✅</span>
                            <span>{pacienteSeleccionado.vitaminaNombre}</span>
                            {pacienteSeleccionado.dosis && (
                              <span className="bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded text-[10px]">
                                {pacienteSeleccionado.dosis}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleDesmarcarVitamina}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all"
                          >
                            ✕ Desmarcar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <form id="formulario-vitamina" onSubmit={handleGuardarVitamina} className="xl:col-span-2 bg-white rounded-2xl border border-teal-200 p-5 md:p-6 shadow-sm flex flex-col gap-4 scroll-mt-24 min-w-0">
                    <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 p-4 rounded-xl text-white flex items-center gap-3">
                      <span className="text-2xl">🧪</span>
                      <div>
                        <h3 className="m-0 text-sm md:text-base font-extrabold text-white">{registroEditando ? 'Editar vitamina o suero guardado' : 'Vitaminas y sueros aplicados'}</h3>
                        <p className="m-0 text-xs text-teal-100">{registroEditando ? 'Los cambios se aplicarán solo a este registro.' : 'Elija o escriba el producto; después complete los datos de aplicación.'}</p>
                      </div>
                    </div>
                    <p className="m-0 text-xs text-slate-600">Busque en el catálogo a la izquierda o escriba el nombre a la derecha. Cada producto conserva su propia dosis, vía y observaciones.</p>
                    <ProductoAplicado key={formVersion} item={formVitamina} numero={1} onChange={setFormVitamina} />
                    {vitaminasAdicionales.map((item, indice) => <ProductoAplicado key={item.id} item={item} numero={indice + 2} onChange={actualizado => setVitaminasAdicionales(prev => prev.map(v => v.id === actualizado.id ? actualizado : v))} onRemove={() => setVitaminasAdicionales(prev => prev.filter(v => v.id !== item.id))} />)}
                    {!registroEditando && <button type="button" onClick={handleAgregarVitamina} disabled={saving || vitaminasAdicionales.length >= 49} className="w-full rounded-2xl border-2 border-dashed border-sky-400 bg-sky-50 px-5 py-5 text-center text-sm font-black text-sky-900 shadow-sm hover:bg-sky-100 disabled:opacity-50">＋ Agregar nueva vitamina o suero</button>}
                    <p className="m-0 text-xs font-semibold text-slate-600">{registroEditando ? 'La edición conserva la fecha y hora originales del registro.' : 'Al guardar, todos los productos se registrarán con la fecha y hora mostradas junto al paciente.'}</p>
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleLimpiarFormulario}
                        disabled={saving}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-extrabold text-xs md:text-sm cursor-pointer transition-all"
                      >
                        🧹 Limpiar Formulario
                      </button>
                      {registroEditando && (
                        <button type="button" onClick={handleCancelarEdicion} disabled={saving} className="px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-extrabold text-xs md:text-sm cursor-pointer">
                          Cancelar edición
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl font-extrabold text-xs md:text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <span>💉</span> {saving ? 'Guardando...' : registroEditando ? 'Guardar cambios' : 'Guardar y Confirmar Aplicación'}
                      </button>
                    </div>
                  </form>

                  <div className="xl:col-span-2 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm print:hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><span className="text-xs font-bold uppercase text-sky-700">Seguimiento clínico</span><h3 className="m-0 text-base font-black text-slate-900">Controles diarios y procedimientos</h3></div><button type="button" onClick={() => setFichaAbierta(prev => !prev)} className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-bold text-white">{fichaAbierta ? 'Cerrar ficha' : 'Abrir ficha de seguimiento'}</button></div>
                  </div>
                  {fichaAbierta && <VitaminasSeguimiento key={pacienteSeleccionado.dni_paciente} dni={pacienteSeleccionado.dni_paciente} nombre={pacienteSeleccionado.nombre_paciente} />}

                  <section className="module-patient-files xl:col-span-2 rounded-2xl border border-teal-200 bg-white p-5 md:p-6 shadow-sm" aria-label="Archivos del paciente">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-teal-700">Documentación del paciente</span>
                        <h3 className="m-0 mt-1 text-base font-black text-slate-900">Fotos y PDF · {adjuntos.length}/200 guardados</h3>
                        <p className="m-0 mt-1 text-xs text-slate-500">Puede agregar archivos del paciente y consultar los adjuntos anteriores.</p>
                      </div>
                      <button type="button" onClick={() => setGaleriaAbierta(true)} className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-extrabold text-teal-900 hover:bg-teal-100">Ver archivos</button>
                    </div>
                    <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/60 p-4 text-sm font-extrabold text-teal-900 transition-colors hover:bg-teal-100">
                      ＋ Agregar imágenes o PDF
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={subirAdjuntos} disabled={subiendoAdjuntos || cargandoAdjuntos} className="sr-only" />
                    </label>
                    <p className="m-0 mt-2 text-xs text-slate-500">{adjuntosPacienteCount} archivos agregados aquí · Hasta 200 por paciente · 3 MB por archivo.</p>
                    {avanceAdjuntos && <p role="status" className="m-0 mt-2 text-xs font-bold text-teal-800">{avanceAdjuntos}</p>}
                  </section>


                  <div className="xl:col-span-2 bg-white rounded-2xl border border-sky-200 p-5 md:p-6 shadow-sm min-w-0">
                    <h3 className="m-0 text-sm md:text-base font-extrabold text-teal-900">Historial de aplicaciones ({sesionesPaciente.length})</h3>
                    {tratamientosPaciente.length === 0 ? (
                      <p className="text-xs text-slate-500 mb-0">Este paciente aún no tiene tratamientos guardados.</p>
                    ) : (
                      <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto">
                        {sesionesPaciente.map(([clave, registros], indice) => (
                          <article key={clave} className="rounded-2xl border border-teal-100 bg-slate-50/70 p-4 text-xs md:text-sm break-words shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-3">
                              <div><span className="block text-[10px] uppercase tracking-wider font-extrabold text-teal-700">Aplicación {sesionesPaciente.length - indice}</span><strong className="text-slate-900">{registros.length} {registros.length === 1 ? 'vitamina o suero' : 'vitaminas o sueros'}</strong></div>
                              <time className="text-slate-600 font-semibold">{registros[0].fechaAplicacion ? new Date(registros[0].fechaAplicacion).toLocaleString('es-PE') : 'Sin fecha'}</time>
                            </div>
                            <div className="space-y-3">
                              {registros.map(t => <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-3">
                                <strong className="block text-teal-900">{t.vitaminaNombre}</strong>
                                <p className="m-0 mt-1"><strong>Dosis:</strong> {t.dosis || 'No registrada'} · <strong>Vía:</strong> {t.via || 'No registrada'}</p>
                                {t.observaciones && <p className="m-0 mt-1 whitespace-pre-wrap"><strong>Observaciones:</strong> {t.observaciones}</p>}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <button type="button" onClick={() => handleEditarTratamiento(t)} disabled={saving} className="text-xs font-bold text-amber-900 hover:underline">Editar</button>
                                  <button type="button" onClick={() => handleEliminarTratamiento(t)} disabled={saving} className="text-xs font-bold text-rose-700 hover:underline">Eliminar</button>
                                </div>
                              </div>)}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <span className="text-4xl block mb-2">🧪</span>
                  <h3 className="text-slate-900 font-extrabold text-base md:text-lg mb-1">Selecciona un paciente</h3>
                  <p className="text-slate-500 text-xs md:text-sm m-0">Elige a un usuario de la lista izquierda para administrar sus vitaminas.</p>
                </div>
              )}
              {galeriaAbierta && pacienteSeleccionado && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Archivos del paciente" onClick={() => !subiendoAdjuntos && setGaleriaAbierta(false)}>
                  <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="m-0 text-lg font-extrabold text-teal-900">Fotos y archivos</h3><p className="text-xs text-slate-600">{pacienteSeleccionado.nombre_paciente} · {adjuntos.length} archivos</p></div>
                      <button type="button" onClick={() => setGaleriaAbierta(false)} disabled={subiendoAdjuntos} aria-label="Cerrar archivos" className="text-slate-600 font-bold disabled:opacity-50">✕</button>
                    </div>
                    <label className="block mt-3 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 p-4 text-center text-sm font-bold text-teal-900 cursor-pointer">＋ Agregar imágenes o PDF
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" onChange={subirAdjuntos} disabled={subiendoAdjuntos || cargandoAdjuntos} className="sr-only" />
                    </label>
                    <p className="text-xs text-slate-500">Hasta 3 MB por archivo. Los adjuntos de tratamientos anteriores permanecen aquí.</p>
                    {avanceAdjuntos && <p role="status" className="text-xs font-bold text-teal-800">{avanceAdjuntos}</p>}
                    <div className="mt-4 flex flex-wrap gap-2"><input type="search" value={busquedaAdjuntos} onChange={e => setBusquedaAdjuntos(e.target.value)} placeholder="Buscar archivo por nombre" aria-label="Buscar archivo" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />{(['todos', 'imagenes', 'pdf'] as const).map(filtro => <button key={filtro} type="button" onClick={() => setFiltroAdjuntos(filtro)} aria-pressed={filtroAdjuntos === filtro} className={`rounded-lg px-3 py-2 text-xs font-bold ${filtroAdjuntos === filtro ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-800'}`}>{filtro === 'imagenes' ? 'Imágenes' : filtro === 'pdf' ? 'PDF' : 'Todos'}</button>)}</div>
                    <div className="mt-4 max-h-[45vh] overflow-y-auto grid gap-2 sm:grid-cols-2">
                      {adjuntosVisibles.map(item => <div key={`${item.origen}-${item.id}`} className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-xs min-w-0">
                        <span aria-hidden="true">{item.tipo === 'application/pdf' ? '📄' : '🖼️'}</span>
                        <span className="min-w-0 flex-1 truncate" title={item.nombre}>{item.nombre}{item.origen === 'tratamiento' && <small className="block text-slate-500">Tratamiento anterior</small>}{item.origen === 'triaje_vitaminas' && <small className="block text-violet-700">Vitaminas desde Enfermería · Aplicación: {item.fecha_aplicacion ? new Date(item.fecha_aplicacion).toLocaleString('es-PE') : 'Sin fecha'} · Subida: {new Date(item.fecha).toLocaleString('es-PE')}</small>}</span>
                        <a href={`${item.origen === 'paciente' ? '/api/vitaminas/paciente-adjuntos' : item.origen === 'triaje_vitaminas' ? '/api/triaje/vitaminas-imagenes' : '/api/vitaminas/adjuntos'}/${item.id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-teal-800">Abrir</a>
                        <button type="button" onClick={() => eliminarAdjunto(item)} disabled={subiendoAdjuntos} className="font-bold text-rose-700">Eliminar</button>
                      </div>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
export default function VitaminasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Cargando...</div>}>
      <VitaminasPageContent />
    </Suspense>
  );
}
