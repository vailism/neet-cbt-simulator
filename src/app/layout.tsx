import type { Metadata } from 'next';
import './globals.css';
import 'katex/dist/katex.min.css';
import { SiteNav } from '@/components/SiteNav';

export const metadata: Metadata = {
  title: 'NEET (UG) CBT Simulator - Near-Exact NTA Examination Platform',
  description:
    'Simulate the realistic National Eligibility cum Entrance Test (UG) computer-based examination environment with question palette, real-time timer, marking scheme, and comprehensive result analytics.',
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
