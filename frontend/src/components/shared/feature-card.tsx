'use client'

import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon?: ReactNode
  title: string
  description: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function FeatureCard({
  icon,
  title,
  description,
  badge,
  badgeVariant = 'secondary',
  className,
  onClick,
  hover = true
}: FeatureCardProps) {
  return (
    <Card 
      className={cn(
        "border-gray-200 shadow-sm transition-all duration-200",
        hover && "hover:shadow-md hover:border-blue-300 cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {icon && (
            <div className="flex-shrink-0 mt-1">
              {icon}
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {badge && (
                <Badge variant={badgeVariant} className="ml-2">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface FeatureListProps {
  features: Array<{
    icon?: ReactNode
    title: string
    description: string
    badge?: string
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
  className?: string
  cardClassName?: string
  onFeatureClick?: (index: number) => void
}

export function FeatureList({
  features,
  className,
  cardClassName,
  onFeatureClick
}: FeatureListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          badge={feature.badge}
          badgeVariant={feature.badgeVariant}
          className={cardClassName}
          onClick={() => onFeatureClick?.(index)}
        />
      ))}
    </div>
  )
}

interface FeatureGridProps {
  features: Array<{
    icon?: ReactNode
    title: string
    description: string
    badge?: string
    badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
  columns?: 1 | 2 | 3 | 4
  className?: string
  cardClassName?: string
  onFeatureClick?: (index: number) => void
}

export function FeatureGrid({
  features,
  columns = 2,
  className,
  cardClassName,
  onFeatureClick
}: FeatureGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {features.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          badge={feature.badge}
          badgeVariant={feature.badgeVariant}
          className={cardClassName}
          onClick={() => onFeatureClick?.(index)}
        />
      ))}
    </div>
  )
}