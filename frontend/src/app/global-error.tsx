'use client' // Error components must be Client Components

/**
 * Next.js 全局错误页面
 * 处理应用程序级别的错误
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到控制台或错误监控服务
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center space-y-6 max-w-md mx-auto px-4">
            {/* 品牌标识 */}
            <div className="flex items-center justify-center space-x-2 mb-8">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">万</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">万相营造</span>
            </div>
            
            {/* 错误图标 */}
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
            </div>
            
            {/* 错误信息 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">发生了意外错误</h2>
              <p className="text-gray-600 leading-relaxed">
                抱歉，应用程序遇到了一个错误。<br />
                我们已经记录了这个问题，正在努力修复。
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left bg-red-50 p-4 rounded-lg border">
                  <summary className="cursor-pointer text-red-800 font-medium mb-2">
                    错误详情 (开发模式)
                  </summary>
                  <pre className="text-xs text-red-700 overflow-auto">
                    {error.message}
                    {error.digest && (
                      <div className="mt-2">
                        <strong>Digest:</strong> {error.digest}
                      </div>
                    )}
                  </pre>
                </details>
              )}
            </div>
            
            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => reset()}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                重试
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/">
                  返回首页
                </Link>
              </Button>
            </div>
            
            {/* 帮助链接 */}
            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">问题持续存在？</p>
              <div className="flex justify-center space-x-6 text-sm">
                <Link href="/help" className="text-red-600 hover:text-red-500 transition-colors">
                  帮助中心
                </Link>
                <Link href="/contact" className="text-red-600 hover:text-red-500 transition-colors">
                  联系客服
                </Link>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
