import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AutoApplication - Aplicação Automática para Vagas',
  description: 'Upload seu currículo e deixe a IA encontrar e aplicar para vagas remotas automaticamente.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
