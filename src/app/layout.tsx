import type { Metadata } from "next";
import "./globals.css"; // ⚠️ ESSA LINHA PRECISA ESTAR EXATAMENTE ASSIM!

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
      <body className="bg-black text-white">{children}</body>
    </html>
  );
}
