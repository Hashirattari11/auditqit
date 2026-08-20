import type { Metadata } from 'next';
import { Inter, Syne, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AuditIQ — Website & GitHub Code Analyzer',
  description:
    'Free tool to audit website performance, SEO, security, and GitHub code quality. Get AI-powered fix suggestions instantly.',
  keywords: 'website audit, lighthouse, SEO checker, code review, GitHub analyzer, AI code review, security scanner',
  openGraph: {
    title: 'AuditIQ — Audit Everything. Fix Anything. Ship Faster.',
    description: 'Paste any URL or GitHub repo. Get instant performance scores, security issues, code bugs, and AI-powered fix suggestions.',
    url: 'https://auditiq.com',
    siteName: 'AuditIQ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuditIQ — Audit Everything. Fix Anything. Ship Faster.',
    description: 'Paste any URL or GitHub repo. Get instant performance scores, security issues, code bugs, and AI-powered fix suggestions.',
  },
  metadataBase: new URL('https://auditiq.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} ${jetbrains.variable}`}>
      <body className="font-body antialiased">
        <Providers>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
