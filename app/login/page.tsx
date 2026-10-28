'use client';
import { useState } from 'react';
import InstalarApp from '@/components/InstalarApp';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo iniciar sesión');
      localStorage.setItem('auth_vital_salud', 'true');
      localStorage.setItem('user_role', result.role);
      localStorage.setItem('user_name', result.name);
      window.location.assign(result.next);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans overflow-y-auto bg-slate-950">
      
      {/* FONDO DE PANTALLA */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-80"
        style={{ backgroundImage: `url('/fondo-montana.jpg')` }} 
      />
      <div className="absolute inset-0 bg-black/20 z-0 backdrop-blur-[2px]" />

      {/* RECUADRO RESPONSIVE DE LOGIN */}
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl sm:rounded-[36px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 my-auto">
        
        {/* LADO IZQUIERDO: ILUSTRACIÓN (Visible en PC y Tablets horizontales) */}
        <div className="hidden md:flex relative bg-purple-50 items-center justify-center p-8 overflow-hidden min-h-[480px]">
          <div className="absolute -left-8 -top-8 w-56 h-56 bg-purple-600 rounded-br-full opacity-90 z-0" />
          
          <svg viewBox="0 0 450 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs z-10 drop-shadow-md">
            <g transform="translate(140, 70)">
              <rect x="0" y="0" width="130" height="240" rx="24" fill="#1e293b" />
              <rect x="8" y="10" width="114" height="220" rx="18" fill="#ffffff" />
              <circle cx="65" cy="85" r="24" fill="#7c3aed" />
              <rect x="57" y="83" width="16" height="12" rx="2" fill="#ffffff" />
              <text x="35" y="125" fill="#1e293b" fontSize="13" fontWeight="800">Vital Salud</text>
            </g>
          </svg>
        </div>

        {/* LADO DERECHO: FORMULARIO (Adaptable para móviles y PC) */}
        <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white w-full">
          
          {/* LOGO */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center shadow-lg border-2 border-purple-100 bg-white">
              <img 
                src="/logo.png" 
                alt="Vital Salud Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 text-center mb-4 sm:mb-6">
            Inicio de Sesión
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center mb-4 border border-red-200 shadow-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Usuario / Correo
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-base select-none">👤</span>
                <input 
                  type="text" 
                  value={usuario} 
                  onChange={(e) => setUsuario(e.target.value)} 
                  placeholder="Ingrese su usuario"
                  required
                  className="w-full pl-9 pr-3 py-2.5 sm:py-3 border-b-2 border-purple-600 text-sm font-semibold outline-none text-slate-900 bg-transparent transition-all focus:border-purple-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2 text-base select-none">🔒</span>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 sm:py-3 border-b-2 border-slate-300 text-sm font-semibold outline-none text-slate-900 bg-transparent transition-all focus:border-purple-600"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="mt-3 sm:mt-4 py-3 sm:py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-extrabold text-sm sm:text-base cursor-pointer shadow-lg shadow-purple-500/30 transition-all active:scale-[0.98]"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-4 sm:mt-6">
            <InstalarApp />
          </div>

        </div>

      </div>

    </div>
  );
}

