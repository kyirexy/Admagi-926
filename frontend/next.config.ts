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
    // 启用优化
    optimizeCss: true,
  },
  
  // 压缩配置
  compress: true,
  
  // 图片优化
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 确保正确的构建配置
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // 简化代码分割配置，避免chunk加载错误
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
            reuseExistingChunk: true,
          },
        },
      };
      
      // 添加错误处理
      config.optimization.moduleIds = 'deterministic';
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
