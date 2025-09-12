import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@burnt-labs/abstraxion/dist/index.css';
import '@burnt-labs/ui/dist/index.css';
import { Providers } from '@/lib/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DDream Protocol - Decentralized Gaming on XION',
  description: 'Create games, stake tokens, and trade - all without a crypto wallet!',
  keywords: 'DDream, XION, blockchain gaming, decentralized gaming, staking',
  openGraph: {
    title: 'DDream Protocol',
    description: 'Decentralized Gaming Protocol on XION',
    url: 'http://localhost:3001',
    siteName: 'DDream Protocol',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DDream Protocol',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DDream Protocol',
    description: 'Decentralized Gaming Protocol on XION',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}