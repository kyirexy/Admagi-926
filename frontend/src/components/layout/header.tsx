"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  Search, 
  ShoppingCart, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Crown,
  LogIn
} from 'lucide-react';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount] = useState(3); // 示例购物车数量
  const [unreadNotifications] = useState(5); // 示例未读通知
  const { user, isLoading, refetch } = useAuth();
  
  // 减少console.log输出，只在开发环境输出
  if (process.env.NODE_ENV === 'development') {
    console.log('Header: user:', user);
    console.log('Header: isLoading:', isLoading);
  }

  const handleLogout = async () => {
    try {
      // 调用后端登出API
      await fetch('http://localhost:8000/api/auth/sign-out', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        credentials: 'include'
      });
      
      // 清除本地存储的token
      localStorage.removeItem('auth_token');
      
      // 刷新认证状态
      refetch();
      
      // 重定向到登录页
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('登出失败:', error);
      // 即使登出失败，也清理本地状态
      localStorage.removeItem('auth_token');
      refetch();
      window.location.href = '/auth/login';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo区域 */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">万</span>
            </div>
            <span className="font-bold text-xl">万相营造</span>
          </Link>
        </div>

        {/* 搜索框 */}
        <div className="flex-1 max-w-sm mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索商品、模板、教程..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 右侧用户操作区域 */}
        <div className="flex items-center space-x-3 ml-auto">
          {/* 认证状态显示 */}
          {isLoading ? (
            // 加载状态
            <div className="flex items-center space-x-2">
              <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
            </div>
          ) : user ? (
            // 已登录状态
            <>
              {/* 积分显示 */}
              <div className="flex items-center space-x-1 text-sm sm:text-base">
                <Crown className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-500" />
                <span className="font-medium">{user.credits?.toLocaleString() || 0}</span>
                {user.is_premium && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Pro
                  </Badge>
                )}
              </div>

              {/* 通知图标 */}
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                {unreadNotifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
              </Button>

              {/* 购物车图标 */}
              <Button variant="ghost" size="icon" className="relative h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartCount}
                  </Badge>
                )}
              </Button>

              {/* 用户头像下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/avatars/default.png" alt={`@${user.name || user.email}`} />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>个人中心</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="cursor-pointer">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>订单管理</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>设置</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            // 未登录状态
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  登录
                </Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">
                  注册
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}