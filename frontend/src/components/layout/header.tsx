"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/components/auth/auth-provider';
import { authClient } from '@/lib/auth-client';
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
  const { user, isAuthenticated, isLoading, refetch } = useAuth();

  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            refetch(); // 刷新认证状态
            window.location.href = '/auth/login'; // 重定向到登录页
          },
          onError: (error) => {
            console.error('登出失败:', error);
            // 即使登出失败，也清理本地状态
            refetch();
            window.location.href = '/auth/login';
          }
        }
      });
    } catch (error) {
      console.error('登出失败:', error);
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
          ) : isAuthenticated && user ? (
            // 已登录状态
            <>
              {/* 积分显示 */}
              <div className="flex items-center space-x-1 text-sm">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">{user.credits?.toLocaleString() || 0}</span>
                {user.is_premium && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    Pro
                  </Badge>
                )}
              </div>

              {/* 通知图标 */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
              </Button>

              {/* 购物车图标 */}
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
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
                      <AvatarImage src="/avatars/default.png" alt={`@${user.username}`} />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name || user.username}</p>
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