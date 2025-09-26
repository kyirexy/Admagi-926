'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UploadArea } from '@/components/shared/upload-area'
import { 
  Sparkles, 
  Link as LinkIcon,
  Settings,
  Zap,
  Star,
  Clock,
  Play
} from 'lucide-react'

export default function ImageToVideoPage() {
  const [productLink, setProductLink] = useState('')
  const [productTitle, setProductTitle] = useState('')
  const [creativeDescription, setCreativeDescription] = useState('')
  const [quality, setQuality] = useState('high')
  const [duration, setDuration] = useState('5s')
  const [aspectRatio, setAspectRatio] = useState('720x1280')
  const [mainImages, setMainImages] = useState<File[]>([])
  const [referenceImages, setReferenceImages] = useState<File[]>([])

  const handleGenerate = () => {
    console.log('生成视频', {
      productLink,
      productTitle,
      creativeDescription,
      quality,
      duration,
      aspectRatio,
      mainImages,
      referenceImages
    })
  }

  const exampleCases = [
    {
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop',
      title: '款式细节',
      description: '展示衣服剪裁、版型'
    },
    {
      image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=200&fit=crop',
      title: '模特穿搭',
      description: '展示搭配场景'
    },
    {
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop',
      title: '面料质感',
      description: '展示材质纹理'
    }
  ]

  return (
    <MainLayout>
      <div className="w-full h-full bg-gray-50">
        <div className="w-full h-full p-6">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">图生视频</h1>
            <p className="text-gray-600">上传图片秒变视频，让你的商品动起来</p>
          </div>

          <div className="grid lg:grid-cols-[2fr_7fr] gap-6 lg:gap-8 h-full">
            {/* 左侧表单区 */}
            <div className="flex flex-col h-full">
              {/* 控制台区域 */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <LinkIcon className="h-4 w-4 text-blue-600" />
                      <span>商品信息</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Input
                        placeholder="请输入商品链接或ID"
                        value={productLink}
                        onChange={(e) => setProductLink(e.target.value)}
                        className="flex-1 text-sm"
                      />
                      <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50 whitespace-nowrap text-xs">
                        解析
                      </Button>
                      <Button variant="outline" size="sm" className="text-gray-600 whitespace-nowrap text-xs">
                        我的商品
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 支持淘宝/天猫商品链接识别，自动填充标题、卖点等
                    </p>
                  </CardContent>
                </Card>

                {/* 上传区域 */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <span>图片上传</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 首帧图片上传 */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">
                        首帧图片 <span className="text-red-500">*</span>
                      </Label>
                      <UploadArea
                         title="点击上传首帧图片"
                         description="支持 JPG、PNG 格式，单个文件不超过 10MB"
                         onFilesChange={setMainImages}
                         accept="image/*"
                         multiple={false}
                         maxFiles={1}
                         variant="compact"
                         className="h-24"
                       />
                    </div>

                    {/* 参考图片上传 */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-2 block">
                        参考图片 <span className="text-gray-400">(可选，最多10张)</span>
                      </Label>
                      <UploadArea
                         title="添加参考图片"
                         description="参考图片可提升生成效果，支持多张上传"
                         onFilesChange={setReferenceImages}
                         accept="image/*"
                         multiple={true}
                         maxFiles={10}
                         variant="compact"
                         className="h-20"
                       />
                    </div>
                  </CardContent>
                </Card>

                {/* 创意描述 */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span>创意描述</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="请描述你想突出的卖点，如'轻盈透气'、'高弹不勒'"
                      value={creativeDescription}
                      onChange={(e) => setCreativeDescription(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                      maxLength={100}
                    />
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                      <span>AI文案助手可帮您优化描述</span>
                      <span>{creativeDescription.length}/100</span>
                    </div>
                    <Button variant="link" size="sm" className="p-0 h-auto text-blue-600 text-xs mt-1">
                      去设置 AI 文案助手
                    </Button>
                  </CardContent>
                </Card>

                {/* 视频参数设置 */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-base">
                      <Settings className="h-4 w-4 text-blue-600" />
                      <span>视频参数</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1 block">清晰度</Label>
                        <Select value={quality} onValueChange={setQuality}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">标准</SelectItem>
                            <SelectItem value="hd">高清</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1 block">时长</Label>
                        <Select value={duration} onValueChange={setDuration}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5s">5秒</SelectItem>
                            <SelectItem value="8s">8秒</SelectItem>
                            <SelectItem value="10s">10秒</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-1 block">比例</Label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="720x1280">720x1280</SelectItem>
                            <SelectItem value="9:16">9:16</SelectItem>
                            <SelectItem value="1:1">1:1</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>预计耗时: 2-3分钟</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 生成按钮区域 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleGenerate} 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  立即生成视频
                </Button>
              </div>
            </div>

            {/* 右侧预览与引导区 */}
            <div className="space-y-6 overflow-hidden">
              {/* 主标题和技术背书 */}
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  上传图片秒变视频，让你的商品动起来
                </h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Powered by 淘宝星辰视频生成大模型
                </Badge>
              </div>

              {/* 案例展示 */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-center">精选案例展示</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {exampleCases.map((example, index) => (
                      <div key={index} className="group cursor-pointer">
                        <div className="relative overflow-hidden rounded-lg">
                          <img 
                            src={example.image} 
                            alt={example.title}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-white/90 backdrop-blur-sm rounded px-2 py-1">
                              <h4 className="font-medium text-sm text-gray-900">{example.title}</h4>
                              <p className="text-xs text-gray-600">{example.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 功能特点 */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>核心优势</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">智能动态生成</h4>
                        <p className="text-sm text-gray-600">AI自动识别商品特征，生成自然流畅的动态效果</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">多场景适配</h4>
                        <p className="text-sm text-gray-600">支持服装、美妆、数码等多品类商品视频生成</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">高质量输出</h4>
                        <p className="text-sm text-gray-600">支持高清分辨率，满足各平台投放需求</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">快速生成</h4>
                        <p className="text-sm text-gray-600">平均2-3分钟完成生成，大幅提升创作效率</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 使用提示 */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Star className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">使用小贴士</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 上传高质量、清晰的商品图片效果更佳</li>
                        <li>• 添加多张参考图片可提升生成质量</li>
                        <li>• 详细的创意描述有助于生成更精准的效果</li>
                        <li>• 建议选择高清模式获得最佳视觉效果</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}