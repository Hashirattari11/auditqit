/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [
      'lighthouse',
      'playwright',
      'chrome-launcher',
      'stripe',
      'puppeteer-core',
      '@sparticuz/chromium',
      'resend',
      'openai',
      'cheerio',
      'bcryptjs',
    ],
  },
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
