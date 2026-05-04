import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "./components/service-worker-registration";

export const metadata: Metadata = {
  title: "Comunidade Check-in",
  description: "Cadastro e presenca de membros da comunidade.",
  applicationName: "Comunidade",
  appleWebApp: {
    capable: true,
    title: "Comunidade",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
