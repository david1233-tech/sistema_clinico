'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Activity, ArrowUpRight, CalendarDays, CircleDollarSign, UsersRound } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalPacientes: 0,
    triajesHoy: 0,
    ingresosHoy: 'S/ 0.00'
  });

  const [ultimosTriajes, setUltimosTriajes] = useState<any[]>([]);
  const [ultimosCobros, setUltimosCobros] = useState<any[]>([]);
  const [totalCobros, setTotalCobros] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabActiva, setTabActiva] = useState<'ventas' | 'vitaminas' | 'hospedaje'>('ventas');

  const [pacientesVitaminas, setPacientesVitaminas] = useState<any[]>([]);
  const [pacientesHospedaje, setPacientesHospedaje] = useState<any[]>([]);

  const [datosMensualesVentas, setDatosMensualesVentas] = useState<{ [mes: string]: number }>({});
  const [fechaActualizacion, setFechaActualizacion] = useState('');

  useEffect(() => {
    cargarDatosLocales();
    const handleStorageChange = () => cargarDatosLocales();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('paciente_activo_changed', handleStorageChange);

    const interval = setInterval(cargarDatosLocales, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('paciente_activo_changed', handleStorageChange);
    };
  }, []);

  const cargarDatosLocales = async () => {
    try {
      const [pacientesResponse, triajesResponse, cajaResponse, vitaminasResponse, internadosResponse] = await Promise.all([
        fetch('/api/pacientes', { cache: 'no-store' }),
        fetch('/api/triaje', { cache: 'no-store' }),
        fetch('/api/caja', { cache: 'no-store' }),
        fetch('/api/vitaminas', { cache: 'no-store' }),
        fetch('/api/internados', { cache: 'no-store' }),
      ]);
      if (!pacientesResponse.ok || !triajesResponse.ok || !cajaResponse.ok || !vitaminasResponse.ok || !internadosResponse.ok) {
        throw new Error('No se pudieron cargar los datos del dashboard');
      }
      const pacientes: any[] = await pacientesResponse.json();
      const triajes: any[] = await triajesResponse.json();
      const caja = await cajaResponse.json();
      const cobros: any[] = caja.pagos || [];
      setTotalCobros(cobros.length);
      const vitaminas: any[] = await vitaminasResponse.json();
      const internados: any[] = await internadosResponse.json();

      const totalPacientes = pacientes.length > 0 ? pacientes.length : new Set(triajes.map(t => t.dni_paciente)).size;
      const totalRecaudadoNum = cobros.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
      const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const fechaLima = (valor: string) => {
        const parsed = new Date(valor);
        return Number.isNaN(parsed.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsed);
      };

      setStats({
        totalPacientes,
        triajesHoy: triajes.filter(t => fechaLima(t.fecha || t.fecha_hora) === hoy).length,
        ingresosHoy: `S/ ${totalRecaudadoNum.toFixed(2)}`
      });

      setPacientesVitaminas(vitaminas);
      setPacientesHospedaje(internados);

      const meses: { [mes: string]: number } = {};
      for (let i = 4; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(1);
        fecha.setMonth(fecha.getMonth() - i);
        meses[fecha.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' })] = 0;
      }
      cobros.forEach(c => {
        const fecha = new Date(c.fecha);
        if (Number.isNaN(fecha.getTime())) return;
        const mes = fecha.toLocaleDateString('es-PE', { month: 'short', year: '2-digit', timeZone: 'America/Lima' });
        if (mes in meses) meses[mes] += Number(c.monto) || 0;
      });
      setDatosMensualesVentas(meses);
      setFechaActualizacion(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }));

      setUltimosTriajes(triajes.slice(0, 5));
      setUltimosCobros(cobros.slice(0, 5));
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const maxBarraVentas = Math.max(...Object.values(datosMensualesVentas), 100);

  return (
    <div className="module-shell dashboard-shell flex min-h-screen bg-[#f3f7f8] font-sans text-slate-900 overflow-x-hidden">
      
      <Sidebar />

      <div className="module-content flex-1 flex flex-col min-w-0 md:ml-64 transition-all">
        
        {/* HEADER SUPERIOR */}
        <header className="h-16 md:h-20 bg-white/90 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <span className="text-xs md:text-sm text-slate-500 font-medium truncate pl-12 md:pl-0">
            Vital Salud / <strong className="text-slate-900">Panel de control</strong>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] md:text-xs text-emerald-700 font-extrabold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistema Vital Salud en Línea
            </span>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
          
          <div className="dashboard-hero relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#102e43] via-[#0f5360] to-[#087b75] p-6 md:p-9 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shadow-[0_24px_60px_rgba(10,53,68,0.18)]">
            <div className="dashboard-orb absolute -right-12 -top-20 h-64 w-64 rounded-full border-[42px] border-white/10 pointer-events-none" />
            <div>
              <p className="m-0 text-[11px] font-bold tracking-[0.22em] uppercase text-teal-200">Centro de operaciones</p>
              <h1 className="m-0 mt-2 text-2xl md:text-4xl font-black text-white tracking-tight">
                Panel de control
              </h1>
              <p className="m-0 text-xs md:text-sm text-slate-100/85 mt-2 max-w-xl">
                Actividad clínica y financiera en un solo lugar. {fechaActualizacion && `Actualizado a las ${fechaActualizacion}.`}
              </p>
            </div>
            <Link
              href="/recepcion"
              className="relative w-full sm:w-auto px-5 py-3 bg-white hover:bg-teal-50 text-[#0e5660] rounded-xl font-black text-xs md:text-sm cursor-pointer shadow-lg transition-all flex items-center justify-center gap-2 no-underline shrink-0 hover:-translate-y-1"
            >
              <span>＋</span> Nueva recepción <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* TARJETAS KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="dashboard-reveal dashboard-kpi bg-white rounded-2xl p-5 border border-slate-200 shadow-sm" style={{ animationDelay: '80ms' }}>
              <UsersRound className="text-[#087b75]" size={23} />
              <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider block">
                TOTAL PACIENTES
              </span>
              <div className="text-2xl md:text-3xl font-black text-slate-900 mt-2">
                {loading ? '...' : stats.totalPacientes}
              </div>
            </div>

            <div className="dashboard-reveal dashboard-kpi bg-white rounded-2xl p-5 border border-slate-200 shadow-sm" style={{ animationDelay: '160ms' }}>
              <Activity className="text-[#087b75]" size={23} />
              <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider block">
                TRIAJES DE HOY
              </span>
              <div className="text-2xl md:text-3xl font-black text-teal-700 mt-2">
                {loading ? '...' : stats.triajesHoy}
              </div>
            </div>

            <div className="dashboard-reveal dashboard-kpi bg-white rounded-2xl p-5 border border-slate-200 shadow-sm" style={{ animationDelay: '240ms' }}>
              <CircleDollarSign className="text-[#087b75]" size={23} />
              <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-wider block">
                INGRESOS TOTALES
              </span>
              <div className="text-2xl md:text-3xl font-black text-emerald-600 mt-2 truncate">
                {loading ? '...' : stats.ingresosHoy}
              </div>
            </div>
          </div>

          {/* SECCIÓN PESTAÑAS */}
          <div className="dashboard-reveal bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" style={{ animationDelay: '320ms' }}>
            <div className="flex flex-col sm:flex-row border-b border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setTabActiva('ventas')}
                className={`flex-1 py-3 px-4 text-xs font-extrabold border-none cursor-pointer transition-all ${
                  tabActiva === 'ventas'
                    ? 'bg-white text-teal-700 border-b-2 border-teal-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                💵 Ventas y Caja
              </button>
              <button
                type="button"
                onClick={() => setTabActiva('vitaminas')}
                className={`flex-1 py-3 px-4 text-xs font-extrabold border-none cursor-pointer transition-all ${
                  tabActiva === 'vitaminas'
                    ? 'bg-white text-teal-700 border-b-2 border-teal-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                💉 Vitaminas y Sueros
              </button>
              <button
                type="button"
                onClick={() => setTabActiva('hospedaje')}
                className={`flex-1 py-3 px-4 text-xs font-extrabold border-none cursor-pointer transition-all ${
                  tabActiva === 'hospedaje'
                    ? 'bg-white text-teal-700 border-b-2 border-teal-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🏥 Hospedaje / Internados
              </button>
            </div>

            <div className="p-6">
              
              {/* PESTAÑA 1: VENTAS */}
              {tabActiva === 'ventas' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="m-0 text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2">
                        📝 Reporte Económico - Ventas y Caja General
                      </h3>
                      <p className="m-0 text-xs text-slate-500 mt-1">
                        Suma total de ingresos recaudados en caja por consultas y servicios de la clínica.
                      </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        TOTAL RECAUDADO
                      </span>
                      <div className="text-xl md:text-2xl font-black text-emerald-600 truncate">
                        {stats.ingresosHoy}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {totalCobros} transacciones registradas
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h4 className="m-0 text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4">
                      <CalendarDays size={15} className="inline mr-1" /> Ingresos de los últimos cinco meses (Soles)
                    </h4>
                    <div className="h-44 flex items-end justify-between gap-2 sm:gap-6 pt-6 px-2 border-b border-slate-200">
                      {Object.entries(datosMensualesVentas).map(([mes, valor]) => {
                        const alturaPorcentaje = maxBarraVentas > 0 ? Math.min(Math.max((valor / maxBarraVentas) * 100, 8), 100) : 8;
                        return (
                          <div key={mes} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <span className="text-[10px] font-black text-slate-600">S/ {valor}</span>
                            <div 
                              style={{ height: valor > 0 ? `${alturaPorcentaje}%` : '8px' }}
                              className={`dashboard-bar w-full rounded-t-lg transition-all duration-700 ${
                                valor > 0 ? 'bg-teal-600 shadow-md' : 'bg-slate-200'
                              }`}
                            ></div>
                            <span className="text-[11px] font-extrabold text-slate-700">{mes}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: VITAMINAS */}
              {tabActiva === 'vitaminas' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="m-0 text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2">
                        💉 Pacientes en Tratamiento de Vitaminas y Sueros
                      </h3>
                      <p className="m-0 text-xs text-slate-500 mt-1">
                        Cantidad total de pacientes que se han aplicado sueros vitamínicos o terapias nutricionales.
                      </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        TOTAL PACIENTES ATENDIDOS
                      </span>
                      <div className="text-xl md:text-2xl font-black text-indigo-600 truncate">
                        {new Set(pacientesVitaminas.map(p => p.dni_paciente)).size} pacientes
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h4 className="m-0 text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                      📋 Registros de Pacientes (Vitaminas y Sueros)
                    </h4>
                    {pacientesVitaminas.length === 0 ? (
                      <p className="m-0 text-xs text-slate-400 p-4 text-center">No hay pacientes registrados en este tratamiento aún.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {pacientesVitaminas.map((p, idx) => (
                          <div key={p.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                            <div>
                              <strong className="text-slate-900 uppercase block">{p.nombre_paciente}</strong>
                              <span className="text-slate-500">DNI: {p.dni_paciente} • {p.vitaminaNombre}</span>
                            </div>
                            <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                              Aplicado
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: HOSPEDAJE */}
              {tabActiva === 'hospedaje' && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="m-0 text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2">
                        🏥 Pacientes Hospedados / Internados
                      </h3>
                      <p className="m-0 text-xs text-slate-500 mt-1">
                        Control y número de pacientes que se encuentran o estuvieron internados en clínica.
                      </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        TOTAL PACIENTES INTERNADOS
                      </span>
                      <div className="text-xl md:text-2xl font-black text-teal-700 truncate">
                        {new Set(pacientesHospedaje.map(p => p.dni_paciente)).size} pacientes
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <h4 className="m-0 text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3">
                      📋 Registros de Hospedaje e Internamiento
                    </h4>
                    {pacientesHospedaje.length === 0 ? (
                      <p className="m-0 text-xs text-slate-400 p-4 text-center">No hay pacientes internados o registrados en hospedaje aún.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {pacientesHospedaje.map((p, idx) => (
                          <div key={p.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                            <div>
                              <strong className="text-slate-900 uppercase block">{p.nombre_paciente}</strong>
                              <span className="text-slate-500">DNI: {p.dni_paciente} • Cama: {p.cama}</span>
                            </div>
                            <span className="text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                              {p.estado || 'Registrado'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ACCESOS RÁPIDOS DE GESTIÓN (TRIAJE APUNTA A /enfermeria) */}
          <div>
            <h3 className="m-0 text-xs md:text-sm font-extrabold text-slate-700 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
              ⚡ Accesos Rápidos de Gestión
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/recepcion" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-3 no-underline">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">🚑</div>
                <div>
                  <h4 className="m-0 text-xs md:text-sm font-extrabold text-slate-900">Admisión y Recepción</h4>
                  <p className="m-0 text-[11px] text-slate-400">Registrar paciente</p>
                </div>
              </Link>

              <Link href="/enfermeria" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-3 no-underline">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">🩺</div>
                <div>
                  <h4 className="m-0 text-xs md:text-sm font-extrabold text-slate-900">Triaje</h4>
                  <p className="m-0 text-[11px] text-slate-400">Signos vitales</p>
                </div>
              </Link>

              <Link href="/caja" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-3 no-underline">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">💰</div>
                <div>
                  <h4 className="m-0 text-xs md:text-sm font-extrabold text-slate-900">Caja y Pagos</h4>
                  <p className="m-0 text-[11px] text-slate-400">Registrar cobros</p>
                </div>
              </Link>

              <Link href="/agenda" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-3 no-underline">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">📅</div>
                <div>
                  <h4 className="m-0 text-xs md:text-sm font-extrabold text-slate-900">Agenda</h4>
                  <p className="m-0 text-[11px] text-slate-400">Programar citas</p>
                </div>
              </Link>
            </div>
          </div>

          {/* ÚLTIMOS TRIAJES Y COBROS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <h3 className="m-0 text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2">
                🩺 Últimos Triajes Registrados
              </h3>
              {ultimosTriajes.length === 0 ? (
                <p className="m-0 text-xs text-slate-400">Sin registros recientes.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {ultimosTriajes.map((t, idx) => (
                    <div key={t.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-900 uppercase block">{t.nombre_paciente || 'Paciente'}</strong>
                        <span className="text-slate-500">DNI: {t.dni_paciente} • T°: {t.temperatura}°C • Peso: {t.peso}kg</span>
                      </div>
                      <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-1 rounded-md">{t.fecha ? new Date(t.fecha).toLocaleDateString('es-PE') : t.fecha_hora || 'Sin fecha'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
              <h3 className="m-0 text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2">
                💵 Últimos Cobros en Caja
              </h3>
              {ultimosCobros.length === 0 ? (
                <p className="m-0 text-xs text-slate-400">Sin cobros recientes.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {ultimosCobros.map((c, idx) => (
                    <div key={c.id || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-900 uppercase block">{c.nombre_paciente}</strong>
                        <span className="text-slate-500">{c.concepto} ({c.metodo_pago})</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-teal-700 text-sm font-black block">S/ {Number(c.monto).toFixed(2)}</strong>
                        <span className="text-[10px] text-slate-400">{c.fecha}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
