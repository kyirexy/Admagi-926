"use client";

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function BrandLogo() {
  return (
    <div className="fixed top-0 left-0 z-50 bg-white/95 backdrop-blur-sm border-r border-b border-gray-200/50 shadow-sm">
      <Link href="/" className="flex items-center p-3 sm:p-4 hover:bg-gray-50/50 transition-colors duration-200">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* 品牌图标 */}
          <div className="relative">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            {/* 装饰性光晕效果 */}
            <div className="absolute inset-0 h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 opacity-20 blur-sm -z-10"></div>
          </div>
          
          {/* 品牌文字 - 在小屏幕上隐藏 */}
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 leading-tight">
              翔宇星辰
            </span>
            <span className="text-xs text-gray-500 font-medium leading-tight">
              AI创意平台
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}