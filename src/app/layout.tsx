import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import OnlineStatusIndicator from "@/components/OnlineStatusIndicator";
import PWAInitializer from "@/components/PWAInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plataforma APA",
  description: "Sistema de seguimiento educativo - GlobalIA & ONG Adelante",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "APA"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <PWAInitializer />
          {/* Temporalmente deshabilitado hasta implementar sincronización completa */}
          {/* <OnlineStatusIndicator /> */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
