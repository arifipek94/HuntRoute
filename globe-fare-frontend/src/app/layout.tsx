import ErrorBoundary from '@/components/ui/ErrorBoundary';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Globe Fare',
  description: 'Find the best flight deals',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className='bg-[#121212] text-white'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        {/* Remove custom font link to avoid Next.js warning */}
      </head>
      <body
        className={`${inter.className} min-h-screen bg-[#121212] font-sans text-white antialiased`}
      >
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
