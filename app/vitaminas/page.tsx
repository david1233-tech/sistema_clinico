'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

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

const normalizarBusqueda = (valor: string) => valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

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
  const [busquedaVitamina, setBusquedaVitamina] = useState('');
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [viaOpcion, setViaOpcion] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [registroEditando, setRegistroEditando] = useState<Tratamiento | null>(null);
  
  const [formVitamina, setFormVitamina] = useState({
    vitaminaNombre: '',
    dosis: '',
    via: '',
    observaciones: ''
  });

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
  }, [dniParam, pacientes, pacienteSeleccionado]);

  const fetchPacientesTodos = async () => {
    try {
      setLoading(true);
      const resTriaje = await fetch('/api/triaje');
      let triajesData: any[] = [];
      if (resTriaje.ok) {
        triajesData = await resTriaje.json();
      }
      const resPacientes = await fetch('/api/pacientes');
      let basePacientesData: any[] = [];
      if (resPacientes.ok) {
        basePacientesData = await resPacientes.json();
      }
      const resVitaminas = await fetch('/api/vitaminas', { cache: 'no-store' });
      if (!resVitaminas.ok) throw new Error((await resVitaminas.json()).error || 'No se pudieron cargar los tratamientos');
      const tratamientosCargados: Tratamiento[] = await resVitaminas.json();
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
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPaciente = (p: Paciente) => {
    if (saving) return;
    if (p.dni_paciente === pacienteSeleccionado?.dni_paciente) return;
    if ((registroEditando || Object.values(formVitamina).some(Boolean)) &&
      !confirm('Los datos del formulario que aún no guardó se perderán. ¿Cambiar de paciente?')) return;
    setPacienteSeleccionado(p);
    setRegistroEditando(null);
    setFormVitamina({ vitaminaNombre: '', dosis: '', via: '', observaciones: '' });
    setViaOpcion('');
    setBusquedaVitamina('');
    setMostrarCatalogo(false);
    
    localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({
      dni: p.dni_paciente,
      nombre: p.nombre_paciente
    }));
    window.dispatchEvent(new Event('paciente_activo_changed'));
  };

  const handleLimpiarFormulario = () => {
    setFormVitamina({
      vitaminaNombre: '',
      dosis: '',
      via: '',
      observaciones: ''
    });
    setViaOpcion('');
    setBusquedaVitamina('');
    setMostrarCatalogo(false);
  };

  const handleEditarTratamiento = (tratamiento: Tratamiento) => {
    if (saving) return;
    setRegistroEditando(tratamiento);
    setFormVitamina({
      vitaminaNombre: tratamiento.vitaminaNombre,
      dosis: tratamiento.dosis || '',
      via: tratamiento.via || '',
      observaciones: tratamiento.observaciones || ''
    });
    setViaOpcion(['Endovenosa', 'Intramuscular'].includes(tratamiento.via) ? tratamiento.via : tratamiento.via ? 'Otra' : '');
    setBusquedaVitamina('');
    setMostrarCatalogo(false);
    document.getElementById('formulario-vitamina')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelarEdicion = () => {
    setRegistroEditando(null);
    handleLimpiarFormulario();
  };

  const handleGuardarVitamina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionado) return;
    try {
      setSaving(true);
      const response = await fetch('/api/vitaminas', {
        method: registroEditando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formVitamina,
          dni_paciente: pacienteSeleccionado.dni_paciente,
          nombre_paciente: pacienteSeleccionado.nombre_paciente,
          ...(registroEditando ? { id: registroEditando.id } : {})
        })
      });
      if (!response.ok) throw new Error((await response.json()).error || 'No se pudo guardar el tratamiento');
      const guardado: { id?: number; fechaAplicacion?: string } = await response.json();
      const datos = {
        vitaminaNombre: formVitamina.vitaminaNombre.trim(),
        dosis: formVitamina.dosis.trim(),
        via: formVitamina.via.trim(),
        observaciones: formVitamina.observaciones.trim()
      };
      let listaActualizada: Tratamiento[];
      if (registroEditando) {
        listaActualizada = tratamientos.map(t => t.id === registroEditando.id ? { ...t, ...datos } : t);
      } else {
        if (!guardado.id) throw new Error('El tratamiento se guardó, pero no se recibió su identificador. Recargue la página antes de volver a intentar.');
        listaActualizada = [{
          id: guardado.id,
          dni_paciente: pacienteSeleccionado.dni_paciente,
          ...datos,
          fechaAplicacion: guardado.fechaAplicacion || new Date().toISOString(),
          activo: true
        }, ...tratamientos];
      }
      setTratamientos(listaActualizada);
      setPacientes(prev => prev.map(p => p.dni_paciente === pacienteSeleccionado.dni_paciente ? actualizarResumenPaciente(p, listaActualizada) : p));
      setPacienteSeleccionado(prev => prev?.dni_paciente === pacienteSeleccionado.dni_paciente ? actualizarResumenPaciente(prev, listaActualizada) : prev);
      setRegistroEditando(null);
      handleLimpiarFormulario();
      alert(registroEditando ? '✅ Tratamiento actualizado.' : `✅ Tratamiento guardado para ${pacienteSeleccionado.nombre_paciente || pacienteSeleccionado.dni_paciente}`);
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
      setPacientes(prev => prev.map(p => p.dni_paciente === pacienteSeleccionado.dni_paciente ? actualizarResumenPaciente(p, listaActualizada) : p));
      setPacienteSeleccionado(prev => prev?.dni_paciente === pacienteSeleccionado.dni_paciente ? actualizarResumenPaciente(prev, listaActualizada) : prev);
      if (registroEditando?.id === tratamiento.id) handleCancelarEdicion();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el tratamiento');
    } finally {
      setSaving(false);
    }
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
        setFormVitamina({ vitaminaNombre: '', dosis: '', via: '', observaciones: '' });
        setViaOpcion('');
      } catch (err) {
        console.error('Error desmarcando vitamina:', err);
        alert(err instanceof Error ? err.message : 'No se pudo actualizar el tratamiento');
      }
    }
  };

  const pacientesFiltrados = pacientes.filter(p =>
    (p.nombre_paciente || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.dni_paciente || '').includes(busqueda)
  );

  const totalAplicados = pacientes.filter(p => p.aplicaVitamina).length;
  const totalPendientes = pacientes.length - totalAplicados;
  const tratamientosPaciente = tratamientos.filter(t => t.dni_paciente === pacienteSeleccionado?.dni_paciente);
  const opcionesVitamina = CATALOGO_VITAMINAS.filter(nombre => normalizarBusqueda(nombre).startsWith(normalizarBusqueda(busquedaVitamina)));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
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
              placeholder="Buscar paciente por DNI o Nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
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

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-sky-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-sky-700 via-teal-700 to-emerald-700 p-4 text-white">
                <h3 className="m-0 text-sm md:text-base font-extrabold text-white">👥 Lista de Pacientes</h3>
                <p className="m-0 text-xs text-sky-100">{pacientesFiltrados.length} encontrados · Seleccione una tarjeta para ver su historial</p>
              </div>
              <div className="p-4 flex gap-3 overflow-x-auto">
                {loading ? (
                  <p className="text-center py-5 text-slate-500 text-xs">Cargando lista unificada...</p>
                ) : pacientesFiltrados.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-xs">Sin resultados.</p>
                ) : (
                  pacientesFiltrados.map((p) => {
                    const isSelected = pacienteSeleccionado?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSeleccionarPaciente(p)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 min-w-[235px] w-[260px] shrink-0 ${
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
                      </div>
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

                  <form id="formulario-vitamina" onSubmit={handleGuardarVitamina} className="bg-white rounded-2xl border border-teal-200 p-5 md:p-6 shadow-sm flex flex-col gap-4 scroll-mt-24 min-w-0">
                    <div className="bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 p-4 rounded-xl text-white flex items-center gap-3">
                      <span className="text-2xl">🧪</span>
                      <div>
                        <h3 className="m-0 text-sm md:text-base font-extrabold text-white">{registroEditando ? 'Editar vitamina o suero guardado' : 'Especificación de Vitaminas e Inyectables'}</h3>
                        <p className="m-0 text-xs text-teal-100">{registroEditando ? 'Los cambios se aplicarán solo a este registro.' : 'Rellene manualmente los datos de la dosis aplicada al paciente'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                          NOMBRE / TIPO DE VITAMINA O SUERO *
                        </label>
                        <input
                          type="text"
                          required
                          value={formVitamina.vitaminaNombre}
                          onChange={(e) => setFormVitamina({ ...formVitamina, vitaminaNombre: e.target.value })}
                          placeholder="Ej: Vitamina C 10g / Neurobión / Complejo B"
                          className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600 focus:bg-white"
                        />
                      </div>
                      <div className="relative">
                        <label htmlFor="buscar-vitamina" className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                          BUSCAR VITAMINA O SUERO
                        </label>
                        <input
                          id="buscar-vitamina"
                          type="search"
                          autoComplete="off"
                          value={busquedaVitamina}
                          onChange={(e) => { setBusquedaVitamina(e.target.value); setMostrarCatalogo(true); }}
                          onFocus={() => setMostrarCatalogo(true)}
                          placeholder="Escriba las primeras letras..."
                          className="w-full p-3 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600"
                          role="combobox"
                          aria-autocomplete="list"
                          aria-controls="opciones-vitaminas"
                          aria-expanded={mostrarCatalogo}
                        />
                        {mostrarCatalogo && (
                          <div id="opciones-vitaminas" className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-300 bg-white shadow-lg">
                            {opcionesVitamina.length > 0 ? opcionesVitamina.map(nombre => (
                              <button
                                key={nombre}
                                type="button"
                                onClick={() => {
                                  setFormVitamina(prev => ({ ...prev, vitaminaNombre: nombre }));
                                  setBusquedaVitamina(nombre);
                                  setMostrarCatalogo(false);
                                }}
                                className="block w-full px-3 py-2 text-left text-xs md:text-sm font-semibold text-slate-800 hover:bg-teal-50 cursor-pointer"
                              >
                                {nombre}
                              </button>
                            )) : <p className="m-0 p-3 text-xs text-slate-500">No se encontraron opciones. Puede escribir el nombre manualmente.</p>}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                          DOSIS / CANTIDAD *
                        </label>
                        <input
                          type="text"
                          required
                          value={formVitamina.dosis}
                          onChange={(e) => setFormVitamina({ ...formVitamina, dosis: e.target.value })}
                          placeholder="Ej: 1 ampolla / 100 ml / 1 frasco"
                          className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600 focus:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="via-vitamina" className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                        VÍA DE ADMINISTRACIÓN
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select
                          id="via-vitamina"
                          value={viaOpcion}
                          onChange={(e) => {
                            const opcion = e.target.value;
                            setViaOpcion(opcion);
                            setFormVitamina(prev => ({ ...prev, via: opcion === 'Otra' ? '' : opcion }));
                          }}
                          required
                          className="w-full p-3 rounded-xl border border-teal-200 bg-white font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600"
                        >
                          <option value="">Seleccionar vía...</option>
                          <option value="Endovenosa">Endovenosa</option>
                          <option value="Intramuscular">Intramuscular</option>
                          <option value="Otra">Otra (escribir)</option>
                        </select>
                        {viaOpcion === 'Otra' && (
                          <input
                            type="text"
                            value={formVitamina.via}
                            onChange={(e) => setFormVitamina(prev => ({ ...prev, via: e.target.value }))}
                            placeholder="Escriba otra vía de administración"
                            required
                            className="w-full p-3 rounded-xl border border-teal-200 bg-white font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                        OBSERVACIONES / NOTAS DE APLICACIÓN
                      </label>
                      <textarea
                        rows={3}
                        value={formVitamina.observaciones}
                        onChange={(e) => setFormVitamina({ ...formVitamina, observaciones: e.target.value })}
                        placeholder="Detalles del procedimiento o tolerancia del paciente..."
                        className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600 focus:bg-white resize-y"
                      />
                    </div>
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
                  <div className="bg-white rounded-2xl border border-sky-200 p-5 md:p-6 shadow-sm min-w-0">
                    <h3 className="m-0 text-sm md:text-base font-extrabold text-teal-900">Historial de vitaminas y sueros ({tratamientosPaciente.length})</h3>
                    {tratamientosPaciente.length === 0 ? (
                      <p className="text-xs text-slate-500 mb-0">Este paciente aún no tiene tratamientos guardados.</p>
                    ) : (
                      <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto">
                        {tratamientosPaciente.map(t => (
                          <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs md:text-sm break-words">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <strong className="text-slate-900">{t.vitaminaNombre}</strong>
                              <span className="text-slate-500 font-semibold">Fecha y hora de aplicación: {t.fechaAplicacion ? new Date(t.fechaAplicacion).toLocaleString('es-PE') : 'Sin fecha'}</span>
                            </div>
                            <p className="m-0"><strong>Dosis / cantidad:</strong> {t.dosis || 'No registrada'}</p>
                            <p className="m-0 mt-1"><strong>Vía de administración:</strong> {t.via || 'No registrada'}</p>
                            <p className="m-0 mt-1 whitespace-pre-wrap"><strong>Observaciones:</strong> {t.observaciones || 'Sin observaciones'}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <button type="button" onClick={() => handleEditarTratamiento(t)} disabled={saving} className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50">✏️ Editar</button>
                              <button type="button" onClick={() => handleEliminarTratamiento(t)} disabled={saving} className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50">🗑️ Eliminar</button>
                            </div>
                          </div>
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
