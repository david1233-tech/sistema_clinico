'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoPacienteModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    telefono: '',
    direccion: '',
    edad: '',
    genero: ''
  });
  const [loading, setLoading] = useState(false);
  const [buscandoDni, setBuscandoDni] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);
  const dniActual = useRef('');

  const consultarReniec = useCallback(async (dni: string, signal?: AbortSignal) => {
    if (!/^\d{8}$/.test(dni)) return;
    setBuscandoDni(true);
    setMensaje(null);
    try {
      const res = await fetch(`/api/reniec?dni=${dni}`, { signal });
      const data = await res.json();
      if (signal?.aborted || dniActual.current !== dni) return;
      if (res.ok && data.success) {
        setFormData(prev => ({ 
          ...prev, 
          nombre: prev.nombre || data.nombreCompleto || '',
          genero: data.genero || prev.genero,
          direccion: prev.direccion || data.direccion || ''
        }));
        setMensaje({ tipo: 'exito', texto: 'Datos encontrados. Revise y complete los campos antes de guardar.' });
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'DNI no encontrado. Puede completar los datos manualmente.' });
      }
    } catch {
      if (!signal?.aborted && dniActual.current === dni) {
        setMensaje({ tipo: 'error', texto: 'Error al consultar el DNI. Puede completar los datos manualmente.' });
      }
    } finally {
      if (!signal?.aborted && dniActual.current === dni) setBuscandoDni(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !/^\d{8}$/.test(formData.dni)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => consultarReniec(formData.dni, controller.signal), 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, formData.dni, consultarReniec]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: 'exito', texto: '¡Paciente registrado con éxito! Actualizando módulos...' });
        
        // 1. Invalidamos las rutas en caché de Next.js
        router.refresh();

        // 2. Redirigimos y forzamos la actualización completa para que aparezca en todos lados al instante
        setTimeout(() => {
          router.push(`/recepcion?dni=${formData.dni}`);
        }, 1000);

      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Ocurrió un error' });
      }
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="btn-hover"
        style={{ padding: '11px 22px', backgroundColor: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}
      >
        <span>➕</span> Registrar Nuevo Paciente
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '560px', borderRadius: '22px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }}>
            
            {/* Cabecera del Modal */}
            <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', padding: '22px 28px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  📋
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#ffffff' }}>Nuevo Paciente</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#ccfbf1' }}>Añadir nuevo registro clínico</p>
                </div>
              </div>
              <button 
                onClick={() => setOpen(false)} 
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '28px' }}>
              {mensaje && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', fontSize: '13px', fontWeight: '600', backgroundColor: mensaje.tipo === 'exito' ? '#f0fdf4' : '#fff1f2', color: mensaje.tipo === 'exito' ? '#15803d' : '#9f1239', border: `1px solid ${mensaje.tipo === 'exito' ? '#bbf7d0' : '#fecdd3'}` }}>
                  {mensaje.texto}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Campo DNI con botón de consulta */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>NÚMERO DE DNI *</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      required 
                      type="text" 
                      maxLength={8}
                      value={formData.dni} 
                      inputMode="numeric"
                      pattern="[0-9]{8}"
                      onChange={e => {
                        const dni = e.target.value.replace(/\D/g, '').slice(0, 8);
                        dniActual.current = dni;
                        setBuscandoDni(false);
                        setMensaje(null);
                        setFormData(prev => ({ ...prev, dni }));
                      }} 
                      placeholder="Ej: 71234567" 
                      style={{ flex: 1, padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: '700', color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none' }} 
                    />
                    <button
                      type="button"
                      onClick={() => consultarReniec(formData.dni)}
                      disabled={buscandoDni || formData.dni.length !== 8}
                      style={{ padding: '0 18px', backgroundColor: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '750', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(13, 148, 136, 0.2)' }}
                    >
                      {buscandoDni ? 'Buscando...' : 'Consultar DNI'}
                    </button>
                  </div>
                </div>

                {/* Nombre Completo */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>NOMBRE COMPLETO *</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.nombre} 
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })} 
                    placeholder="Se autocompletará con RENIEC o ingrese manual" 
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '700', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} 
                  />
                </div>

                {/* Teléfono y Edad */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>TELÉFONO / CELULAR</label>
                    <input 
                      type="text" 
                      value={formData.telefono} 
                      onChange={e => setFormData({ ...formData, telefono: e.target.value })} 
                      placeholder="999888777" 
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>EDAD</label>
                    <input 
                      type="number" 
                      value={formData.edad} 
                      onChange={e => setFormData({ ...formData, edad: e.target.value })} 
                      placeholder="Ej: 30" 
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} 
                    />
                  </div>
                </div>

                {/* Género y Dirección */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>GÉNERO</label>
                    <select 
                      value={formData.genero} 
                      onChange={e => setFormData({ ...formData, genero: e.target.value })} 
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', fontWeight: '600', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Seleccionar</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>DIRECCIÓN</label>
                    <input 
                      type="text" 
                      value={formData.direccion} 
                      onChange={e => setFormData({ ...formData, direccion: e.target.value })} 
                      placeholder="Ej: Av. Principal 123" 
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', color: '#0f172a', backgroundColor: '#f8fafc', boxSizing: 'border-box', outline: 'none' }} 
                    />
                  </div>
                </div>

                {/* Botones de acción inferiores */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '14px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setOpen(false)} 
                    style={{ padding: '12px 22px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '750', fontSize: '13.5px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    style={{ padding: '12px 26px', backgroundColor: '#0d9488', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)' }}
                  >
                    {loading ? 'Guardando...' : 'Guardar Paciente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

