import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { ServiceWorker } from "@/components/ServiceWorker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Construfácil — Materiais de construção com entrega",
  description:
    "Marketplace de materiais de construção com entrega na obra. Peça cimento, tijolos, tintas e ferramentas como num delivery.",
  applicationName: "Construfácil",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Construfácil",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased text-stone-800">
        {/* Container "celular": tudo dentro de max-w-md centralizado */}
        <AuthBootstrap />
        <ServiceWorker />
        {/* Mobile: coluna "celular" centralizada. Desktop (md+): largura total
            — o menu lateral e o recuo do conteúdo ficam nos layouts de seção. */}
        <div className="mx-auto min-h-screen max-w-md bg-stone-50 shadow-xl md:max-w-none md:shadow-none">
          {children}
        </div>
      </body>
    </html>
  );
}
