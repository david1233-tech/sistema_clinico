'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

interface DashboardData {
  metrics: {
    totalPacientes: number;
    triajesHoy: number;
    ingresosHoy: number;
  };
  octubreReport: {
    totalVendido: number;
    transacciones: number;
    caja: number;
    doctora: number;
  };
  ultimosTriajes: any[];
  ultimosPagos: any[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    metrics: { totalPacientes: 0, triajesHoy: 0, ingresosHoy: 0 },
    octubreReport: { totalVendido: 0, transacciones: 0, caja: 0, doctora: 0 },
    ultimosTriajes: [],
    ultimosPagos: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [seccionAbierta, setSeccionAbierta] = useState<string>('ventas');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Inicialización segura en 0
        setData({
          metrics: { totalPacientes: 0, triajesHoy: 0, ingresosHoy: 0 },
          octubreReport: { totalVendido: 0, transacciones: 0, caja: 0, doctora: 0 },
          ultimosTriajes: [],
          ultimosPagos: []
        });
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0f172a' }}>
      <Sidebar />
      
      <div style={{ marginLeft: '270px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Superior */}
        <header style={{ height: '76px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
            Panel / <span style={{ color: '#0f172a', fontWeight: '800' }}>Dashboard General de Control</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '6px 16px', borderRadius: '30px' }}>
              <span style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
              <span style={{ fontSize: '12px', color: '#15803d', fontWeight: '750' }}>Sistema Vital Salud en Línea</span>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
              VS
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Título de Sección y Botón Nuevo Paciente */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📊 Dashboard General de Control
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Resumen ejecutivo en tiempo real del flujo de atención, finanzas y pacientes de la clínica.
              </p>
            </div>
            <Link href="/recepcion" style={{ textDecoration: 'none' }}>
              <button style={{ backgroundColor: '#0d9488', color: '#ffffff', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)' }}>
                + Nuevo Paciente
              </button>
            </Link>
          </div>

          {/* Tarjetas KPI Superiores */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Total Pacientes
              </span>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginTop: '12px' }}>
                {loading ? '...' : data.metrics.totalPacientes}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Triajes de Hoy
              </span>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#0d9488', marginTop: '12px' }}>
                {loading ? '...' : data.metrics.triajesHoy}
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Ingresos de Hoy
              </span>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#059669', marginTop: '12px' }}>
                S/ {loading ? '0.00' : Number(data.metrics.ingresosHoy).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Pestañas de Navegación del Reporte */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setSeccionAbierta('ventas')}
                style={{
                  padding: '16px',
                  border: 'none',
                  borderBottom: seccionAbierta === 'ventas' ? '3px solid #0d9488' : '3px solid transparent',
                  backgroundColor: seccionAbierta === 'ventas' ? '#ffffff' : 'transparent',
                  color: seccionAbierta === 'ventas' ? '#0d9488' : '#64748b',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                💵 Ventas de Octubre ▲
              </button>
              <button
                onClick={() => setSeccionAbierta('vitaminas')}
                style={{
                  padding: '16px',
                  border: 'none',
                  borderBottom: seccionAbierta === 'vitaminas' ? '3px solid #0284c7' : '3px solid transparent',
                  backgroundColor: seccionAbierta === 'vitaminas' ? '#ffffff' : 'transparent',
                  color: seccionAbierta === 'vitaminas' ? '#0284c7' : '#64748b',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                💉 Vitaminas y Sueros ▼
              </button>
              <button
                onClick={() => setSeccionAbierta('internados')}
                style={{
                  padding: '16px',
                  border: 'none',
                  borderBottom: seccionAbierta === 'internados' ? '3px solid #d97706' : '3px solid transparent',
                  backgroundColor: seccionAbierta === 'internados' ? '#ffffff' : 'transparent',
                  color: seccionAbierta === 'internados' ? '#d97706' : '#64748b',
                  fontWeight: '800',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                🏥 Hospedaje / Internados ▼
              </button>
            </div>

            <div style={{ padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  📈 Reporte Económico - Mes de Octubre
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Suma total registrada en caja por consultas y servicios médicos del mes.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Recaudado</span>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#059669' }}>
                  S/ {Number(data.octubreReport.totalVendido || 0).toFixed(2)}
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{data.octubreReport.transacciones || 0} transacciones registradas</span>
              </div>
            </div>
          </div>

          {/* Accesos Rápidos de Gestión */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 16px 0', color: '#0f172a' }}>
              ⚡ Accesos Rápidos de Gestión
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <Link href="/recepcion" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '12px', fontSize: '20px' }}>🚑</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Admisión</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Registrar paciente</span>
                  </div>
                </div>
              </Link>
              <Link href="/enfermeria" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '12px', fontSize: '20px' }}>🩺</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Triaje</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Signos vitales</span>
                  </div>
                </div>
              </Link>
              <Link href="/caja" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '12px', fontSize: '20px' }}>💰</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Caja y Pagos</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Registrar cobros</span>
                  </div>
                </div>
              </Link>
              <Link href="/agenda" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '12px', fontSize: '20px' }}>📅</div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Agenda</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Programar citas</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 16px 0', color: '#0f172a' }}>
                🩺 Últimos Triajes Registrados
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px 0' }}>Sin registros recientes.</p>
              <Link href="/enfermeria" style={{ fontSize: '13px', color: '#0d9488', fontWeight: '700', textDecoration: 'none' }}>
                + Registrar nuevo triaje ahora
              </Link>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 16px 0', color: '#0f172a' }}>
                💵 Últimos Cobros en Caja
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 12px 0' }}>Sin cobros recientes.</p>
              <Link href="/caja" style={{ fontSize: '13px', color: '#059669', fontWeight: '700', textDecoration: 'none' }}>
                + Registrar nuevo cobro en caja
              </Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
