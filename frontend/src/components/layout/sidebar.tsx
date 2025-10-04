"use client";

import { useState } from 'react';
import { OptimizedLink } from '@/components/routing/optimized-link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  ShoppingBag,
  TrendingUp,
  Package,
  PenTool,
  MessageCircle,
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
  },
  {
    title: '翔宇星辰',
    icon: Sparkles,
    children: [
      {
        title: '星辰AI-产品视频生成',
        href: '/video-generation',
        icon: Video,
      },
      {
        title: '星辰创意画板',
        href: '/creative-board',
        icon: Palette,
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
            'w-full justify-between font-normal h-8 px-2 hover:bg-blue-50 hover:text-blue-600',
            level > 0 && 'pl-8',
            isActive && 'bg-blue-50 text-blue-600 font-medium'
          )}
          onClick={handleToggle}
        >
          <div className="flex items-center space-x-2">
            {item.icon && <item.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4 shrink-0" />}
            <span className="truncate text-xs sm:text-sm">{item.title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4 shrink-0" />
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
        'w-full justify-start font-normal h-8 px-2 hover:bg-blue-50 hover:text-blue-600',
        level > 0 && 'pl-8',
        isActive && 'bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-600'
      )}
      asChild
    >
      <OptimizedLink href={item.href || '#'}>
        <div className="flex items-center space-x-2">
          {item.icon && <item.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-4 md:w-4 shrink-0" />}
          <span className="truncate text-xs sm:text-sm">{item.title}</span>
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
    <div className="flex h-full w-56 flex-col border-r bg-gray-50/50">
      {/* 顶部品牌区：独立于侧边菜单，点击进入首页 */}
      <div className="p-3 border-b bg-white">
        <OptimizedLink href="/">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-md bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
              刘
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold text-sm">翔宇星辰</div>
              <div className="text-[10px] text-muted-foreground">AI创意平台</div>
            </div>
          </div>
        </OptimizedLink>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <div className="space-y-1 px-2">
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
              <p className="text-xs font-medium truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-muted-foreground">
                {'is_premium' in user && user.is_premium ? 'Pro用户' : '免费用户'}
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
