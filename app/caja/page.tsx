'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export const dynamic = 'force-dynamic';

interface PacienteCaja {
  id: string | number;
  dni_paciente?: string;
  dni?: string;
  nombre_paciente?: string;
  nombre?: string;
  edad?: string | number;
}

interface RegistroCaja {
  id: string | number;
  dni_paciente: string;
  nombre_paciente: string;
  concepto: string;
  monto: number;
  metodo_pago: string;
  destino_pago: string;
  fecha: string;
  estado: string;
}

function CajaPageContent() {
  const searchParams = useSearchParams();
  const dniParam = searchParams.get('dni');
  const [pacientesCola, setPacientesCola] = useState<PacienteCaja[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteCaja | null>(null);
  const [pagosRealizados, setPagosRealizados] = useState<RegistroCaja[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [form, setForm] = useState({
    dni_paciente: '',
    nombre_paciente: '',
    concepto: 'Consulta Médica General',
    monto: '50.00',
    metodo_pago: 'Efectivo',
    destino_pago: 'Caja'
  });

  useEffect(() => {
    fetchDatosCaja();
    const interval = setInterval(fetchDatosCaja, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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
    if (dniTarget && pacientesCola.length > 0) {
      const enc = pacientesCola.find(p => (p.dni_paciente || p.dni) === dniTarget);
      if (enc) {
        handleSeleccionarPaciente(enc);
      }
    }
  }, [dniParam, pacientesCola]);

  const fetchDatosCaja = async () => {
    try {
      setLoading(true);
      const resCaja = await fetch('/api/caja', { cache: 'no-store' });
      if (!resCaja.ok) throw new Error((await resCaja.json()).error || 'No se pudo cargar la caja');
      const cajaData = await resCaja.json();
      setPagosRealizados((cajaData.pagos || []).map((p: RegistroCaja & { tipo_ingreso?: string }) => ({
        ...p,
        destino_pago: String(p.tipo_ingreso || p.destino_pago || 'Caja').toLowerCase() === 'doctora' ? 'Doctora' : 'Caja',
        estado: p.estado || 'Pagado'
      })));
      const resPacientes = await fetch('/api/pacientes');
      let basePacientes: any[] = [];
      if (resPacientes.ok) {
        const rawP = await resPacientes.json();
        basePacientes = Array.isArray(rawP) ? rawP : [];
      }
      const resTriaje = await fetch('/api/triaje');
      let triajesData: any[] = [];
      if (resTriaje.ok) {
        const rawT = await resTriaje.json();
        triajesData = Array.isArray(rawT) ? rawT : [];
      }
      const mapa = new Map<string, PacienteCaja>();
      basePacientes.forEach(p => {
        const dni = p.dni || p.dni_paciente;
        if (dni) {
          mapa.set(dni, {
            id: p.id || Date.now(),
            dni_paciente: dni,
            nombre_paciente: p.nombre || p.nombre_paciente || 'Sin nombre',
            edad: p.edad || ''
          });
        }
      });
      // Con varios registros por paciente, prevalecen los datos del más reciente.
      triajesData.slice().reverse().forEach(t => {
        const dni = t.dni_paciente || t.dni;
        if (dni) {
          const prev = mapa.get(dni);
          mapa.set(dni, {
            ...prev,
            ...t,
            dni_paciente: dni,
            nombre_paciente: t.nombre_paciente || prev?.nombre_paciente || 'Sin nombre'
          });
        }
      });
      setPacientesCola(Array.from(mapa.values()));
    } catch (err) {
      console.error('Error cargando cola:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarPaciente = (p: PacienteCaja) => {
    setPacienteSeleccionado(p);
    const dni = p.dni_paciente || p.dni || '';
    const nombre = p.nombre_paciente || p.nombre || '';
    setForm(prev => ({
      ...prev,
      dni_paciente: dni,
      nombre_paciente: nombre
    }));
    localStorage.setItem('paciente_activo_vital_salud', JSON.stringify({ dni, nombre }));
    window.dispatchEvent(new Event('paciente_activo_changed'));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEliminarPago = async (id: string | number) => {
    if (confirm('¿Desea eliminar este registro de pago?')) {
      try {
        const response = await fetch(`/api/caja?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!response.ok) throw new Error((await response.json()).error || 'No se pudo eliminar el pago');
        setPagosRealizados(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        alert(error instanceof Error ? error.message : 'No se pudo eliminar el pago');
      }
    }
  };

  const handleProcesarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dni_paciente || !form.nombre_paciente || !form.monto) {
      alert('Por favor seleccione un paciente y verifique el monto.');
      return;
    }
    try {
      setSaving(true);
      const response = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'No se pudo guardar el pago');
      await fetchDatosCaja();
      alert(`Pago guardado por S/ ${Number(form.monto).toFixed(2)} (${form.destino_pago}).`);
      setForm(prev => ({
        ...prev,
        dni_paciente: '',
        nombre_paciente: '',
        monto: '50.00'
      }));
      setPacienteSeleccionado(null);
    } catch (err) {
      console.error('Error procesando pago:', err);
      alert(err instanceof Error ? err.message : 'No se pudo guardar el pago');
    } finally {
      setSaving(false);
    }
  };

  const handleImprimirBoleta = () => {
    if (!form.dni_paciente || !form.nombre_paciente) {
      alert('Seleccione un paciente de la cola para imprimir la boleta.');
      return;
    }
    const ventanaImpresion = window.open('', '_blank', 'width=400,height=600');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Ticket de Pago - Vital Salud</title>
            <style>
              body { font-family: monospace; padding: 20px; color: #000; width: 300px; margin: 0 auto; }
              .center { text-align: center; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .flex { display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            <div class="center">
              <h3>VITAL SALUD</h3>
              <p>Av. Víctor Andrés Belaúnde 367<br>Yanahuara, Arequipa</p>
              <p><strong>TICKET DE PAGO / COBRO</strong></p>
            </div>
            <div class="line"></div>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
            <p><strong>Paciente:</strong> ${form.nombre_paciente}</p>
            <p><strong>DNI:</strong> ${form.dni_paciente}</p>
            <p><strong>Destino:</strong> ${form.destino_pago}</p>
            <div class="line"></div>
            <p><strong>Concepto:</strong><br>${form.concepto}</p>
            <p><strong>Método de Pago:</strong> ${form.metodo_pago}</p>
            <div class="line"></div>
            <div class="flex">
              <strong>TOTAL:</strong>
              <strong>S/ ${parseFloat(form.monto || '0').toFixed(2)}</strong>
            </div>
            <div class="line"></div>
            <div class="center">
              <p>¡Gracias por su preferencia!</p>
              <p style="font-size: 10px;">Comprobante interno</p>
            </div>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
      ventanaImpresion.focus();
      setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
      }, 500);
    }
  };

  const listaPagosValida = Array.isArray(pagosRealizados) ? pagosRealizados : [];
  
  const totalCaja = listaPagosValida
    .filter(p => p.destino_pago === 'Caja')
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  const totalDoctora = listaPagosValida
    .filter(p => p.destino_pago === 'Doctora')
    .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  const totalGeneral = totalCaja + totalDoctora;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
          <span className="text-xs md:text-sm text-slate-500 font-medium truncate">
            Módulo Caja / <strong className="text-slate-900">Gestión de Cobros y Facturación</strong>
          </span>
          <span className="text-xs font-extrabold text-teal-900 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            💰 Total General: <strong className="text-teal-700 text-sm">S/ {totalGeneral.toFixed(2)}</strong>
          </span>
        </header>
        <main className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ingresos en Caja</span>
                <span className="text-xl font-black text-teal-700 mt-1 block">S/ {totalCaja.toFixed(2)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg">💵</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pagos a la Doctora</span>
                <span className="text-xl font-black text-indigo-700 mt-1 block">S/ {totalDoctora.toFixed(2)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg">👩‍⚕️</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Recaudado</span>
                <span className="text-xl font-black text-slate-900 mt-1 block">S/ {totalGeneral.toFixed(2)}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-lg">📊</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[380px_460px_1fr] gap-6 items-start">
            
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 text-white border-b border-slate-800">
                <h3 className="m-0 text-sm font-extrabold text-white flex items-center gap-2">
                  👥 Cola de Espera ({pacientesCola.length})
                </h3>
                <p className="m-0 text-xs text-slate-400">Pacientes registrados</p>
              </div>
              <div className="p-3 flex flex-col gap-3 max-h-[580px] overflow-y-auto">
                {pacientesCola.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No hay pacientes en la cola.</div>
                ) : (
                  pacientesCola.map((p) => {
                    const dniVal = p.dni_paciente || p.dni;
                    const isSelected = pacienteSeleccionado?.dni_paciente === dniVal || form.dni_paciente === dniVal;
                    return (
                      <div
                        key={p.id || dniVal}
                        onClick={() => handleSeleccionarPaciente(p)}
                        className={`bg-white rounded-xl p-3.5 border cursor-pointer transition-all flex flex-col gap-2 shadow-sm ${
                          isSelected ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/40' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="m-0 text-xs font-extrabold text-slate-900 uppercase">
                              {p.nombre_paciente || p.nombre}
                            </h4>
                            <span className="text-[11px] text-slate-500 font-semibold">DNI: {dniVal}</span>
                          </div>
                          <button
                            type="button"
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg shrink-0 cursor-pointer ${
                              isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isSelected ? 'Atendiendo' : 'Cobrar ➔'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-teal-700 p-4 text-white flex items-center gap-3">
                <span className="text-2xl">💵</span>
                <div>
                  <h3 className="m-0 text-sm md:text-base font-extrabold text-white">Nuevo Registro de Cobro</h3>
                  <p className="m-0 text-xs text-teal-100">Datos automáticos del paciente</p>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase">
                      DNI PACIENTE *
                    </label>
                    <input
                      type="text"
                      name="dni_paciente"
                      value={form.dni_paciente}
                      onChange={handleChange}
                      placeholder="Seleccione de la cola..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs outline-none"
                      readOnly
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-900 mb-1 uppercase">
                      NOMBRE PACIENTE *
                    </label>
                    <input
                      type="text"
                      name="nombre_paciente"
                      value={form.nombre_paciente}
                      onChange={handleChange}
                      placeholder="Seleccione un paciente..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs outline-none"
                      readOnly
                      required
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-extrabold text-slate-900 mb-1.5 uppercase tracking-wider">
                    📍 DESTINO DEL PAGO
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, destino_pago: 'Caja' }))}
                      className={`py-2 px-3 rounded-xl font-extrabold text-xs border cursor-pointer transition-all ${
                        form.destino_pago === 'Caja'
                          ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      💵 Pagar en Caja
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, destino_pago: 'Doctora' }))}
                      className={`py-2 px-3 rounded-xl font-extrabold text-xs border cursor-pointer transition-all ${
                        form.destino_pago === 'Doctora'
                          ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      👩‍⚕️ Directo a la Doctora
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex flex-col gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">CONCEPTO / ATENCIÓN</label>
                    <select
                      name="concepto"
                      value={form.concepto}
                      onChange={handleChange}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs outline-none cursor-pointer"
                    >
                      <option value="Consulta Médica General">Consulta Médica General</option>
                      <option value="Control Enfermería y Triaje">Control Enfermería y Triaje</option>
                      <option value="Exámenes de Laboratorio">Exámenes de Laboratorio</option>
                      <option value="Servicios Especializados">Servicios Especializados</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">MONTO (S/) *</label>
                      <input
                        type="number"
                        step="0.01"
                        name="monto"
                        value={form.monto}
                        onChange={handleChange}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-black text-teal-800 text-sm outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase">MÉTODO PAGO</label>
                      <select
                        name="metodo_pago"
                        value={form.metodo_pago}
                        onChange={handleChange}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-900 text-xs outline-none cursor-pointer"
                      >
                        <option value="Efectivo">💵 Efectivo</option>
                        <option value="Yape / Plin">📱 Yape / Plin</option>
                        <option value="Tarjeta">💳 Tarjeta</option>
                        <option value="Transferencia">🏦 Transferencia</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleProcesarPago}
                    disabled={saving}
                    className="py-3 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs rounded-xl border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>✅</span> {saving ? 'Procesando...' : 'Procesar Pago'}
                  </button>
                  <button
                    type="button"
                    onClick={handleImprimirBoleta}
                    className="py-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>🖨️</span> Imprimir Boleta
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-base">📊</div>
                  <div>
                    <h3 className="m-0 text-sm md:text-base font-extrabold text-white">Historial de Cobros Recientes</h3>
                    <p className="m-0 text-xs text-slate-400">{listaPagosValida.length} transacciones</p>
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-3.5 max-h-[580px] overflow-y-auto">
                {listaPagosValida.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <div className="text-3xl mb-2">💸</div>
                    <p className="m-0 text-slate-700 text-xs font-bold">No hay pagos registrados.</p>
                  </div>
                ) : (
                  listaPagosValida.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2 hover:border-teal-300 transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg font-extrabold flex items-center justify-center text-xs shrink-0 ${
                            item.destino_pago === 'Doctora' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {item.destino_pago === 'Doctora' ? '👩‍⚕️' : 'S/'}
                          </div>
                          <div>
                            <h4 className="m-0 text-xs font-extrabold text-slate-900 uppercase">{item.nombre_paciente}</h4>
                            <span className="text-[11px] text-slate-500 font-semibold">DNI: {item.dni_paciente}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEliminarPago(item.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
                          title="Eliminar pago"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-teal-700 font-bold">{item.concepto}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            item.destino_pago === 'Doctora' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                          }`}>
                            {item.destino_pago === 'Doctora' ? 'Doctora' : 'Caja'}
                          </span>
                        </div>
                        <span className="font-black text-slate-900 text-sm">S/ {Number(item.monto).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default function CajaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-bold">Cargando módulo de caja...</div>}>
      <CajaPageContent />
    </Suspense>
  );
}

