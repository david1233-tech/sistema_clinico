import Sidebar from '@/components/Sidebar';

export default function MedicoPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, sans-serif', color: '#1e293b' }}>
      <Sidebar />
      <div style={{ marginLeft: '270px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 35px', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Módulo / <strong style={{ color: '#0f172a' }}>Consultorio</strong></span>
          <span style={{ fontSize: '14px', color: '#334155', fontWeight: '600' }}>Dra. Ana Sofía Torres</span>
        </header>

        <main style={{ padding: '30px 35px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Consultorio Médico</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Historial clínico, diagnósticos y emisión de recetas.</p>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#0f172a' }}>Atención en Curso</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Seleccione un paciente para iniciar la consulta médica.</p>
          </div>
        </main>
      </div>
    </div>
  );
}
