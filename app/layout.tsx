import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { KaryaAuthProvider } from '@/lib/auth/user-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'KARYA — Voice-First AI Agent',
  description: "Don't navigate software. Just speak.",
};

import { ClerkProvider } from '@clerk/nextjs';
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="bg-[#07090e] text-slate-100 antialiased min-h-screen">
        <ClerkProvider>
          <KaryaAuthProvider>
            {children}
          </KaryaAuthProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
