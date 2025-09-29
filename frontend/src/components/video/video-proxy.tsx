"use client";

import { useState, useEffect } from 'react';

interface VideoProxyProps {
  videoUrl: string;
  className?: string;
  onError?: (error: Event) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
}

export function VideoProxy({ 
  videoUrl, 
  className, 
  onError, 
  onLoadStart, 
  onCanPlay 
}: VideoProxyProps) {
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!videoUrl) return;

    // 尝试通过代理服务器加载视频
    const fetchVideoProxy = async () => {
      setIsLoading(true);
      try {
        // 通过后端代理视频URL
        const response = await fetch('/api/video/proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ videoUrl })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setProxyUrl(url);
        } else {
          // 如果代理失败，直接使用原URL
          setProxyUrl(videoUrl);
        }
      } catch (error) {
        console.warn('视频代理失败，使用原始URL:', error);
        setProxyUrl(videoUrl);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoProxy();

    // 清理函数
    return () => {
      if (proxyUrl && proxyUrl.startsWith('blob:')) {
        URL.revokeObjectURL(proxyUrl);
      }
    };
  }, [videoUrl]);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">加载视频中...</p>
        </div>
      </div>
    );
  }

  if (!proxyUrl) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <p className="text-sm text-gray-600">视频加载失败</p>
      </div>
    );
  }

  return (
    <video
      src={proxyUrl}
      controls
      className={className}
      preload="metadata"
      onError={onError}
      onLoadStart={onLoadStart}
      onCanPlay={onCanPlay}
    />
  );
}
