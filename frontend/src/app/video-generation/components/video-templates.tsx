"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VideoTemplates() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>使用说明</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
          <div>
            <strong>文生视频：</strong>输入详细的文字描述，AI将根据描述生成视频内容
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
          <div>
            <strong>图生视频：</strong>上传首帧图片，AI将基于图片生成动态视频
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
          <div>
            <strong>生成时间：</strong>通常需要 2-5 分钟，请耐心等待
          </div>
        </div>
        <div className="flex items-start">
          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
          <div>
            <strong>视频质量：</strong>支持1080P高清输出，专业级质感
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
