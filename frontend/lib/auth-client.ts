/**
 * 前端认证客户端配置
 * 与Better Auth后端API集成
 */

import { useState, useEffect, useCallback } from 'react'

// 类型定义
interface User {
  id: string
  email: string
  name: string
  username?: string
  credits?: number
  is_premium?: boolean
  image?: string
}

interface Session {
  token: string
  expires_at: number
}

interface AuthResponse<T = unknown> {
  data: T | null
  error: { message: string } | null
}

interface SessionData {
  user: User | null
  session: Session | null
}

interface SignUpOptions {
  onRequest?: (ctx: unknown) => void
  onSuccess?: (ctx: unknown) => void
  onError?: (ctx: unknown) => void
}

interface SignInOptions {
  onRequest?: (ctx: unknown) => void
  onSuccess?: (ctx: unknown) => void
  onError?: (ctx: unknown) => void
}

// 认证函数 (不是类，避免hooks问题)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// 注册函数
export const signUp = {
  email: async (data: {
    email: string
    password: string
    name: string
    username?: string
    callbackURL?: string
  }, options?: SignUpOptions): Promise<AuthResponse> => {
    try {
      options?.onRequest?.(null)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        const error = { message: result.detail || '注册失败' }
        options?.onError?.({ error })
        throw new Error(error.message)
      }
      
      // 存储token到localStorage (支持Better Auth格式和FastAPI格式)
      const token = result.data?.session?.token || result.access_token;
      if (token) {
        localStorage.setItem('auth_token', token)
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

// 登录函数
export const signIn = {
  email: async (data: {
    email: string
    password: string
    callbackURL?: string
    rememberMe?: boolean
  }, options?: SignInOptions): Promise<AuthResponse> => {
    try {
      options?.onRequest?.(null)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/sign-in`, {
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
        const error = { message: result.detail || '登录失败' }
        options?.onError?.({ error })
        throw new Error(error.message)
      }
      
      // 存储token到localStorage (支持Better Auth格式和FastAPI格式)
      const token = result.data?.session?.token || result.access_token;
      if (token) {
        localStorage.setItem('auth_token', token)
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

// 登出函数
export const signOut = async (options?: {
  fetchOptions?: {
    onSuccess?: () => void
    onError?: (error: { message: string }) => void
  }
}): Promise<AuthResponse> => {
  try {
    await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
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

// 获取会话函数
export const getSession = async (): Promise<AuthResponse<SessionData>> => {
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      return { data: { user: null, session: null }, error: null }
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      // 如果token无效，清除它
      localStorage.removeItem('auth_token')
      return { data: { user: null, session: null }, error: null }
    }
    
    // 适配Better Auth和FastAPI响应格式
    const userData = result.data?.user || result.user;
    const sessionData = result.data?.session || result.session || { 
      token, 
      expires_at: Date.now() + 30 * 60 * 1000 
    };
    
    return { 
      data: { user: userData, session: sessionData }, 
      error: null 
    }
  } catch (error) {
    return { 
      data: { user: null, session: null }, 
      error: { message: error instanceof Error ? error.message : '获取会话失败' } 
    }
  }
}

// useSession hook (独立函数，不在类中)
export const useSession = () => {
  const [session, setSession] = useState<SessionData | null>(null)
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState<{ message: string } | null>(null)
  
  const refetch = useCallback(async () => {
    setIsPending(true)
    const { data, error: sessionError } = await getSession()
    setSession(data)
    setError(sessionError)
    setIsPending(false)
  }, [])
  
  useEffect(() => {
    refetch()
  }, [refetch])
  
  return {
    data: session,
    isPending,
    error,
    refetch
  }
}

// 发送验证邮件
export const sendVerificationEmail = async (data: { email: string; callbackURL?: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || result.detail || '发送验证邮件失败')
    }
    
    return { data: result, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : '发送验证邮件失败' } 
    }
  }
}

// 忘记密码
export const forgetPassword = async (data: { email: string; redirectTo?: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forget-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || result.detail || '发送重置邮件失败')
    }
    
    return { data: result, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : '发送重置邮件失败' } 
    }
  }
}

// 重置密码
export const resetPassword = async (data: { newPassword: string; token: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error?.message || result.detail || '重置密码失败')
    }
    
    return { data: result, error: null }
  } catch (error) {
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : '重置密码失败' } 
    }
  }
}

// 创建认证客户端对象 (保持向后兼容)
export const authClient = {
  signUp,
  signIn,
  signOut,
  getSession,
  useSession,
  sendVerificationEmail,
  forgetPassword,
  resetPassword
}

export default authClient