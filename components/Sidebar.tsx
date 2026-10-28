'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('doctora');
  const [userName, setUserName] = useState<string>('Dra. Susana');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Leer rol y nombre del usuario logueado
    const storedRole = localStorage.getItem('user_role');
    const storedName = localStorage.getItem('user_name');
    if (storedRole) setUserRole(storedRole);
    if (storedName) setUserName(storedName);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Todos los ítems posibles
  const allMenuItems = [
    { name: 'Dashboard General', icon: '📊', path: '/dashboard', roles: ['doctora'] },
    { name: 'Admisión y Pacientes', icon: '🚑', path: '/recepcion', roles: ['doctora', 'enfermera', 'recepcion'] },
    { name: 'Triaje y Signos Vitales', icon: '🩺', path: '/enfermeria', roles: ['doctora', 'enfermera'] },
    { name: 'Consultorio Médico', icon: '👨‍⚕️', path: '/consultorio', roles: ['doctora'] },
    { name: 'Agenda y Citas', icon: '📅', path: '/agenda', roles: ['doctora', 'recepcion'] },
    { name: 'Vitaminas y Controles', icon: '💉', path: '/vitaminas', roles: ['doctora', 'enfermera'] },
    { name: 'Internados / Hospedaje', icon: '🏥', path: '/internados', roles: ['doctora', 'enfermera'] },
    { name: 'Caja y Reportes de Pagos', icon: '💰', path: '/caja', roles: ['doctora', 'recepcion'] },
  ];

  // Filtrar según el rol activo
  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  const isExpanded = isMobile ? isMobileOpen : isHovered;

  return (
    <>
      {/* BOTÓN FLOTANTE HAMBURGUESA PARA MÓVIL */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-3.5 left-3.5 z-50 bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 cursor-pointer text-lg shadow-lg flex items-center justify-center focus:outline-none"
        >
          ☰
        </button>
      )}

      {/* FONDO OSCURO EN MÓVIL AL ABRIR EL MENÚ */}
      {isMobile && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={`fixed top-0 left-0 bottom-0 z-50 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 transition-all duration-300 ease-in-out overflow-x-hidden whitespace-nowrap ${
          isExpanded ? 'w-[260px] shadow-[8px_0_25px_rgba(0,0,0,0.35)]' : 'w-[70px]'
        } ${
          isMobile && !isMobileOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div>
          {/* HEADER / LOGO */}
          <div className="flex items-center gap-3 px-1 py-1 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden border-2 border-sky-600">
              <Image
                src="/logo.png"
                alt="Logo Vital Salud"
                width={36}
                height={36}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className={`transition-opacity duration-200 overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="m-0 text-sm font-black text-white">{userName}</h2>
              <span className="text-[11px] text-sky-400 font-bold block capitalize">
                Modo: {userRole}
              </span>
            </div>
          </div>

          {/* MENÚ DE NAVEGACIÓN FILTRADO POR ROL */}
          <nav className="mt-4 flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl text-xs sm:text-sm no-underline transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <span className="text-lg shrink-0 w-6 text-center">
                    {item.icon}
                  </span>
                  <span className={`transition-opacity duration-200 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTÓN CERRAR SESIÓN */}
        <div className="border-t border-slate-800 pt-3">
          <button
            onClick={async () => {
              await fetch('/api/logout', { method: 'POST' }).catch(() => {});
              localStorage.removeItem('auth_vital_salud');
              localStorage.removeItem('user_role');
              localStorage.removeItem('user_name');
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-3 p-2.5 bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-900/50 rounded-xl text-rose-400 text-xs font-bold cursor-pointer transition-all"
          >
            <span className="text-base shrink-0 w-6 text-center">🚪</span>
            <span className={`transition-opacity duration-200 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

