import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = process.env.APP_URL ?? "https://bukmi.pro";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Bukmi — Booking artístico sin intermediarios",
    template: "%s · Bukmi",
  },
  description:
    "Bukmi conecta artistas y promotoras. Menos WhatsApp, más conciertos. Contratos, riders y disponibilidad en un solo sitio.",
  applicationName: "Bukmi",
  authors: [{ name: "Bukmi", url: "https://bukmi.pro" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Bukmi",
    description: "Booking artístico sin intermediarios.",
    locale: "es_ES",
    type: "website",
    siteName: "Bukmi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bukmi",
    description: "Booking artístico sin intermediarios.",
  },
};

export const viewport: Viewport = {
  themeColor: "#1F1F1F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        <a href="#main" className="skip-link">
          Saltar al contenido principal
        </a>
        {children}
      </body>
    </html>
  );
}
