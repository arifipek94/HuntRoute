/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Modern Next.js 15+ optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@headlessui/react',
      'framer-motion',
    ],
  },

  // Turbopack is now stable
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Image optimization for better performance
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.kiwi.com',
        pathname: '/airlines/**',
      },
      // ...add other allowed hostnames if needed...
    ],
  },

  // Performance optimizations
  compress: true,

  // Bundle analyzer in development
  ...(process.env.ANALYZE === 'true' && {
    webpack: config => {
      import('webpack-bundle-analyzer').then(({ BundleAnalyzerPlugin }) => {
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        );
      });
      return config;
    },
  }),

  // Production-only optimizations
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    generateEtags: false,
    httpAgentOptions: {
      keepAlive: true,
    },
  }),
};

module.exports = nextConfig;
