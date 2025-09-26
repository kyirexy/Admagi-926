'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { VideoPlayer } from './video-player'
import { Play, TrendingUp, Eye, Heart, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CaseStudyCardProps {
  title: string
  description: string
  thumbnail: string
  videoSrc?: string
  improvement?: string
  metric?: string
  stats?: {
    views?: number
    likes?: number
    shares?: number
  }
  tags?: string[]
  className?: string
  onPlay?: () => void
  onShare?: () => void
}

export function CaseStudyCard({
  title,
  description,
  thumbnail,
  videoSrc,
  improvement,
  metric = 'CTR提升',
  stats,
  tags,
  className,
  onPlay,
  onShare
}: CaseStudyCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  const handlePlay = () => {
    setShowVideo(true)
    setIsPlaying(true)
    onPlay?.()
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  return (
    <Card className={cn("border-gray-200 shadow-sm hover:shadow-md transition-all duration-200", className)}>
      <CardContent className="p-0">
        {/* 视频/缩略图区域 */}
        <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
          {showVideo && videoSrc ? (
            <VideoPlayer
              src={videoSrc}
              poster={thumbnail}
              title={title}
              autoPlay={true}
              muted={true}
              className="w-full h-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            <>
              <img 
                src={thumbnail} 
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  onClick={handlePlay}
                  size="lg"
                  className="bg-white/90 hover:bg-white text-black rounded-full p-4"
                >
                  <Play className="h-6 w-6" />
                </Button>
              </div>
            </>
          )}
          
          {/* 改进指标徽章 */}
          {improvement && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500 text-white">
                <TrendingUp className="h-3 w-3 mr-1" />
                {improvement}
              </Badge>
            </div>
          )}

          {/* 标签 */}
          {tags && tags.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>

          {/* 统计数据 */}
          {stats && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {stats.views && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{formatNumber(stats.views)}</span>
                </div>
              )}
              {stats.likes && (
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{formatNumber(stats.likes)}</span>
                </div>
              )}
              {stats.shares && (
                <div className="flex items-center space-x-1">
                  <Share2 className="h-4 w-4" />
                  <span>{formatNumber(stats.shares)}</span>
                </div>
              )}
            </div>
          )}

          {/* 底部操作区 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              {improvement && (
                <span className="text-sm font-medium text-green-600">
                  {metric}: {improvement}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                查看详情
              </Button>
              {onShare && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onShare}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CaseStudyGridProps {
  cases: Array<{
    title: string
    description: string
    thumbnail: string
    videoSrc?: string
    improvement?: string
    metric?: string
    stats?: {
      views?: number
      likes?: number
      shares?: number
    }
    tags?: string[]
  }>
  columns?: 1 | 2 | 3
  className?: string
  onCasePlay?: (index: number) => void
  onCaseShare?: (index: number) => void
}

export function CaseStudyGrid({
  cases,
  columns = 2,
  className,
  onCasePlay,
  onCaseShare
}: CaseStudyGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  return (
    <div className={cn("grid gap-6", gridCols[columns], className)}>
      {cases.map((caseStudy, index) => (
        <CaseStudyCard
          key={index}
          title={caseStudy.title}
          description={caseStudy.description}
          thumbnail={caseStudy.thumbnail}
          videoSrc={caseStudy.videoSrc}
          improvement={caseStudy.improvement}
          metric={caseStudy.metric}
          stats={caseStudy.stats}
          tags={caseStudy.tags}
          onPlay={() => onCasePlay?.(index)}
          onShare={() => onCaseShare?.(index)}
        />
      ))}
    </div>
  )
}