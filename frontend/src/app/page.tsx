"use client";

import { MainLayout } from '@/components/layout/main-layout';
import { AIToolCard } from '@/components/ai/ai-tool-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Image, 
  FileText, 
  MessageSquare, 
  Wrench,
  Zap,
  TrendingUp,
  Users,
  ArrowRight,
  Play
} from 'lucide-react';

export default function HomePage() {
  const aiTools = [
    {
      title: '即梦AI-视频生成3.0 Pro',
      description: '火山引擎即梦AI-视频生成3.0 Pro，支持文生视频和图生视频，1080P高清专业级质感',
      icon: <Play className="h-6 w-6" />,
      href: '/ai',
      previewImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=200&fit=crop&crop=center',
      features: ['文生视频', '图生视频', '1080P高清', '多镜头叙事'],
      isPopular: true,
      badge: '最新'
    },
    {
      title: '电商营销视频',
      description: '专为电商场景优化的AI视频生成，提升商品展示效果和转化率',
      icon: <Image className="h-6 w-6" />,
      href: '/ai',
      previewImage: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=200&fit=crop&crop=center',
      features: ['商品展示', '营销优化', '转化提升', '场景丰富'],
      isPopular: true,
      badge: '热门'
    },
    {
      title: 'AI营销文案',
      description: '智能生成电商营销文案，多场景应用，提升转化效果',
      icon: <MessageSquare className="h-6 w-6" />,
      href: '/ai-tools/text-generation',
      previewImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=200&fit=crop&crop=center',
      features: ['电商文案', '多语言支持', 'SEO友好', '转化优化']
    },
    {
      title: 'AI页面制作',
      description: '智能生成营销页面，响应式设计，一键发布',
      icon: <FileText className="h-6 w-6" />,
      href: '/ai-tools/page-generation',
      previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&crop=center',
      features: ['响应式设计', 'SEO优化', '模板丰富', '快速发布'],
      badge: '新功能'
    },
    {
      title: 'AI营销工具箱',
      description: '图片处理、音频生成、视频制作等电商营销实用工具集合',
      icon: <Wrench className="h-6 w-6" />,
      href: '/ai-tools',
      previewImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=200&fit=crop&crop=center',
      features: ['背景移除', '图像增强', '格式转换', '营销优化']
    }
  ];

  return (
    <MainLayout>
      {/* 横幅区域 */}
      <section className="mb-8 fade-in">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-8 border border-blue-100 card-hover">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 animate-bounce-in">
                【最新功能】AI创意特效上线，大片级创意效果供您选择
              </Badge>
              <Button variant="link" className="text-blue-600 p-0 h-auto hover:text-blue-700 button-press">
                立即体验 <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="slide-in-up">
                <h1 className="responsive-title font-bold mb-4 text-gray-900">
                  翔宇星辰
                  <br />
                  <span className="text-2xl font-normal text-gray-700">电商场景下的AI时代营销大师</span>
                </h1>
                <p className="responsive-text text-gray-600 mb-6 leading-relaxed">
                  <span className="inline-flex items-center mr-6">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    即梦AI-视频生成 3.0 Pro
                  </span>
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    支持文生视频和图生视频，1080P高清专业级质感
                  </span>
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>多镜头叙事能力</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>动态表现流畅自然</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>电商营销专业优化</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>AI智能创意生成</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 button-press hover-lift">
                    立即体验AI创作
                  </Button>
                  <Button size="lg" variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 button-press">
                    <Play className="mr-2 h-4 w-4" />
                    观看演示视频
                  </Button>
                </div>
              </div>
              
              <div className="hidden md:block animate-slide-in-right">
                <div className="relative">
                  <div className="aspect-square bg-white/80 rounded-2xl backdrop-blur-sm border border-blue-200 p-6 shadow-lg animate-float">
                    <div className="grid grid-cols-2 gap-4 h-full">
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center shadow-sm hover-lift">
                        <Image className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg flex items-center justify-center shadow-sm hover-lift">
                        <FileText className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center shadow-sm hover-lift">
                        <MessageSquare className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg flex items-center justify-center shadow-sm hover-lift">
                        <Wrench className="h-8 w-8 text-pink-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/20 to-transparent rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* AI工具卡片网格 */}
      <section className="mb-12 slide-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="responsive-title font-bold text-gray-900">AI创意工具</h2>
          <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 button-press mobile-hidden">
            查看全部 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="responsive-grid feature-grid">
          {aiTools.map((tool, index) => (
            <div key={index} className="card-hover">
              <AIToolCard {...tool} />
            </div>
          ))}
        </div>
      </section>

      {/* 数据展示和推荐内容 */}
      <div className="grid md:grid-cols-3 gap-6 mb-12 tablet-grid mobile-grid fade-in">
        {/* 平台数据 */}
        <Card className="border-gray-200 shadow-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="responsive-text">平台数据</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">今日生成</span>
                  <span className="font-semibold">12,486</span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full smooth-transition" style={{width: '68%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">活跃用户</span>
                  <span className="font-semibold">8,329</span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full smooth-transition" style={{width: '85%'}}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 热门模板 */}
        <Card className="border-gray-200 shadow-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <span className="responsive-text">热门模板</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: '电商营销视频', count: '2.1k' },
                { name: '商品展示模板', count: '1.8k' },
                { name: '品牌宣传片', count: '1.5k' },
                { name: '产品介绍视频', count: '1.2k' }
              ].map((template, index) => (
                <div key={index} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded smooth-transition">
                  <span className="text-sm">{template.name}</span>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">{template.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 用户动态 */}
        <Card className="border-gray-200 shadow-sm card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span className="responsive-text">最新动态</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { user: '电商运营小李', action: '生成了商品展示视频', time: '2分钟前' },
                { user: '品牌营销专员', action: '创建了宣传片', time: '5分钟前' },
                { user: '内容创作者', action: '制作了产品介绍视频', time: '8分钟前' }
              ].map((activity, index) => (
                <div key={index} className="text-sm hover:bg-gray-50 p-2 rounded smooth-transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{activity.user}</span>
                      <span className="text-muted-foreground ml-1">{activity.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 右侧模特图与视频演示区域 */}
      <section className="mb-12 slide-in-up">
        <div className="grid md:grid-cols-3 gap-8 tablet-grid mobile-grid">
          <div className="md:col-span-2">
            <h3 className="responsive-title font-bold mb-4 text-gray-900">热门作品展示</h3>
            <div className="responsive-grid">
              {[
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop',
                'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=200&fit=crop'
              ].map((image, index) => (
                <div key={index} className="relative group cursor-pointer card-hover">
                  <img 
                    src={image} 
                    alt={`作品 ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg shadow-sm group-hover:shadow-md smooth-transition"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg smooth-transition flex items-center justify-center">
                    <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 smooth-transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6 mobile-full">
            <div>
              <h3 className="responsive-title font-bold mb-4 text-gray-900">AI模特展示</h3>
              <div className="relative card-hover">
                <img 
                  src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop&crop=face"
                  alt="AI模特"
                  className="w-full h-64 object-cover rounded-lg shadow-lg"
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <Button className="w-full bg-white/90 text-gray-900 hover:bg-white backdrop-blur-sm button-press hover-lift">
                    <Play className="mr-2 h-4 w-4" />
                    一键生成视频
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 card-hover">
              <h4 className="font-semibold mb-2 text-gray-900">电商视频生成功能</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 商品展示视频生成</li>
                <li>• 多场景营销背景</li>
                <li>• 专业级1080P输出</li>
                <li>• 电商平台一键发布</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 底部推荐区域 - 热门模板轮播 */}
      <section className="fade-in">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl responsive-padding border border-gray-200 card-hover">
          <div className="text-center mb-8">
            <h3 className="responsive-title font-bold mb-2 text-gray-900">热门模板与用户作品</h3>
            <p className="responsive-text text-gray-600">精选优质模板，激发无限创意灵感</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center tablet-grid mobile-grid">
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-900">精选模板</h4>
              <div className="grid grid-cols-2 gap-4 mobile-grid">
                {[
                  { name: '电商海报', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=150&fit=crop' },
                  { name: '社交媒体', image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=200&h=150&fit=crop' },
                  { name: '品牌宣传', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=150&fit=crop' },
                  { name: '产品展示', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=150&fit=crop' }
                ].map((template, index) => (
                  <div key={index} className="relative group cursor-pointer card-hover">
                    <img 
                      src={template.image} 
                      alt={template.name}
                      className="w-full h-24 object-cover rounded-lg shadow-sm group-hover:shadow-md smooth-transition"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{template.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4 mobile-full">
              <h4 className="text-lg font-semibold text-gray-900">平台优势</h4>
              <div className="flex items-center space-x-3 hover:bg-white/50 p-2 rounded smooth-transition">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="responsive-text text-gray-700">国内首创实拍特效，虚拟场景真实呈现</span>
              </div>
              <div className="flex items-center space-x-3 hover:bg-white/50 p-2 rounded smooth-transition">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="responsive-text text-gray-700">智能商品标签，SEO优化提升搜索排名</span>
              </div>
              <div className="flex items-center space-x-3 hover:bg-white/50 p-2 rounded smooth-transition">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="responsive-text text-gray-700">批量处理功能，高效提升工作效率</span>
              </div>
              <div className="flex items-center space-x-3 hover:bg-white/50 p-2 rounded smooth-transition">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="responsive-text text-gray-700">丰富模板库，满足多样化创意需求</span>
              </div>
              
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 button-press hover-lift mobile-full">
                立即体验 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}