'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, BedDouble, CalendarDays, LayoutDashboard, LogOut, Menu, Stethoscope, Syringe, UsersRound, Wallet } from 'lucide-react';

const subscribeMobile = (notify: () => void) => {
  const media = window.matchMedia('(max-width: 767px)');
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};
const getMobile = () => window.matchMedia('(max-width: 767px)').matches;
const subscribeAuth = (notify: () => void) => {
  window.addEventListener('storage', notify);
  window.addEventListener('vital_auth_changed', notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener('vital_auth_changed', notify);
  };
};
const getRole = () => localStorage.getItem('user_role') || 'doctora';
const getName = () => localStorage.getItem('user_name') || 'Dra. Susana';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useSyncExternalStore(subscribeMobile, getMobile, () => false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const userRole = useSyncExternalStore(subscribeAuth, getRole, () => 'doctora');
  const userName = useSyncExternalStore(subscribeAuth, getName, () => 'Dra. Susana');

  useEffect(() => {
    let activo = true;
    fetch('/api/login', { cache: 'no-store' }).then(response => response.json()).then(session => {
      if (!activo || !session.authenticated) return;
      localStorage.setItem('user_role', session.role);
      localStorage.setItem('user_name', session.name);
      window.dispatchEvent(new Event('vital_auth_changed'));
    }).catch(() => {});
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return;
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [isMobileOpen]);

  // Todos los ítems posibles
  const allMenuItems = [
    { name: 'Dashboard General', icon: LayoutDashboard, path: '/dashboard', roles: ['doctora'] },
    { name: 'Admisión y Pacientes', icon: UsersRound, path: '/recepcion', roles: ['doctora', 'enfermera', 'recepcion', 'operador'] },
    { name: 'Triaje y Signos Vitales', icon: Activity, path: '/enfermeria', roles: ['doctora', 'enfermera', 'operador'] },
    { name: 'Consultorio Médico', icon: Stethoscope, path: '/consultorio', roles: ['doctora'] },
    { name: 'Agenda y Citas', icon: CalendarDays, path: '/agenda', roles: ['doctora', 'recepcion', 'operador'] },
    { name: 'Vitaminas y Controles', icon: Syringe, path: '/vitaminas', roles: ['doctora', 'enfermera', 'operador'] },
    { name: 'Internados / Hospedaje', icon: BedDouble, path: '/internados', roles: ['doctora', 'enfermera'] },
    { name: 'Caja y Reportes de Pagos', icon: Wallet, path: '/caja', roles: ['doctora', 'recepcion'] },
  ];

  // Filtrar según el rol activo
  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));

  const isExpanded = isMobile ? isMobileOpen : isHovered;

  return (
    <>
      {/* BOTÓN FLOTANTE HAMBURGUESA PARA MÓVIL */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? 'Cerrar menú de módulos' : 'Abrir menú de módulos'}
        aria-expanded={isMobileOpen}
        aria-controls="menu-modulos"
        className="fixed top-3.5 left-3.5 z-[60] md:hidden bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-2 cursor-pointer text-lg shadow-lg flex items-center justify-center focus:outline-none"
      >
        <Menu size={21} aria-hidden="true" />
      </button>

      {/* FONDO OSCURO EN MÓVIL AL ABRIR EL MENÚ */}
      {isMobile && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* BARRA LATERAL (SIDEBAR) */}
      <aside
        id="menu-modulos"
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={`sidebar-shell ${isMobileOpen ? 'sidebar-open' : ''} fixed top-0 left-0 bottom-0 z-50 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 transition-all duration-300 ease-in-out overflow-x-hidden whitespace-nowrap ${
          isExpanded ? 'w-[260px] shadow-[8px_0_25px_rgba(0,0,0,0.35)]' : 'w-[70px]'
        } ${
          isMobile && !isMobileOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="min-h-0 flex flex-1 flex-col">
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
            <div className={`sidebar-label transition-opacity duration-200 overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              <h2 className="m-0 text-sm font-black text-white">{userName}</h2>
              <span className="text-[11px] text-sky-400 font-bold block capitalize">
                Modo: {userRole}
              </span>
            </div>
          </div>

          {/* MENÚ DE NAVEGACIÓN FILTRADO POR ROL */}
          <nav className="mt-4 flex flex-1 flex-col gap-1.5 overflow-y-auto min-h-0 pr-1" aria-label="Módulos de Vital Salud">
            <p className={`sidebar-label m-0 px-3 pb-2 text-[10px] font-bold uppercase tracking-[.2em] text-teal-200/70 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Módulos clínicos</p>
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => isMobile && setIsMobileOpen(false)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl text-xs sm:text-sm no-underline transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <span className="shrink-0 w-6 flex justify-center">
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} aria-hidden="true" />
                  </span>
                  <span className={`sidebar-label transition-opacity duration-200 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
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
              router.replace('/login');
            }}
            className="w-full flex items-center gap-3 p-2.5 bg-slate-800/80 hover:bg-rose-950/40 border border-slate-700/60 hover:border-rose-900/50 rounded-xl text-rose-400 text-xs font-bold cursor-pointer transition-all"
          >
            <span className="shrink-0 w-6 flex justify-center"><LogOut size={19} aria-hidden="true" /></span>
            <span className={`sidebar-label transition-opacity duration-200 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
