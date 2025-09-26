/**
 * Next.js 404 页面
 * 当用户访问不存在的页面时显示
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        {/* 品牌标识 */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">万</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">万相营造</span>
        </div>
        
        {/* 404 图标 */}
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
          <div className="text-4xl mb-4">🎨</div>
        </div>
        
        {/* 错误信息 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">页面未找到</h2>
          <p className="text-gray-600 leading-relaxed">
            抱歉，您访问的页面不存在。<br />
            可能是页面已被移动或删除。
          </p>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Link href="/">
              返回首页
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/auth/login">
              登录账户
            </Link>
          </Button>
        </div>
        
        {/* 帮助链接 */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">需要帮助？</p>
          <div className="flex justify-center space-x-6 text-sm">
            <Link href="/help" className="text-purple-600 hover:text-purple-500 transition-colors">
              帮助中心
            </Link>
            <Link href="/contact" className="text-purple-600 hover:text-purple-500 transition-colors">
              联系客服
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
