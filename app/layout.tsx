import type { Metadata, Viewport } from "next";
import "./globals.css";

// Configuración del color del tema e interfaz móvil
export const viewport: Viewport = {
  themeColor: "#0d9488",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Metadata global con soporte PWA
export const metadata: Metadata = {
  title: "Centro Vital Salud | Centro naturista en Arequipa",
  description:
    "Tu salud, en manos naturales. Medicina naturista, nutrición, psicología, terapias y productos naturales en Yanahuara, Arequipa.",
  manifest: "/manifest.json", // 👈 Vincula tu manifest.json automáticamente
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VitalSalud",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}

