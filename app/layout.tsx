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
    icon: "https://images.vexels.com/media/users/3/247540/isolated/preview/2b41fd33fc2c2a3b7d52e9511a7fe99f-flour-text-label-stroke.png",
  }
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
      <body className="min-h-screen bg-background">
        {children}
      </body>
    </html>
  );
}
