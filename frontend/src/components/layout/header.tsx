"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/auth-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/lib/auth-client';

export function Header() {
  const { user, isLoading, refetch } = useAuth();

  const initials = (name?: string, email?: string) => {
    const source = name || email || '';
    const parts = source.split(/[\s@._-]+/).filter(Boolean);
    const chars = parts.slice(0, 2).map(p => p.charAt(0).toUpperCase());
    return chars.join('') || 'U';
  };

  const handleSignOut = async () => {
    await signOut();
    refetch();
  };

  // 顶部导航栏：保留空白导航，仅在未登录时右侧显示登录/注册
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-12 items-center justify-end w-full px-4">
        {/* 右侧：未登录时显示按钮；登录后显示用户菜单 */}
        {!isLoading && !user && (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">登录</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">注册</Link>
            </Button>
          </div>
        )}
        {!isLoading && user && (
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {initials(user.name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-sm font-medium">{user.name || user.email}</span>
                    <span className="text-xs text-muted-foreground max-w-[160px] truncate">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name || '已登录'}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/creative-board">创意看板</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/ai">AI 工具集</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}