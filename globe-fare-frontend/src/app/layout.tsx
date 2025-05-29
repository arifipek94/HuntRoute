import ErrorBoundary from '@/components/ui/ErrorBoundary';
import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'GlobeFare - Flight Search',
  description: 'Modern flight search experience',
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
        <link
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
          rel='stylesheet'
        />
      </head>
      <body className='min-h-screen bg-[#121212] font-sans text-white antialiased'>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
