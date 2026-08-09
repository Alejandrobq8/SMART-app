import type { Metadata } from "next";
import { Crimson_Pro, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

// Par tipográfico "académico": Crimson Pro (serif, para encabezados —
// distingue esto de un SaaS genérico) + Atkinson Hyperlegible (sans,
// diseñada específicamente para legibilidad — apropiada para un sistema
// que usan a diario estudiantes, profesores y personal administrativo).
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
      className={`${crimsonPro.variable} ${atkinson.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
