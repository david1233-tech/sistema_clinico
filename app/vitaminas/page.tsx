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

function VitaminasPageContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get('dni');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState<string>('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
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
    if (pacientes.length === 0) return;
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
    if (dniTarget) {
      const encontrado = pacientes.find(p => p.dni_paciente === dniTarget);
      if (encontrado) {
        setPacienteSeleccionado(encontrado);
        setFormVitamina({
          vitaminaNombre: encontrado.vitaminaNombre || '',
          dosis: encontrado.dosis || '',
          via: encontrado.via || '',
          observaciones: encontrado.observaciones || ''
        });
        return;
      }
    }
    
    if (!pacienteSeleccionado && pacientes.length > 0) {
      setPacienteSeleccionado(pacientes[0]);
      setFormVitamina({
        vitaminaNombre: pacientes[0].vitaminaNombre || '',
        dosis: pacientes[0].dosis || '',
        via: pacientes[0].via || '',
        observaciones: pacientes[0].observaciones || ''
      });
    }
  }, [dniParam, pacientes]);

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
      const tratamientos: any[] = await resVitaminas.json();
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
      triajesData.forEach((t) => {
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
      tratamientos.forEach(t => {
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
    setPacienteSeleccionado(p);
    setFormVitamina({
      vitaminaNombre: p.vitaminaNombre || '',
      dosis: p.dosis || '',
      via: p.via || '',
      observaciones: p.observaciones || ''
    });
    
    localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({
      dni: p.dni_paciente,
      nombre: p.nombre_paciente
    }));
    window.dispatchEvent(new Event('paciente_activo_changed'));
  };

  const handleEliminarPaciente = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('⚠️ ¿Estás seguro de eliminar este registro de la base de datos?')) {
      try {
        await fetch(`/api/triaje?id=${id}`, { method: 'DELETE' });
        
        const listaFiltrada = pacientes.filter(p => p.id !== id);
        setPacientes(listaFiltrada);
        if (pacienteSeleccionado?.id === id) {
          setPacienteSeleccionado(listaFiltrada.length > 0 ? listaFiltrada[0] : null);
        }
      } catch (err) {
        console.error('Error al eliminar el registro:', err);
        setPacientes(prev => prev.filter(p => p.id !== id));
      }
    }
  };

  const handleLimpiarFormulario = () => {
    setFormVitamina({
      vitaminaNombre: '',
      dosis: '',
      via: '',
      observaciones: ''
    });
  };

  const handleGuardarVitamina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteSeleccionado) return;
    try {
      setSaving(true);
      const fechaActual = new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
      
      const pacienteActualizado: Paciente = {
        ...pacienteSeleccionado,
        aplicaVitamina: true,
        ...formVitamina,
        fechaAplicacion: fechaActual
      };

      const response = await fetch('/api/vitaminas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pacienteActualizado)
      });
      if (!response.ok) throw new Error((await response.json()).error || 'No se pudo guardar el tratamiento');

      setPacientes(prev =>
        prev.map(p => (p.id === pacienteSeleccionado.id ? pacienteActualizado : p))
      );
      setPacienteSeleccionado(pacienteActualizado);
      
      // Limpiamos los campos del formulario tras guardar con éxito
      handleLimpiarFormulario();

      alert(`✅ Tratamiento guardado con éxito para ${pacienteSeleccionado.nombre_paciente || pacienteSeleccionado.dni_paciente}`);
    } catch (err) {
      console.error('Error guardando vitamina:', err);
      alert(err instanceof Error ? err.message : 'No se pudo guardar el tratamiento');
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
        setPacienteSeleccionado(pacienteSinVitamina);
        setFormVitamina({ vitaminaNombre: '', dosis: '', via: '', observaciones: '' });
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

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <span className="text-xs md:text-sm text-slate-500 font-medium truncate">
            Módulo Médico / <strong className="text-slate-900">Tratamientos y Vitaminas</strong>
          </span>
          <span className="text-xs text-teal-700 font-extrabold bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200 shrink-0">
            🧪 Control de Sueros e Inyectables
          </span>
        </header>

        <main className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          <div>
            <h1 className="m-0 text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
              💉 Registro de Vitaminas y Sueros
            </h1>
            <p className="m-0 text-xs md:text-sm text-slate-500 mt-1">
              Seleccione al paciente ingresado, verifique si aplica tratamiento y especifique las dosis administradas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center text-xl shrink-0">👥</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Total Ingresados</span>
                <h3 className="m-0 text-xl font-black text-slate-900">{pacientes.length}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0">🧪</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Tratamientos Aplicados</span>
                <h3 className="m-0 text-xl font-black text-emerald-700">{totalAplicados}</h3>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">⏳</div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Pendientes Relleno</span>
                <h3 className="m-0 text-xl font-black text-amber-700">{totalPendientes}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
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

          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
                <h3 className="m-0 text-sm md:text-base font-extrabold text-white">👥 Lista de Pacientes</h3>
                <p className="m-0 text-xs text-slate-400">{pacientesFiltrados.length} encontrados</p>
              </div>
              <div className="p-3 flex flex-col gap-2.5 max-h-[420px] lg:max-h-[520px] overflow-y-auto">
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
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                          isSelected 
                            ? 'border-teal-500 bg-teal-50/70 shadow-sm' 
                            : 'border-slate-200 hover:bg-slate-50'
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
                          <button
                            type="button"
                            onClick={(e) => handleEliminarPaciente(p.id, e)}
                            title="Eliminar registro"
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg p-1.5 text-xs font-bold cursor-pointer transition-all shrink-0"
                          >
                            🗑️
                          </button>
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
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm">
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

                  <form onSubmit={handleGuardarVitamina} className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm flex flex-col gap-4">
                    <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-4 rounded-xl text-white flex items-center gap-3">
                      <span className="text-2xl">🧪</span>
                      <div>
                        <h3 className="m-0 text-sm md:text-base font-extrabold text-white">Especificación de Vitaminas e Inyectables</h3>
                        <p className="m-0 text-xs text-teal-100">Rellene manualmente los datos de la dosis aplicada al paciente</p>
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
                      <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase tracking-wider">
                        VÍA DE ADMINISTRACIÓN
                      </label>
                      <input
                        type="text"
                        value={formVitamina.via}
                        onChange={(e) => setFormVitamina({ ...formVitamina, via: e.target.value })}
                        placeholder="Escriba la vía (ej. Endovenosa EV, Intramuscular IM, etc.)"
                        className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs md:text-sm outline-none focus:border-teal-600 focus:bg-white"
                      />
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
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-extrabold text-xs md:text-sm cursor-pointer transition-all"
                      >
                        🧹 Limpiar Formulario
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white border-none rounded-xl font-extrabold text-xs md:text-sm cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <span>💉</span> {saving ? 'Guardando...' : 'Guardar y Confirmar Aplicación'}
                      </button>
                    </div>
                  </form>
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

