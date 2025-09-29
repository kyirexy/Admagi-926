"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Wand2,
  Sparkles,
  Play,
  Upload,
  Clock,
  Film,
  Image as ImageIcon,
  X,
  Info,
} from 'lucide-react';

type DebugEventInput = {
  level: 'info' | 'error' | 'success' | 'warning';
  message: string;
  data?: Record<string, unknown>;
};

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

interface VideoTemplate {
  name: string;
  prompt: string;
  category: string;
  generation_type: string;
  frames: number;
  aspect_ratio: string;
}

type GenerationType = 'text_to_video' | 'image_to_video';

type TaskErrorContext = Record<string, unknown> | undefined;

interface VideoGenerationFormProps {
  onTaskCreated: (task: VideoTaskStatus) => void;
  currentTask: VideoTaskStatus | null;
  onDebugEvent?: (event: DebugEventInput) => void;
  onTaskError?: (message: string, context?: TaskErrorContext) => void;
}

const PROMPT_MAX_LENGTH = 800;

const statusLabelMap: Record<string, string> = {
  in_queue: '排队中',
  generating: '生成中',
  done: '已完成',
  not_found: '未找到',
  expired: '已过期',
  failed: '失败',
  unknown: '未知',
};

export default function VideoGenerationForm({
  onTaskCreated,
  currentTask,
  onDebugEvent,
  onTaskError,
}: VideoGenerationFormProps) {
  const [generationType, setGenerationType] = useState<GenerationType>('text_to_video');
  const [prompt, setPrompt] = useState('');
  const [frames, setFrames] = useState(121); // 5秒
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isImageMode = useMemo(() => generationType === 'image_to_video', [generationType]);

  // 获取视频模板
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/video/templates');
        const data = await response.json();
        if (data.success) {
          const allTemplates = [
            ...data.templates.text_to_video,
            ...data.templates.image_to_video,
          ];
          setTemplates(allTemplates);
        }
      } catch (error) {
        console.error('获取模板失败:', error);
        onDebugEvent?.({
          level: 'error',
          message: '获取模板失败',
          data: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    };
    fetchTemplates();
  }, [onDebugEvent]);

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    const generationLabel = generationType === 'text_to_video' ? '文生视频' : '图生视频';
    setFormError(null);

    if (generationType === 'text_to_video' && !trimmedPrompt) {
      const message = '请输入描述文字';
      setFormError(message);
      onTaskError?.(message, { reason: 'prompt_required' });
      onDebugEvent?.({
        level: 'warning',
        message,
        data: { generationType },
      });
      return;
    }

    if (generationType === 'image_to_video' && !uploadedImage) {
      const message = '请上传图片';
      setFormError(message);
      onTaskError?.(message, { reason: 'image_required' });
      onDebugEvent?.({
        level: 'warning',
        message,
        data: { generationType },
      });
      return;
    }

    setIsGenerating(true);
    onDebugEvent?.({
      level: 'info',
      message: `开始提交${generationLabel}任务`,
      data: {
        generationType,
        frames,
        aspectRatio,
        promptLength: trimmedPrompt.length,
        hasImage: Boolean(uploadedImage),
      },
    });

    try {
      let response: Response;

      if (generationType === 'text_to_video') {
        response = await fetch('http://localhost:8000/api/video/text-to-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({
            prompt: trimmedPrompt,
            frames,
            aspect_ratio: aspectRatio,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append('prompt', trimmedPrompt);
        formData.append('frames', frames.toString());
        formData.append('aspect_ratio', aspectRatio);
        if (uploadedImage) {
          formData.append('image', uploadedImage);
        }

        response = await fetch('http://localhost:8000/api/video/image-to-video', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: formData,
        });
      }

      if (!response.ok) {
        let responseText = '';
        let parsedBody: unknown = null;
        let debugId: string | undefined;
        let derivedMessage: string | null = null;
        try {
          responseText = await response.text();
          parsedBody = responseText ? JSON.parse(responseText) : null;
          const detail =
            (parsedBody as any)?.detail ?? parsedBody;
          debugId = detail?.debug_id ?? (parsedBody as any)?.debug_id;
          const detailMessage = detail?.message ?? detail?.detail ?? detail;
          if (typeof detailMessage === 'string' && detailMessage) {
            derivedMessage = detailMessage;
          }
        } catch (parseError) {
          if (!responseText) {
            responseText = (parseError instanceof Error ? parseError.message : String(parseError)) ?? '';
          }
        }

        const message = derivedMessage ?? `请求失败: ${response.status}`;
        setFormError(message);
        const context = {
          statusCode: response.status,
          debugId,
          responseBody: parsedBody ?? responseText,
        };
        onTaskError?.(message, context);
        onDebugEvent?.({
          level: 'error',
          message: `${generationLabel}任务创建失败`,
          data: context,
        });
        return;
      }

      const data = await response.json();
      if (data.success) {
        const nowIso = new Date().toISOString();
        onTaskCreated({
          task_id: data.task_id,
          status: 'in_queue',
          progress: 10,
          debug_id: data.debug_id,
          created_at: nowIso,
          updated_at: nowIso,
        });
        onDebugEvent?.({
          level: 'success',
          message: `${generationLabel}任务创建成功`,
          data: {
            taskId: data.task_id,
            debugId: data.debug_id,
            frames,
            aspectRatio,
          },
        });
      } else {
        const message = data.message || `${generationLabel}任务创建失败`;
        setFormError(message);
        onTaskError?.(message, { response: data });
        onDebugEvent?.({
          level: 'error',
          message,
          data,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败，请重试';
      setFormError(message);
      onTaskError?.(message, { error: error instanceof Error ? error.stack : String(error) });
      onDebugEvent?.({
        level: 'error',
        message: `${generationLabel}任务异常`,
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateSelect = (template: VideoTemplate) => {
    setPrompt(template.prompt);
    setFrames(template.frames);
    setAspectRatio(template.aspect_ratio);
    setGenerationType(template.generation_type as GenerationType);
    setShowTemplates(false);
    onDebugEvent?.({
      level: 'info',
      message: '已应用模板',
      data: { template: template.name },
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 4.7 * 1024 * 1024) {
      const message = '图片文件过大，请上传小于 4.7MB 的图片';
      setFormError(message);
      onTaskError?.(message, { reason: 'image_too_large', size: file.size });
      return;
    }

    if (!file.type.startsWith('image/')) {
      const message = '请选择图片文件';
      setFormError(message);
      onTaskError?.(message, { reason: 'invalid_image_type', type: file.type });
      return;
    }

    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    onDebugEvent?.({
      level: 'info',
      message: '已选择图片',
      data: { name: file.name, size: file.size },
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
          <Wand2 className="h-5 w-5" />
          视频生成设置
        </CardTitle>
        <p className="text-sm text-gray-500">
          配置参数后提交任务，系统会自动生成视频并在右侧展示结果与调试信息。
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentTask && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span>
                当前任务 ID：<span className="font-mono text-gray-800">{currentTask.task_id}</span>
              </span>
              {currentTask.debug_id && (
                <span>
                  调试 ID：<span className="font-mono text-rose-600">{currentTask.debug_id}</span>
                </span>
              )}
              <span>
                状态：{statusLabelMap[currentTask.status] ?? currentTask.status}（{currentTask.progress}%）
              </span>
            </div>
          </div>
        )}

        {formError && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">生成类型</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={generationType === 'text_to_video' ? 'default' : 'outline'}
              onClick={() => setGenerationType('text_to_video')}
              className="flex items-center justify-center gap-2"
            >
              <Film className="h-4 w-4" />
              文生视频
            </Button>
            <Button
              variant={generationType === 'image_to_video' ? 'default' : 'outline'}
              onClick={() => setGenerationType('image_to_video')}
              className="flex items-center justify-center gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              图生视频
            </Button>
          </div>
        </div>

        {isImageMode && (
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              上传首帧图片 <span className="text-red-500">*</span>
            </label>
            <div className="flex min-h-[320px] md:min-h-[380px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-900/90 p-4 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              {imagePreview ? (
                <div className="relative flex w-full flex-col items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="上传的图片"
                    className="max-h-[60vh] w-full rounded-xl border border-gray-200 object-contain bg-black/60"
                  />
                  <div className="flex w-full items-center justify-between text-xs text-gray-300">
                    <span className="truncate text-left">{uploadedImage?.name}</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setUploadedImage(null);
                        setImagePreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                      移除
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 text-gray-200"
                >
                  <Upload className="h-10 w-10 text-gray-400" />
                  <span className="text-sm">点击上传图片</span>
                  <span className="text-xs text-gray-400">支持 JPEG、PNG 格式，最大 4.7MB</span>
                </label>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium">
            描述您想要的视频{' '}
            {generationType === 'text_to_video' && <span className="text-red-500">*</span>}
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              generationType === 'text_to_video'
                ? '例如：一个精美的产品在旋转展示，背景简洁，光线柔和，商业摄影风格，专业级质感'
                : '例如：产品轻微旋转，展示不同角度，光线变化，专业级质感'
            }
            className="min-h-[160px] text-base leading-relaxed"
            maxLength={PROMPT_MAX_LENGTH}
          />
          <div className="mt-1 text-right text-xs text-gray-500">
            {prompt.length}/{PROMPT_MAX_LENGTH}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">快速模板</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates((prev) => !prev)}
            >
              {showTemplates ? '隐藏' : '选择模板'}
            </Button>
          </div>
          {showTemplates && (
            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-gray-200 p-2">
              {templates
                .filter((t) => t.generation_type === generationType)
                .map((template, index) => (
                  <div
                    key={index}
                    className="cursor-pointer rounded-lg border border-transparent p-3 transition hover:border-purple-200 hover:bg-purple-50"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="mt-1 line-clamp-2 text-xs text-gray-500">{template.prompt}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium">
              <Clock className="mr-1 inline h-4 w-4" />
              视频时长
            </label>
            <Select value={frames.toString()} onValueChange={(value) => setFrames(parseInt(value, 10))}>
              <SelectTrigger>
                <SelectValue placeholder="选择时长" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="121">5 秒 · 121 帧</SelectItem>
                <SelectItem value="241">10 秒 · 241 帧</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              <Play className="mr-1 inline h-4 w-4" />
              长宽比
            </label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue placeholder="选择比例" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 · 横屏</SelectItem>
                <SelectItem value="9:16">9:16 · 竖屏</SelectItem>
                <SelectItem value="1:1">1:1 · 正方形</SelectItem>
                <SelectItem value="4:3">4:3 · 传统</SelectItem>
                <SelectItem value="3:4">3:4 · 竖屏传统</SelectItem>
                <SelectItem value="21:9">21:9 · 超宽屏</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            (generationType === 'text_to_video' && !prompt.trim()) ||
            (generationType === 'image_to_video' && !uploadedImage)
          }
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <LoadingSpinner className="mr-2" />
              正在创建任务...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              开始生成视频
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
