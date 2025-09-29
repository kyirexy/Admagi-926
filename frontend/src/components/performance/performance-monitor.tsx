"use client";

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // 监控路由性能
    const measureRoutePerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          console.log('🚀 路由性能指标:', {
            'DNS查询时间': `${navigation.domainLookupEnd - navigation.domainLookupStart}ms`,
            'TCP连接时间': `${navigation.connectEnd - navigation.connectStart}ms`,
            '请求响应时间': `${navigation.responseEnd - navigation.requestStart}ms`,
            'DOM解析时间': `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
            '页面完全加载时间': `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
            '总加载时间': `${navigation.loadEventEnd - navigation.fetchStart}ms`
          });
        }
      }
    };

    // 页面加载完成后测量性能
    if (document.readyState === 'complete') {
      measureRoutePerformance();
    } else {
      window.addEventListener('load', measureRoutePerformance);
    }

    // 监控长任务
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // 提高长任务阈值到100ms，减少误报
          if (entry.duration > 100) {
            console.warn('⚠️ 检测到长任务:', {
              name: entry.name,
              duration: `${entry.duration}ms`,
              startTime: `${entry.startTime}ms`
            });
          }
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      
      return () => observer.disconnect();
    }
  }, []);

  return null;
}
