"use client";

import { useEffect } from 'react';

// 简化的路由预加载器，避免与Next.js内置机制冲突
export function RoutePreloader() {
  useEffect(() => {
    // 延迟预加载，避免阻塞初始渲染
    const timeoutId = setTimeout(() => {
      // 使用更安全的方式预加载资源
      if (typeof window !== 'undefined') {
        // 预加载关键图片资源
        const imageUrls = [
          'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=200&fit=crop&crop=center',
          'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=200&fit=crop&crop=center'
        ];
        
        imageUrls.forEach(url => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          document.head.appendChild(link);
        });
      }
    }, 2000); // 延迟2秒执行

    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
