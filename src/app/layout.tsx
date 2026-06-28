import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZapVid - Gerador de Conversas",
  description: "Crie vídeos de conversas para redes sociais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0a0a0a] text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
