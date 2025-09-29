/**
 * 前端认证客户端配置
 * 与后端FastAPI + Better Auth兼容API集成
 */

import { useState, useEffect, useCallback } from 'react'

// 类型定义
interface User {
  id: string
  email: string
  name: string
  emailVerified: boolean
  createdAt: string
  username?: string
  credits?: number
  is_premium?: boolean
}

interface Session {
  active: boolean
  expires_at: string
}

interface AuthResponse<T = unknown> {
  data: T | null
  error: { message: string } | null
}

interface SessionData {
  user: User | null
  session: Session | null
}

// 创建自定义的认证客户端，兼容后端API
class AuthClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  
  // 注册用户
  signUp = {
    email: async (data: {
      email: string
      password: string
      name: string
      username?: string
      callbackURL?: string
    }, options?: {
      onRequest?: (ctx: unknown) => void
      onSuccess?: (ctx: unknown) => void
      onError?: (ctx: unknown) => void
    }): Promise<AuthResponse> => {
      try {
        options?.onRequest?.(null)
        
        const response = await fetch(`${this.baseURL}/api/auth/sign-up`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...data,
            username: data.username || data.email.split('@')[0] // 默认用户名
          })
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          const error = { message: result.message || result.detail || '注册失败' }
          options?.onError?.({ error })
          throw new Error(error.message)
        }
        
        options?.onSuccess?.({ data: result })
        return { data: result, error: null }
      } catch (error) {
        const errorObj = { message: error instanceof Error ? error.message : '注册失败' }
        options?.onError?.({ error: errorObj })
        return { data: null, error: errorObj }
      }
    }
  }
  
  // 用户登录
  signIn = {
    email: async (data: {
      email: string
      password: string
      callbackURL?: string
      rememberMe?: boolean
    }, options?: {
      onRequest?: (ctx: unknown) => void
      onSuccess?: (ctx: unknown) => void
      onError?: (ctx: unknown) => void
    }): Promise<AuthResponse> => {
      try {
        options?.onRequest?.(null)
        
        const response = await fetch(`${this.baseURL}/api/auth/sign-in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: data.email,
            password: data.password
          })
        })
        
        const result = await response.json()
        
        if (!response.ok) {
          const error = { message: result.message || result.detail || '登录失败' }
          options?.onError?.({ error })
          throw new Error(error.message)
        }
        
        // 存储token到localStorage
        if (result.access_token) {
          localStorage.setItem('auth_token', result.access_token)
        }
        
        options?.onSuccess?.({ data: result })
        return { data: result, error: null }
      } catch (error) {
        const errorObj = { message: error instanceof Error ? error.message : '登录失败' }
        options?.onError?.({ error: errorObj })
        return { data: null, error: errorObj }
      }
    }
  }
  
  // 用户登出
  signOut = async (options?: {
    fetchOptions?: {
      onSuccess?: () => void
      onError?: (error: unknown) => void
    }
  }): Promise<AuthResponse> => {
    try {
      await fetch(`${this.baseURL}/api/auth/sign-out`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        credentials: 'include'
      })
      
      // 清除本地存储的token
      localStorage.removeItem('auth_token')
      
      const result = { message: '登出成功' }
      options?.fetchOptions?.onSuccess?.()
      return { data: result, error: null }
    } catch (error) {
      localStorage.removeItem('auth_token') // 即使请求失败也清除token
      const errorObj = { message: error instanceof Error ? error.message : '登出失败' }
      options?.fetchOptions?.onError?.(errorObj)
      return { data: null, error: errorObj }
    }
  }
  
  // 获取当前会话
  getSession = async (): Promise<AuthResponse<SessionData>> => {
    try {
      const token = localStorage.getItem('auth_token')
      console.log('getSession: token from localStorage:', token ? 'exists' : 'not found')
      
      if (!token) {
        console.log('getSession: no token, returning null session')
        return { data: { user: null, session: null }, error: null }
      }
      
      console.log('getSession: making request to /api/auth/session')
      const response = await fetch(`${this.baseURL}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      })
      
      const result = await response.json()
      console.log('getSession: response status:', response.status)
      console.log('getSession: response data:', result)
      
      if (!response.ok) {
        console.log('getSession: invalid token, clearing localStorage')
        // 如果token无效，清除它
        localStorage.removeItem('auth_token')
        return { data: { user: null, session: null }, error: null }
      }
      
      return { data: result, error: null }
    } catch (error) {
      console.log('getSession: error occurred:', error)
      return { 
        data: { user: null, session: null }, 
        error: { message: error instanceof Error ? error.message : '获取会话失败' } 
      }
    }
  }
}

// useSession hook - moved outside the class to be a proper React hook
export const useSession = () => {
  const [session, setSession] = useState<SessionData | null>(null)
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState<{ message: string } | null>(null)
  
  const refetch = useCallback(async () => {
    console.log('useSession: refetch called')
    setIsPending(true)
    const { data, error } = await authClient.getSession()
    console.log('useSession: session data received:', data)
    console.log('useSession: session error:', error)
    setSession(data)
    setError(error)
    setIsPending(false)
  }, [])
  
  useEffect(() => {
    console.log('useSession: initial effect triggered')
    refetch()
  }, [refetch])
  
  return {
    data: session,
    isPending,
    error,
    refetch
  }
}

// 创建并导出认证客户端实例
export const authClient = new AuthClient()

// 导出常用方法以保持兼容性
export const { 
  signIn, 
  signUp, 
  signOut, 
  getSession 
} = authClient