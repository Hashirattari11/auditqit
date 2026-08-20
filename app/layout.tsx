import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AuditIQ — Website & GitHub Code Analyzer',
  description:
    'Free tool to audit website performance, SEO, security, and GitHub code quality. Get AI-powered fix suggestions instantly.',
  keywords: 'website audit, lighthouse, SEO checker, code review, GitHub analyzer, AI code review',
  openGraph: {
    title: 'AuditIQ — Website & GitHub Code Analyzer',
    description: 'Free tool to audit website performance, SEO, security, and GitHub code quality with AI-powered fix suggestions.',
    url: 'https://auditiq.com',
    siteName: 'AuditIQ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AuditIQ — Website & GitHub Code Analyzer',
    description: 'Free tool to audit website performance, SEO, security, and GitHub code quality with AI-powered fix suggestions.',
  },
  metadataBase: new URL('https://auditiq.com'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <ToastProvider>
            <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
              {children}
            </div>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
