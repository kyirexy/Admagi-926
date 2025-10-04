"use client";

import { Header } from './header';
import { Sidebar } from './sidebar';
import { RoutePreloader } from '@/components/routing/route-preloader';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <RoutePreloader />
      
      <div className="flex h-screen w-full bg-gray-50">
        {/* 左侧边栏 - 添加视觉分隔 */}
        <aside className="hidden md:block border-r border-gray-200 shadow-sm">
          <Sidebar />
        </aside>

        {/* 主要内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部导航 */}
          <Header />

        {/* 主内容 */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="w-full min-h-full p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
