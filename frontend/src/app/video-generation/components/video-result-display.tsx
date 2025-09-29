"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Video,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clipboard,
} from 'lucide-react';
import type { DebugEvent } from '../page';

interface VideoTaskStatus {
  task_id: string;
  status: string;
  progress: number;
  video_url?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
  debug_id?: string;
}

interface VideoResultDisplayProps {
  currentTask: VideoTaskStatus | null;
  debugEvents: DebugEvent[];
  latestError?: string | null;
}

const statusLabelMap: Record<string, string> = {
  in_queue: '排队中',
  generating: '生成中',
  done: '已完成',
  not_found: '未找到',
  expired: '已过期',
  failed: '失败',
  unknown: '未知',
};

const levelStyleMap: Record<DebugEvent['level'], string> = {
  success: 'border-green-200 bg-green-50 text-green-700',
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-700',
};

export default function VideoResultDisplay({ currentTask, debugEvents, latestError }: VideoResultDisplayProps) {
  const [videoError, setVideoError] = useState<string | null>(null);
  const formatIsoDateTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      // Stable, locale-agnostic representation to avoid SSR/CSR mismatch
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mi = String(d.getUTCMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${mi} UTC`;
    } catch {
      return iso ?? '';
    }
  };

  useEffect(() => {
    setVideoError(null);
  }, [currentTask?.video_url]);

  const statusIcon = useMemo(() => {
    if (!currentTask) {
      return <Clock className="h-5 w-5 text-gray-400" />;
    }
    switch (currentTask.status) {
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'not_found':
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'generating':
        return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  }, [currentTask]);

  const statusBadgeVariant = currentTask?.status === 'done' ? 'default' : 'secondary';

  const handleDownload = () => {
    if (!currentTask?.video_url) {
      return;
    }
    const link = document.createElement('a');
    link.href = currentTask.video_url;
    link.download = `video-${currentTask.task_id}.mp4`;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyDebugId = async () => {
    if (!currentTask?.debug_id) {
      return;
    }
    try {
      await navigator.clipboard.writeText(currentTask.debug_id);
    } catch (error) {
      console.error('复制调试 ID 失败', error);
    }
  };

  const renderVideoContent = () => {
    if (!currentTask) {
      return (
        <div className="flex min-h-[520px] md:min-h-[620px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-400">
          <Video className="mb-4 h-16 w-16 opacity-40" />
          <p>设置参数并点击生成按钮，视频将在这里展示</p>
        </div>
      );
    }

    if (currentTask.status === 'done' && currentTask.video_url && !videoError) {
      return (
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-xl">
          <video
            key={currentTask.video_url}
            src={currentTask.video_url}
            controls
            preload="metadata"
            className="w-full max-h-[75vh] object-contain md:aspect-video"
            onError={(event) => {
              const target = event.target as HTMLVideoElement;
              setVideoError('视频加载失败，请尝试下载原始文件。');
              console.error('视频加载失败', { src: target.currentSrc, error: event });
            }}
            onLoadStart={() => {
              console.log('开始加载视频:', currentTask.video_url);
            }}
            onCanPlay={() => {
              console.log('视频可以播放');
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/0 via-black/0 to-black/50 opacity-0 transition-opacity duration-200 hover:opacity-100">
            <Button onClick={handleDownload} size="sm" className="bg-white/80 text-gray-900 hover:bg-white">
              <Download className="mr-2 h-4 w-4" />
              下载当前视频
            </Button>
          </div>
        </div>
      );
    }

    if (videoError) {
      return (
        <div className="flex min-h-[520px] md:min-h-[620px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
          <AlertTriangle className="mb-4 h-10 w-10" />
          <p className="mb-2 text-sm">{videoError}</p>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />下载原始文件
          </Button>
        </div>
      );
    }

    if (currentTask.status === 'generating') {
      return (
        <div className="flex min-h-[520px] md:min-h-[620px] flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-700">
          <LoadingSpinner className="mb-4 h-14 w-14" />
          <p className="text-base">正在生成您的视频，请稍候...</p>
          <p className="mt-2 text-xs text-blue-500">进度 {currentTask.progress}% · 预计 2-5 分钟</p>
        </div>
      );
    }

    if (currentTask.status === 'in_queue') {
      return (
        <div className="flex min-h-[520px] md:min-h-[620px] flex-col items-center justify-center rounded-2xl border border-yellow-200 bg-yellow-50 text-yellow-700">
          <Clock className="mb-4 h-12 w-12" />
          <p className="text-base">任务已提交，正在排队等待处理...</p>
          <p className="mt-2 text-xs text-yellow-600">预计等待时间 1-2 分钟</p>
        </div>
      );
    }

    if (currentTask.status === 'not_found' || currentTask.status === 'expired') {
      return (
        <div className="flex min-h-[520px] md:min-h-[620px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600">
          <XCircle className="mb-4 h-12 w-12" />
          <p className="text-base">生成失败</p>
          <p className="mt-2 max-w-md text-center text-sm text-red-500">
            {currentTask.error_message || '请重新提交任务或联系管理员'}
          </p>
        </div>
      );
    }

    return (
      <div className="flex min-h-[520px] md:min-h-[620px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-400">
        <Video className="mb-4 h-16 w-16 opacity-40" />
        <p>目前还没有任务，请先在左侧提交生成请求。</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            {statusIcon}
            任务状态追踪
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTask ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={statusBadgeVariant}>{statusLabelMap[currentTask.status] ?? currentTask.status}</Badge>
                <span className="text-sm text-gray-500">进度：{currentTask.progress}%</span>
                {currentTask.debug_id && (
                  <Button variant="outline" size="xs" className="flex items-center gap-1" onClick={handleCopyDebugId}>
                    <Clipboard className="h-3.5 w-3.5" />
                    调试 ID
                  </Button>
                )}
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${Math.min(Math.max(currentTask.progress, 5), 100)}%` }}
                />
              </div>
              <div className="grid gap-2 text-xs text-gray-500 md:grid-cols-2">
                <div>
                  <span className="font-medium text-gray-700">任务 ID：</span>
                  <span className="font-mono">{currentTask.task_id}</span>
                </div>
                {currentTask.debug_id && (
                  <div>
                    <span className="font-medium text-gray-700">调试 ID：</span>
                    <span className="font-mono text-rose-600">{currentTask.debug_id}</span>
                  </div>
                )}
                {currentTask.created_at && (
                  <div>
                    <span className="font-medium text-gray-700">创建时间：</span>
                    <span suppressHydrationWarning>{formatIsoDateTime(currentTask.created_at)}</span>
                  </div>
                )}
                {currentTask.updated_at && (
                  <div>
                    <span className="font-medium text-gray-700">最近更新：</span>
                    <span suppressHydrationWarning>{formatIsoDateTime(currentTask.updated_at)}</span>
                  </div>
                )}
              </div>
              {currentTask.error_message && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {currentTask.error_message}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">暂无任务，请先在左侧提交生成请求。</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Video className="h-5 w-5" />
            视频预览
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">{renderVideoContent()}</CardContent>
      </Card>

      {latestError && (
        <Card className="border-red-200 bg-red-50 shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              最近错误
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">{latestError}</p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <RefreshCw className="h-4 w-4" />
            调试信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debugEvents.length > 0 ? (
            <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
              {debugEvents
                .slice()
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className={`flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs ${levelStyleMap[event.level]}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{event.timestamp}</span>
                      <span className="uppercase tracking-wide">{event.level}</span>
                    </div>
                    <span className="text-sm">{event.message}</span>
                    {event.data && (
                      <pre className="overflow-x-auto rounded bg-white/70 p-2 text-[11px] text-gray-700">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">暂无调试信息，提交任务后会实时显示系统日志。</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
