import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from '@/components/providers/client-providers';
import { PerformanceMonitor } from '@/components/performance/performance-monitor';
import { ChunkErrorBoundary } from '@/components/error/chunk-error-boundary';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // 优化字体加载
});

export const metadata: Metadata = {
  title: "万相营造 - AI驱动的创意电商平台",
  description: "专业的多模态AI创意工具平台，提供图片生成、文案创作、页面制作等AI服务",
  keywords: ["AI", "视频生成", "图片生成", "创意工具", "电商"],
  authors: [{ name: "万相营造团队" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        {/* 预加载关键资源 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="http://localhost:8000" />
        
        {/* 关键CSS内联 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .loading-spinner {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `
        }} />
      </head>
      <body
        className={`${inter.variable} antialiased m-0 p-0 h-screen overflow-hidden`}
      >
        <PerformanceMonitor />
        <ChunkErrorBoundary>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ChunkErrorBoundary>
      </body>
    </html>
  );
}