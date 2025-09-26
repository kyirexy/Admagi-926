"use client";

import { Header } from './header';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-gray-50">
      {/* 左侧边栏 */}
      <aside className="hidden md:block">
        <Sidebar />
      </aside>

      {/* 主要内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航 */}
        <Header />

        {/* 主内容 */}
        <main className="flex-1 overflow-hidden bg-white">
          <div className="w-full h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
