import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YYD.AI - AI Agent Skills Platform',
  description: 'Web search, cloud storage, voice cloning, and voice design services powered by AI',
  keywords: ['AI', 'search', 'storage', 'voice cloning', 'text-to-speech', 'API'],
  authors: [{ name: 'YYD.AI' }],
  openGraph: {
    title: 'YYD.AI - AI Agent Skills Platform',
    description: 'Web search, cloud storage, voice cloning, and voice design services powered by AI',
    url: 'https://yyd.ai',
    siteName: 'YYD.AI',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}