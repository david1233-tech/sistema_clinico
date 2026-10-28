import Sidebar from '@/components/Sidebar';

export default function WhatsappPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, sans-serif', color: '#1e293b' }}>
      <Sidebar />
      <div style={{ marginLeft: '270px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 35px', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Módulo / <strong style={{ color: '#0f172a' }}>WhatsApp</strong></span>
          <span style={{ fontSize: '14px', color: '#334155', fontWeight: '600' }}>Automatización</span>
        </header>

        <main style={{ padding: '30px 35px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Automatización de WhatsApp</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Envío de alertas y recordatorios de próximas citas a los pacientes.</p>
          </div>

          <div style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '14px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#0f172a' }}>Enviar Mensaje Directo</h3>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>NÚMERO DE CELULAR</label>
            <input type="text" placeholder="+51 999 999 999" style={{ display: 'block', width: '100%', padding: '10px 14px', margin: '6px 0 15px 0', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
            
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>MENSAJE</label>
            <textarea placeholder="Hola, le recordamos su cita médica en Vital Salud..." style={{ display: 'block', width: '100%', padding: '10px 14px', height: '110px', margin: '6px 0 20px 0', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical' }}></textarea>
            
            <button style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Enviar por WhatsApp 🚀</button>
          </div>
        </main>
      </div>
    </div>
  );
}
