"use client";

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  Image, 
  Wand2, 
  Download, 
  RefreshCw, 
  Sparkles,
  Palette,
  Monitor,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface TaskStatus {
  task_id: string;
  status: string;
  progress: number;
  video_url?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

interface Template {
  name: string;
  prompt: string;
  category: string;
  style: string;
}

export default function Dream3ImagePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskStatus | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // 获取提示词模板
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/ai/prompts/templates');
        const data = await response.json();
        if (data.success) {
          setTemplates(data.templates.dream_3_image || []);
        }
      } catch (error) {
        console.error('获取模板失败:', error);
      }
    };
    fetchTemplates();
  }, []);

  // 轮询任务状态
  useEffect(() => {
    if (!currentTask || currentTask.status === 'completed' || currentTask.status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/ai/task/${currentTask.task_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const data = await response.json();
        setCurrentTask(data);
      } catch (error) {
        console.error('查询任务状态失败:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentTask]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('请输入描述文字');
      return;
    }

    if (!user) {
      alert('请先登录');
      return;
    }

    setIsGenerating(true);
    try {
          const response = await fetch('http://localhost:8000/api/ai/dream-3-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
              prompt: prompt.trim(),
              style,
              size
            })
          });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setCurrentTask({
          task_id: data.task_id,
          status: 'pending',
          progress: 0
        });
      } else {
        alert(data.message || '生成失败');
      }
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setPrompt(template.prompt);
    setStyle(template.style);
    setShowTemplates(false);
  };

  const handleDownload = () => {
    if (currentTask?.video_url) {
      const link = document.createElement('a');
      link.href = currentTask.video_url;
      link.download = `dream-3-image-${currentTask.task_id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'processing':
        return '生成中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">请先登录</h2>
          <p className="text-gray-600">使用极梦3.0图片生成功能需要先登录账户</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-purple-500 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">极梦3.0 图片生成</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            输入您的创意描述，让极梦3.0为您生成高质量的AI图片。支持多种风格和尺寸选择。
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左侧：输入区域 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wand2 className="h-5 w-5 mr-2" />
                  创意输入
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 提示词输入 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    描述您想要的图片 <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="例如：一只可爱的橘色小猫，毛茸茸的，大眼睛，坐在窗台上，阳光洒在身上，超高清，细节丰富"
                    className="min-h-[120px]"
                    maxLength={500}
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {prompt.length}/500
                  </div>
                </div>

                {/* 模板选择 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">快速模板</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplates(!showTemplates)}
                    >
                      {showTemplates ? '隐藏' : '选择模板'}
                    </Button>
                  </div>
                  {showTemplates && (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                      {templates.map((template, index) => (
                        <div
                          key={index}
                          className="p-2 hover:bg-gray-50 rounded cursor-pointer border-b last:border-b-0"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-gray-500 truncate">{template.prompt}</div>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {template.style}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 风格选择 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Palette className="h-4 w-4 inline mr-1" />
                      风格
                    </label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">写实风格</SelectItem>
                        <SelectItem value="artistic">艺术风格</SelectItem>
                        <SelectItem value="cartoon">卡通风格</SelectItem>
                        <SelectItem value="anime">动漫风格</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Monitor className="h-4 w-4 inline mr-1" />
                      尺寸
                    </label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024">正方形 (1024×1024)</SelectItem>
                        <SelectItem value="1024x768">横屏 (1024×768)</SelectItem>
                        <SelectItem value="768x1024">竖屏 (768×1024)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 生成按钮 */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner className="mr-2" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      开始生成
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 任务状态 */}
            {currentTask && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {getStatusIcon(currentTask.status)}
                    <span className="ml-2">生成状态</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">状态</span>
                      <Badge variant={currentTask.status === 'completed' ? 'default' : 'secondary'}>
                        {getStatusText(currentTask.status)}
                      </Badge>
                    </div>
                    
                    {currentTask.status === 'processing' && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">进度</span>
                          <span className="text-sm text-gray-500">{currentTask.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${currentTask.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {currentTask.error_message && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {currentTask.error_message}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：结果展示 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  生成结果
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentTask?.status === 'completed' && currentTask.video_url ? (
                  <div className="space-y-4">
                    <div className="relative group">
                      <img
                        src={currentTask.video_url}
                        alt="生成的图片"
                        className="w-full rounded-lg shadow-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <Button
                          onClick={handleDownload}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          下载图片
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Button onClick={handleDownload} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        下载高清图片
                      </Button>
                    </div>
                  </div>
                ) : currentTask?.status === 'processing' ? (
                  <div className="text-center py-12">
                    <LoadingSpinner className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-gray-600">正在生成您的图片，请稍候...</p>
                    <p className="text-sm text-gray-500 mt-2">
                      预计需要 30-60 秒
                    </p>
                  </div>
                ) : currentTask?.status === 'failed' ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">生成失败</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {currentTask.error_message || '请重试或联系客服'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>输入描述并点击生成按钮开始创作</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 使用说明 */}
            <Card>
              <CardHeader>
                <CardTitle>使用说明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>描述技巧：</strong>详细描述您想要的图片内容，包括主体、背景、光线、风格等
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>风格选择：</strong>根据需求选择合适的风格，写实风格适合真实场景，艺术风格更有创意
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>尺寸建议：</strong>正方形适合社交媒体，横屏适合横幅，竖屏适合手机壁纸
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>生成时间：</strong>通常需要 30-60 秒，请耐心等待
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
