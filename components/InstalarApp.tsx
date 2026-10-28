'use client';
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstalarApp() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [esIOS, setEsIOS] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalada(standalone);
    setEsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const alPoderInstalar = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };
    const alInstalar = () => {
      setInstalada(true);
      setEvento(null);
    };
    window.addEventListener('beforeinstallprompt', alPoderInstalar);
    window.addEventListener('appinstalled', alInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  if (instalada) return null;

  const instalar = async () => {
    if (evento) {
      await evento.prompt();
      const { outcome } = await evento.userChoice;
      if (outcome === 'accepted') setInstalada(true);
      setEvento(null);
    } else {
      // iPhone o navegador sin aviso automático: mostrar instrucciones
      setMostrarAyuda((v) => !v);
    }
  };

  return (
    <div style={{ marginTop: '18px', textAlign: 'center' }}>
      <button
        type="button"
        onClick={instalar}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#ffffff',
          color: '#7c3aed',
          border: '2px solid #e9d5ff',
          borderRadius: '24px',
          fontWeight: 800,
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        📲 Instalar App
      </button>

      {mostrarAyuda && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px 12px',
            backgroundColor: '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#475569',
            lineHeight: 1.5,
            textAlign: 'left',
          }}
        >
          {esIOS ? (
            <>
              En iPhone: abre esta página en <b>Safari</b>, toca el botón <b>Compartir</b> (⬆️) y elige{' '}
              <b>“Agregar a pantalla de inicio”</b>.
            </>
          ) : (
            <>
              Abre el menú del navegador (<b>⋮</b>) y elige <b>“Instalar app”</b> o{' '}
              <b>“Agregar a pantalla principal”</b>.
            </>
          )}
        </div>
      )}
    </div>
  );
}

