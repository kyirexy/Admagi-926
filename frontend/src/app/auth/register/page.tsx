"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/auth-client';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { refetch } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 基本验证
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少需要6位');
      setIsLoading(false);
      return;
    }

    const { error: authError } = await authClient.signUp.email(
      {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        username: formData.username,
        callbackURL: '/'
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: async (ctx: unknown) => {
          console.log('注册成功:', ctx);
          setIsLoading(false);
          // 显示成功消息，提示用户检查邮箱
          setError(''); // 清除错误
          // 可以显示成功提示，告知用户检查邮箱
          alert('注册成功！请检查您的邮箱并点击验证链接完成邮箱验证。');
          // 立即刷新认证状态
          await refetch();
          // 延迟一点确保状态更新完成
          setTimeout(() => {
            router.push('/'); // 重定向到首页
          }, 100);
        },
        onError: (ctx: unknown) => {
          const errorCtx = ctx as { error: { message: string } };
          setError(errorCtx.error.message || '注册失败，请稍后重试');
          setIsLoading(false);
        }
      }
    );

    if (authError) {
      setError(authError.message || '注册失败，请稍后重试');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* 品牌标识 */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">万</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">万相营造</span>
          </div>
          <p className="text-gray-600">创建您的账户，开启AI创意之旅</p>
        </div>

        {/* 注册表单 */}
        <Card>
          <CardHeader>
            <CardTitle>用户注册</CardTitle>
            <CardDescription>
              填写以下信息创建您的账户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-6">
              {/* 姓名输入 */}
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="请输入您的姓名"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* 用户名输入 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">用户名将作为您的唯一标识</p>
              </div>

              {/* 邮箱输入 */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="请输入您的邮箱"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码（至少6位）"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 确认密码输入 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {/* 注册按钮 */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '注册中...' : '立即注册'}
              </Button>

              {/* 服务条款 */}
              <div className="text-center text-xs text-gray-500">
                注册即表示您同意我们的{' '}
                <Link href="/terms" className="text-purple-600 hover:text-purple-500">
                  服务条款
                </Link>{' '}
                和{' '}
                <Link href="/privacy" className="text-purple-600 hover:text-purple-500">
                  隐私政策
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 登录链接 */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            已有账户？{' '}
            <Link 
              href="/auth/login"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
