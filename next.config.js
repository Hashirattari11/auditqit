/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'lighthouse',
      'playwright',
      'chrome-launcher',
      'stripe',
      'puppeteer-core',
    ],
  },
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
