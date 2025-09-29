"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/components/auth/auth-provider';
import { AlertCircle } from 'lucide-react';

import VideoGenerationForm from './components/video-generation-form';
import VideoResultDisplay from './components/video-result-display';
import VideoTemplates from './components/video-templates';

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

type DebugEventLevel = 'info' | 'error' | 'success' | 'warning';

type DebugEventInput = {
  level: DebugEventLevel;
  message: string;
  data?: Record<string, unknown>;
};

export interface DebugEvent extends DebugEventInput {
  id: string;
  timestamp: string;
}

const statusLabelMap: Record<string, string> = {
  in_queue: '排队中',
  generating: '生成中',
  done: '已完成',
  not_found: '未找到',
  expired: '已过期',
  failed: '失败',
};

export default function VideoGenerationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [currentTask, setCurrentTask] = useState<VideoTaskStatus | null>(null);
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);
  const [latestError, setLatestError] = useState<string | null>(null);

  const lastStatusRef = useRef<string | null>(null);
  const lastErrorRef = useRef<string | null>(null);

  const pushDebugEvent = useCallback((event: DebugEventInput) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const timestamp = new Date().toLocaleTimeString();

    setDebugEvents((prev) => {
      const next = [...prev, { ...event, id, timestamp }];
      // 保留最新的 80 条调试记录
      return next.slice(-80);
    });
  }, []);

  const handleTaskCreated = useCallback(
    (task: VideoTaskStatus) => {
      setCurrentTask(task);
      setLatestError(null);
      pushDebugEvent({
        level: 'success',
        message: '视频生成任务已提交',
        data: {
          taskId: task.task_id,
          debugId: task.debug_id,
          status: task.status,
        },
      });
    },
    [pushDebugEvent]
  );

  // 轮询任务状态
  useEffect(() => {
    if (!currentTask) {
      return;
    }

    if (['done', 'not_found', 'expired'].includes(currentTask.status)) {
      return;
    }

    const taskId = currentTask.task_id;
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/video/task/${taskId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!response.ok) {
          const bodyText = await response.text();
          pushDebugEvent({
            level: 'error',
            message: '查询任务状态失败',
            data: {
              taskId,
              statusCode: response.status,
              responseBody: bodyText,
            },
          });
          return;
        }

        const data = await response.json();
        setCurrentTask(data);
      } catch (error) {
        pushDebugEvent({
          level: 'error',
          message: '查询任务状态异常',
          data: {
            taskId,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentTask, pushDebugEvent]);

  // 记录任务状态与错误变化
  useEffect(() => {
    if (!currentTask) {
      return;
    }

    if (lastStatusRef.current !== currentTask.status) {
      lastStatusRef.current = currentTask.status;
      pushDebugEvent({
        level: 'info',
        message: `任务状态更新为 ${statusLabelMap[currentTask.status] ?? currentTask.status}`,
        data: {
          taskId: currentTask.task_id,
          debugId: currentTask.debug_id,
          progress: currentTask.progress,
        },
      });

      if (currentTask.status === 'done') {
        setLatestError(null);
        lastErrorRef.current = null;
      }
    }

    if (currentTask.error_message && lastErrorRef.current !== currentTask.error_message) {
      lastErrorRef.current = currentTask.error_message;
      setLatestError(currentTask.error_message);
      pushDebugEvent({
        level: 'error',
        message: '任务返回错误信息',
        data: {
          taskId: currentTask.task_id,
          debugId: currentTask.debug_id,
          detail: currentTask.error_message,
        },
      });
    }
  }, [currentTask, pushDebugEvent]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
          <h2 className="mb-2 text-xl font-semibold">请先登录</h2>
          <p className="text-gray-600">使用即梦AI-视频生成 3.0 Pro 功能需要先登录账户</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto w-full max-w-[1440px] space-y-10 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-xl">
              🎬
            </div>
            <h1 className="text-4xl font-bold text-gray-900">即梦AI-视频生成 3.0 Pro</h1>
          </div>
          <p className="text-base leading-relaxed text-gray-600">
            支持文生视频和图生视频，生成 1080P 高清且具专业级质感的视频，具备多镜头叙事能力，动态表现流畅自然。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8 xl:grid-cols-[440px_minmax(0,1fr)] xl:items-start">
          <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <VideoGenerationForm
              onTaskCreated={handleTaskCreated}
              currentTask={currentTask}
              onDebugEvent={pushDebugEvent}
              onTaskError={(message, context) => {
                setLatestError(message);
                pushDebugEvent({
                  level: 'error',
                  message,
                  data: {
                    source: 'client',
                    ...(context ?? {}),
                  },
                });
              }}
            />
          </div>

          <div className="space-y-6">
            <VideoResultDisplay
              currentTask={currentTask}
              debugEvents={debugEvents}
              latestError={latestError}
            />
            <VideoTemplates />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
