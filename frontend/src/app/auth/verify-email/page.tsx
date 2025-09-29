'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('验证链接无效')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('邮箱验证成功！您现在可以使用所有功能了。')
      } else {
        setStatus('error')
        setMessage(data.detail || '验证失败，请重试')
      }
    } catch (error) {
      setStatus('error')
      setMessage('网络错误，请检查您的连接')
    }
  }

  const handleGoToLogin = () => {
    router.push('/auth/login')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">邮箱验证</CardTitle>
          <CardDescription>
            正在验证您的邮箱地址...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p className="text-gray-600">正在验证中...</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-green-600 text-center">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 text-red-500" />
                <p className="text-red-600 text-center">{message}</p>
              </>
            )}
          </div>

          <div className="flex flex-col space-y-3">
            {status === 'success' && (
              <Button onClick={handleGoHome} className="w-full">
                返回首页
              </Button>
            )}
            
            {status === 'error' && (
              <Button onClick={handleGoToLogin} className="w-full">
                返回登录
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}