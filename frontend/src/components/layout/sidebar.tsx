"use client";

import { useState } from 'react';
import Link from 'next/link';
import { OptimizedLink } from '@/components/routing/optimized-link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home,
  Sparkles,
  Image,
  FileText,
  MessageSquare,
  Layers,
  Video,
  Wrench,
  ChevronDown,
  ChevronRight,
  Palette,
  Edit,
  History,
  ShoppingBag,
  TrendingUp,
  Share2,
  Globe,
  Package,
  Newspaper,
  PenTool,
  MessageCircle,
  ImageIcon,
  Crop,
  ZoomIn,
  Scissors,
  Shuffle,
  User
} from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';

interface SidebarItem {
  title: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: '首页',
    href: '/',
    icon: Home,
  },
  {
    title: 'AI创作',
    href: '/ai',
    icon: Sparkles,
    badge: 'NEW',
  },
  {
    title: '海河星辰',
    icon: Sparkles,
    children: [
      {
        title: '即梦AI-视频生成3.0 Pro',
        href: '/video-generation',
        icon: Video,
        badge: '最新',
      },
      {
        title: '图生视频',
        href: '/image-to-video',
        icon: Video,
      },
      {
        title: '解说视频',
        href: '/video-commentary',
        icon: MessageCircle,
      },
    ],
  },
  {
    title: 'AI图片',
    icon: Image,
    children: [
      {
        title: '极梦3.0图片生成',
        href: '/dream-3-image',
        icon: Sparkles,
        badge: '最新',
      },
      {
        title: '商品图',
        href: '/ai-tools/product-images',
        icon: ShoppingBag,
      },
      {
        title: '展示图',
        href: '/ai-tools/display-images',
        icon: TrendingUp,
      },
      {
        title: '智能抠衣',
        href: '/ai-tools/smart-cutout',
        icon: Scissors,
      },
      {
        title: '手绘商品',
        href: '/ai-tools/hand-drawn',
        icon: PenTool,
      },
      {
        title: '展示套图',
        href: '/ai-tools/display-sets',
        icon: Layers,
      },
    ],
  },
  {
    title: 'AI页面',
    icon: FileText,
    children: [
      {
        title: '商品详记',
        href: '/ai-tools/product-details',
        icon: Package,
      },
    ],
  },
  {
    title: 'AI文案',
    icon: MessageSquare,
    children: [
      {
        title: '标题文案',
        href: '/ai-tools/title-copy',
        icon: PenTool,
      },
      {
        title: '导购文案',
        href: '/ai-tools/guide-copy',
        icon: MessageCircle,
      },
    ],
  },
  {
    title: 'AI工具箱',
    icon: Wrench,
    children: [
      {
        title: '智能抠图',
        href: '/ai-tools/smart-cutout-tool',
        icon: Scissors,
      },
      {
        title: '尺寸魔力',
        href: '/ai-tools/size-magic',
        icon: Crop,
      },
      {
        title: '高清放大',
        href: '/ai-tools/hd-upscale',
        icon: ZoomIn,
      },
      {
        title: '证件照',
        href: '/ai-tools/id-photo',
        icon: User,
      },
      {
        title: 'AI消除',
        href: '/ai-tools/ai-remove',
        icon: Shuffle,
      },
      {
        title: 'AI替换',
        href: '/ai-tools/ai-replace',
        icon: Edit,
      },
    ],
  },
];

interface SidebarItemComponentProps {
  item: SidebarItem;
  level?: number;
}

function SidebarItemComponent({ item, level = 0 }: SidebarItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true); // 默认展开
  const pathname = usePathname();

  const isActive = item.href && pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  if (hasChildren) {
    return (
      <div>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-between font-normal h-9 px-3 hover:bg-blue-50 hover:text-blue-600',
            level > 0 && 'pl-8',
            isActive && 'bg-blue-50 text-blue-600 font-medium'
          )}
          onClick={handleToggle}
        >
          <div className="flex items-center space-x-2">
            {item.icon && <item.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 shrink-0" />}
            <span className="truncate text-sm sm:text-base">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">
                {item.badge}
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 shrink-0" />
          )}
        </Button>
        {isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child, index) => (
              <SidebarItemComponent
                key={index}
                item={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start font-normal h-9 px-3 hover:bg-blue-50 hover:text-blue-600',
        level > 0 && 'pl-8',
        isActive && 'bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-600'
      )}
      asChild
    >
      <OptimizedLink href={item.href || '#'}>
        <div className="flex items-center space-x-2">
          {item.icon && <item.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 shrink-0" />}
          <span className="truncate text-sm sm:text-base">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-600">
              {item.badge}
            </Badge>
          )}
        </div>
      </OptimizedLink>
    </Button>
  );
}

export function Sidebar() {
  const { user, isLoading } = useAuth();
  
  // 减少console.log输出，只在开发环境输出
  if (process.env.NODE_ENV === 'development') {
    console.log('Sidebar: user:', user);
    console.log('Sidebar: isLoading:', isLoading);
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50/50">
      <div className="flex-1 overflow-hidden py-4">
        <div className="space-y-1 px-3">
          {sidebarItems.map((item, index) => (
            <SidebarItemComponent key={index} item={item} />
          ))}
        </div>
      </div>
      
      {/* 底部用户信息区域 */}
      <div className="border-t p-3 bg-white">
        {isLoading ? (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user.is_premium ? 'Pro用户' : '免费用户'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">?</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">未登录</p>
              <p className="text-xs text-muted-foreground">请先登录</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
