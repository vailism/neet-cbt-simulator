import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';
import { SiteNav } from '@/components/SiteNav';

export const metadata: Metadata = {
  title: 'Vailism CBT Exam Center - NEET (UG) Examination Platform',
  description:
    'Vailism CBT Exam Center: Official NEET (UG) 2015-2026 computer-based test examination environment with full question palette, real-time countdown timer, authentic marking scheme, and comprehensive result analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased flex flex-col">
        <SiteNav />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
