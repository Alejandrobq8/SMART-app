import type { Metadata } from "next";
import { Crimson_Pro, Atkinson_Hyperlegible, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Par tipográfico "académico": Crimson Pro (serif, para encabezados —
// distingue esto de un SaaS genérico) + Atkinson Hyperlegible (sans,
// diseñada específicamente para legibilidad — apropiada para un sistema
// que usan a diario estudiantes, profesores y personal administrativo).
// IBM Plex Mono se reserva para datos de expediente (carné, horas, fechas):
// refuerza la sensación de "registro oficial" en vez de dato de formulario.
const crimsonPro = Crimson_Pro({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Sistema de Gestión de TCU",
  description: "Gestión de Prácticas Profesionales y Trabajo Comunal Universitario",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${crimsonPro.variable} ${atkinson.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
