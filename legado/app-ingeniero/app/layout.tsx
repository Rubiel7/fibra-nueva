import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'FIBRAS.MX | Fideicomisos de Inversión Inmobiliaria',
  description: 'Explora las 16 FIBRAs listadas en la BMV. Dividendos, ocupación, sector y análisis.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'FIBRAS.MX | FIBRAs Inmobiliarias de México',
    description: 'Datos en tiempo real de las 16 FIBRAs listadas en la BMV.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className="antialiased">
        {children}
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}
