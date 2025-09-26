"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface AIToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  previewImage?: string;
  features?: string[];
  isPopular?: boolean;
}

export function AIToolCard({
  title,
  description,
  icon,
  href,
  badge,
  previewImage,
  features = [],
  isPopular = false
}: AIToolCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {isPopular && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="default" className="bg-gradient-to-r from-orange-500 to-red-500">
            热门
          </Badge>
        </div>
      )}
      
      {badge && !isPopular && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary">{badge}</Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {previewImage && (
          <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-muted">
            <img
              src={previewImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          {description}
        </p>

        {features.length > 0 && (
          <div className="mb-4 space-y-1">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center text-xs text-muted-foreground">
                <div className="mr-2 h-1 w-1 rounded-full bg-primary"></div>
                {feature}
              </div>
            ))}
          </div>
        )}

        <Button asChild className="w-full group/button">
          <Link href={href}>
            <span>开始使用</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover/button:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
