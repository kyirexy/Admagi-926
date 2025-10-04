import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15 默认启用 app 目录，无需额外配置
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // 修复 Next.js 15 配置警告
  serverExternalPackages: [],
  
  // 性能优化配置
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // 增加到10MB
    },
  },
  
  // 压缩配置
  compress: true,
  
  // 图片优化
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 简化的webpack配置
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // 输出配置
  output: 'standalone',
  
  // 重定向配置
  async redirects() {
    return [];
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=60',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
