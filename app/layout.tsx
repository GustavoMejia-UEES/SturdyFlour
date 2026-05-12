import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SturdyFlour - Repository",
    template: "SturdyFlour | %s",
  },
  description: "Estudio Académico Universitario con Simulación IA y Repositorio Seguro.",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var handler = function(e) {
                  var msg = (e.message || e.reason || '').toString().toLowerCase();
                  if (msg.indexOf('chunkloaderror') !== -1 || msg.indexOf('loading chunk') !== -1 || msg.indexOf('failed to fetch') !== -1) {
                    console.warn('System: Stale chunk detected via global listener. Resetting container cache...');
                    window.location.reload();
                  }
                };
                window.addEventListener('error', handler, true);
                window.addEventListener('unhandledrejection', handler, true);
              })();
            `
          }}
        />
      </head>
      <body className="min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}
