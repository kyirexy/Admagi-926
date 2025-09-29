"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/auth-provider";
import { 
  Upload, 
  Video, 
  Image, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Play
} from "lucide-react";
import { aiClient, Task } from "@/lib/ai-client";

export default function AIPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // 状态管理
  const [activeTab, setActiveTab] = useState("text-to-video");
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // 文生视频状态
  const [textPrompt, setTextPrompt] = useState("");
  const [textDuration, setTextDuration] = useState("5");
  const [textResolution, setTextResolution] = useState("720p");
  
  // 图生视频状态
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageDuration, setImageDuration] = useState("5");
  const [imageResolution, setImageResolution] = useState("720p");
  
  // 预设提示词
  const promptTemplates = {
    "text-to-video": [
      { name: "商品展示", prompt: "一个精美的产品在旋转展示，背景简洁，光线柔和，商业摄影风格" },
      { name: "自然风景", prompt: "美丽的山水风景，云雾缭绕，阳光透过云层洒向大地，电影级画质" },
      { name: "科技感", prompt: "未来科技感的场景，霓虹灯光效果，赛博朋克风格，高科技元素" }
    ],
    "image-to-video": [
      { name: "人物动作", prompt: "人物自然地眨眼和微笑，表情生动自然" },
      { name: "物体运动", prompt: "物体轻微摆动，增加动态效果" },
      { name: "场景动画", prompt: "背景元素轻微移动，营造生动的场景氛围" }
    ]
  };

  // 文生视频提交
  const handleTextToVideo = async () => {
    if (!textPrompt.trim()) {
      toast({
        title: "错误",
        description: "请输入视频描述",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiClient.textToVideo({
        prompt: textPrompt,
        duration: parseInt(textDuration),
        resolution: textResolution
      });
      
      if (result.success) {
        toast({
          title: "成功",
          description: "视频生成任务已创建，请稍后查看结果"
        });
        
        // 清空表单
        setTextPrompt("");
        
        // 刷新任务列表
        fetchTasks();
      } else {
        throw new Error(result.error || "创建任务失败");
      }
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "创建任务失败",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 图生视频提交
  const handleImageToVideo = async () => {
    if (!imageFile) {
      toast({
        title: "错误",
        description: "请选择图片文件",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiClient.imageToVideo(imageFile, {
        prompt: imagePrompt,
        duration: parseInt(imageDuration),
        resolution: imageResolution
      });
      
      if (result.success) {
        toast({
          title: "成功",
          description: "图生视频任务已创建，请稍后查看结果"
        });
        
        // 清空表单
        setImageFile(null);
        setImagePrompt("");
        
        // 刷新任务列表
        fetchTasks();
      } else {
        throw new Error(result.error || "创建任务失败");
      }
    } catch (error) {
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "创建任务失败",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const result = await aiClient.getTasks();
      if (result.success && result.data) {
        setTasks(result.data.tasks);
      }
    } catch (error) {
      console.error("获取任务列表失败:", error);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "failed":
        return "失败";
      case "processing":
        return "处理中";
      case "pending":
        return "等待中";
      default:
        return "未知";
    }
  };

  // 组件加载时获取任务列表
  React.useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">请先登录以使用AI功能</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI创作工具</h1>
        <p className="text-muted-foreground">
          使用极梦3.0模型进行视频生成和AI图片创作
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：创作工具 */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text-to-video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                文生视频
              </TabsTrigger>
              <TabsTrigger value="image-to-video" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                图生视频
              </TabsTrigger>
            </TabsList>

            {/* 文生视频 */}
            <TabsContent value="text-to-video">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    文生视频
                  </CardTitle>
                  <CardDescription>
                    通过文字描述生成精美的视频内容
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="text-prompt">视频描述</Label>
                    <Textarea
                      id="text-prompt"
                      placeholder="描述你想要生成的视频内容..."
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* 预设提示词 */}
                  <div>
                    <Label>快速选择</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {promptTemplates["text-to-video"].map((template, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => setTextPrompt(template.prompt)}
                        >
                          {template.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="text-duration">时长（秒）</Label>
                      <Select value={textDuration} onValueChange={setTextDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3秒</SelectItem>
                          <SelectItem value="5">5秒</SelectItem>
                          <SelectItem value="10">10秒</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="text-resolution">分辨率</Label>
                      <Select value={textResolution} onValueChange={setTextResolution}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p</SelectItem>
                          <SelectItem value="1080p">1080p</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleTextToVideo} 
                    disabled={isLoading || !textPrompt.trim()}
                    className="w-full"
                  >
                    {isLoading ? "生成中..." : "生成视频"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 图生视频 */}
            <TabsContent value="image-to-video">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    图生视频
                  </CardTitle>
                  <CardDescription>
                    上传图片，生成动态视频效果
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="image-upload">选择图片</Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    {imageFile && (
                      <p className="text-sm text-muted-foreground mt-1">
                        已选择: {imageFile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="image-prompt">动画描述（可选）</Label>
                    <Textarea
                      id="image-prompt"
                      placeholder="描述你希望图片如何动起来..."
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* 预设提示词 */}
                  <div>
                    <Label>动画效果</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {promptTemplates["image-to-video"].map((template, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => setImagePrompt(template.prompt)}
                        >
                          {template.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="image-duration">时长（秒）</Label>
                      <Select value={imageDuration} onValueChange={setImageDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3秒</SelectItem>
                          <SelectItem value="5">5秒</SelectItem>
                          <SelectItem value="10">10秒</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="image-resolution">分辨率</Label>
                      <Select value={imageResolution} onValueChange={setImageResolution}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p</SelectItem>
                          <SelectItem value="1080p">1080p</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleImageToVideo} 
                    disabled={isLoading || !imageFile}
                    className="w-full"
                  >
                    {isLoading ? "生成中..." : "生成视频"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 右侧：任务列表 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>我的任务</span>
                <Button variant="outline" size="sm" onClick={fetchTasks}>
                  刷新
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  暂无任务
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.task_id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          <span className="text-sm font-medium">
                            {task.type === "text_to_video" ? "文生视频" : "图生视频"}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {getStatusText(task.status)}
                        </Badge>
                      </div>
                      
                      {task.status === "processing" && (
                        <Progress value={task.progress} className="mb-2" />
                      )}
                      
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(task.created_at).toLocaleString()}
                      </p>
                      
                      {task.video_url && (
                        <Button size="sm" variant="outline" className="w-full">
                          <Play className="h-3 w-3 mr-1" />
                          查看视频
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}