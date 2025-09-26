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
import { Checkbox } from '@/components/ui/checkbox'
import { VideoPlayer } from '@/components/shared/video-player'
import { CaseStudyCard } from '@/components/shared/case-study-card'
import { FeatureList } from '@/components/shared/feature-card'
import { 
  Play, 
  Pause,
  Volume2,
  Mic,
  Sparkles, 
  Link as LinkIcon,
  Settings,
  TrendingUp,
  Music,
  Type,
  Palette,
  Zap,
  Star,
  Users,
  BarChart3
} from 'lucide-react'

export default function VideoCommentaryPage() {
  const [productLink, setProductLink] = useState('')
  const [productTitle, setProductTitle] = useState('')
  const [sellingPoints, setSellingPoints] = useState('')
  const [resolution, setResolution] = useState('1080x1920')
  const [duration, setDuration] = useState('15s')
  const [voiceStyle, setVoiceStyle] = useState('female-warm')
  const [enableBGM, setEnableBGM] = useState(true)
  const [enableSubtitles, setEnableSubtitles] = useState(true)
  const [enableStickers, setEnableStickers] = useState(false)
  const [enableTransitions, setEnableTransitions] = useState(true)

  const handleGenerate = () => {
    console.log('生成视频解说', {
      productLink,
      productTitle,
      sellingPoints,
      resolution,
      duration,
      voiceStyle,
      enableBGM,
      enableSubtitles,
      enableStickers,
      enableTransitions
    })
  }

  const caseStudies = [
    {
      title: 'WHC海外旗舰店案例',
      description: '护肤品类AI解说视频',
      thumbnail: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=200&fit=crop',
      improvement: '+99.24%',
      metric: 'CTR提升'
    },
    {
      title: '兰芝官方旗舰店案例',
      description: '美妆产品种草视频',
      thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop',
      improvement: '+50.70%',
      metric: 'CTR提升'
    }
  ]

  const features = [
    {
      icon: <Sparkles className="h-5 w-5 text-blue-600" />,
      title: '自动挖掘商品信息',
      description: '生成精准卖点解说文案'
    },
    {
      icon: <Settings className="h-5 w-5 text-green-600" />,
      title: '内容自动识别裁切',
      description: '合理连贯剪辑'
    },
    {
      icon: <Music className="h-5 w-5 text-purple-600" />,
      title: '海量热门音色',
      description: 'BGM、贴纸、花字库'
    }
  ]

  const voiceOptions = [
    { value: 'female-gentle', label: '女声温柔' },
    { value: 'female-sweet', label: '女声甜美' },
    { value: 'female-professional', label: '女声专业' },
    { value: 'male-magnetic', label: '男声磁性' },
    { value: 'male-energetic', label: '男声活力' }
  ]

  return (
    <MainLayout>
      <div className="w-full h-full bg-gray-50">
        <div className="w-full h-full p-6">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">视频解说</h1>
            <p className="text-gray-600">AI自动生成人声讲解视频，精准卖点·高效种草</p>
          </div>

          <div className="grid lg:grid-cols-[2fr_7fr] gap-6 lg:gap-8 h-full">
            {/* 左侧表单区 */}
            <div className="space-y-4 lg:space-y-6">
              {/* 商品信息 */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LinkIcon className="h-5 w-5 text-blue-600" />
                    <span>商品信息</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="请输入商品链接或ID"
                      value={productLink}
                      onChange={(e) => setProductLink(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 whitespace-nowrap">
                      解析
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 whitespace-nowrap">
                      我的商品
                    </Button>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      商品标题 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="请输入商品标题"
                      value={productTitle}
                      onChange={(e) => setProductTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      商品卖点 <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      placeholder="请输入商品卖点，如：保湿锁水，敏感肌可用"
                      value={sellingPoints}
                      onChange={(e) => setSellingPoints(e.target.value)}
                      className="min-h-[100px]"
                      maxLength={200}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <Button 
                        variant="link" 
                        className="text-blue-600 p-0 h-auto"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        智能推荐卖点
                      </Button>
                      <span className="text-xs text-gray-400">{sellingPoints.length}/200</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 视频设置 */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <span>视频设置</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">分辨率</Label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720x1280">720x1280</SelectItem>
                          <SelectItem value="1080x1920">1080x1920</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">时长</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15s">15秒</SelectItem>
                          <SelectItem value="20s">20秒</SelectItem>
                          <SelectItem value="30s">30秒</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">语音风格</Label>
                    <Select value={voiceStyle} onValueChange={setVoiceStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* 高级设置 */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5 text-blue-600" />
                    <span>高级设置</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="bgm"
                        checked={enableBGM}
                        onCheckedChange={(checked) => setEnableBGM(checked === true)}
                      />
                      <Label htmlFor="bgm" className="text-sm">添加背景音乐</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="subtitle" 
                        checked={enableSubtitles}
                        onCheckedChange={(checked) => setEnableSubtitles(checked === true)}
                      />
                      <Label htmlFor="subtitle" className="text-sm">自动生成字幕</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sticker" 
                        checked={enableStickers}
                        onCheckedChange={(checked) => setEnableStickers(checked === true)}
                      />
                      <Label htmlFor="sticker" className="text-sm">添加贴纸特效</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="transition" 
                        checked={enableTransitions}
                        onCheckedChange={(checked) => setEnableTransitions(checked === true)}
                      />
                      <Label htmlFor="transition" className="text-sm">智能转场</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 生成按钮 */}
              <Button 
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                生成视频
              </Button>
            </div>

            {/* 右侧预览与功能介绍区 */}
            <div className="space-y-6 overflow-hidden">
              {/* 主标题 */}
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  一键生成AI人声解说视频
                </h2>
                <p className="text-lg text-gray-600">精准卖点 · 高效种草</p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  <Mic className="h-4 w-4 mr-1" />
                  Powered by 阿里妈妈AI语音合成技术
                </Badge>
              </div>

              {/* 客户案例视频 */}
              <Card className="border-gray-200 shadow-sm h-full">
                <CardHeader>
                  <CardTitle className="text-center">客户成功案例</CardTitle>
                </CardHeader>
                <CardContent className="h-full overflow-y-auto">
                  <div className="grid gap-6">
                    {caseStudies.map((caseStudy, index) => (
                      <CaseStudyCard
                        key={index}
                        title={caseStudy.title}
                        description={caseStudy.description}
                        thumbnail={caseStudy.thumbnail}
                        improvement={caseStudy.improvement}
                        metric={caseStudy.metric}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 三大核心能力 */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>三大核心能力</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeatureList features={features} />
                </CardContent>
              </Card>

              {/* 数据展示 */}
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>平台数据</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">50K+</div>
                      <div className="text-sm text-gray-600">视频生成量</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">85%</div>
                      <div className="text-sm text-gray-600">平均CTR提升</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">2000+</div>
                      <div className="text-sm text-gray-600">活跃商家</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">4.8</div>
                      <div className="text-sm text-gray-600">用户评分</div>
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
                      <h4 className="font-medium text-blue-900 mb-2">最佳实践建议</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 卖点描述要突出产品核心优势和差异化特点</li>
                        <li>• 选择合适的语音风格匹配目标用户群体</li>
                        <li>• 15-20秒时长最适合社交媒体传播</li>
                        <li>• 开启字幕和背景音乐可提升观看体验</li>
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