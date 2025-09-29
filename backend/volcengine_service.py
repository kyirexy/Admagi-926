"""
火山引擎极梦3.0 API调用服务
支持图生视频、文生视频、AI图片生成等功能
"""

import os
import json
import time
import base64
import requests
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

class TaskStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing" 
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class VideoGenerationRequest:
    """视频生成请求参数"""
    model: str  # doubao-seedance-pro, doubao-seedance-1-0-lite-i2v, wan2-1-14b-i2v
    prompt: str  # 文本提示词
    image_url: Optional[str] = None  # 图片URL或base64
    image_role: Optional[str] = None  # first_frame, last_frame, reference_image
    duration: int = 5  # 视频时长(秒)
    resolution: str = "720p"  # 分辨率
    ratio: str = "16:9"  # 宽高比
    fps: int = 24  # 帧率

@dataclass
class TaskResult:
    """任务结果"""
    task_id: str
    status: TaskStatus
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    progress: int = 0
    created_at: Optional[int] = None
    updated_at: Optional[int] = None

class VolcengineService:
    """火山引擎API服务类"""
    
    def __init__(self):
        # 从环境变量获取API配置
        self.api_key = os.getenv("VOLCENGINE_API_KEY", "")
        self.base_url = "https://ark.cn-beijing.volces.com/api/v3"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    def create_video_generation_task(self, request: VideoGenerationRequest) -> str:
        """
        创建视频生成任务
        返回任务ID
        """
        url = f"{self.base_url}/contents/generations/tasks"
        
        # 构建请求内容
        content = []
        
        # 添加文本内容
        content.append({
            "type": "text",
            "text": request.prompt
        })
        
        # 添加图片内容（如果有）
        if request.image_url:
            image_content = {
                "type": "image_url",
                "image_url": {
                    "url": request.image_url
                }
            }
            if request.image_role:
                image_content["role"] = request.image_role
            content.append(image_content)
        
        # 构建请求体
        payload = {
            "model": request.model,
            "content": content
        }
        
        # 添加可选参数到文本提示词中
        if request.duration != 5 or request.resolution != "720p" or request.ratio != "16:9":
            params = []
            if request.duration != 5:
                params.append(f"duration:{request.duration}s")
            if request.resolution != "720p":
                params.append(f"resolution:{request.resolution}")
            if request.ratio != "16:9":
                params.append(f"ratio:{request.ratio}")
            
            if params:
                payload["content"][0]["text"] += f" --{' '.join(params)}"
        
        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            return result.get("id", "")
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"创建视频生成任务失败: {str(e)}")
    
    def get_task_status(self, task_id: str) -> TaskResult:
        """
        查询任务状态
        """
        url = f"{self.base_url}/contents/generations/tasks/{task_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            # 解析任务状态
            status_map = {
                "pending": TaskStatus.PENDING,
                "processing": TaskStatus.PROCESSING,
                "succeeded": TaskStatus.COMPLETED,
                "failed": TaskStatus.FAILED
            }
            
            status = status_map.get(result.get("status", "pending"), TaskStatus.PENDING)
            
            task_result = TaskResult(
                task_id=task_id,
                status=status,
                created_at=result.get("created_at"),
                updated_at=result.get("updated_at")
            )
            
            # 如果任务完成，获取视频URL
            if status == TaskStatus.COMPLETED and "content" in result:
                task_result.video_url = result["content"].get("video_url")
            
            # 如果任务失败，获取错误信息
            if status == TaskStatus.FAILED:
                task_result.error_message = result.get("error", {}).get("message", "未知错误")
            
            return task_result
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"查询任务状态失败: {str(e)}")
    
    def text_to_video(self, prompt: str, duration: int = 5, resolution: str = "720p") -> str:
        """
        文生视频 - 简化接口
        """
        request = VideoGenerationRequest(
            model="doubao-seedance-pro",
            prompt=prompt,
            duration=duration,
            resolution=resolution
        )
        return self.create_video_generation_task(request)
    
    def dream_3_0_image_generation(self, prompt: str, style: str = "realistic", size: str = "1024x1024") -> str:
        """
        极梦3.0图片生成 - 专门的图片生成接口
        """
        url = f"{self.base_url}/images/generations"
        
        # 构建请求体 - 极梦3.0图片生成专用格式
        payload = {
            "model": "dream-3.0",  # 极梦3.0模型
            "prompt": prompt,
            "style": style,
            "size": size,
            "quality": "hd",
            "n": 1  # 生成1张图片
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            # 极梦3.0返回的是图片URL，我们创建一个模拟任务ID
            task_id = f"dream3_{int(time.time())}_{result.get('id', 'unknown')}"
            
            # 存储结果到内存中（生产环境应使用数据库）
            if not hasattr(self, '_image_results'):
                self._image_results = {}
            
            self._image_results[task_id] = {
                "status": "completed",
                "image_url": result.get("data", [{}])[0].get("url"),
                "created_at": int(time.time()),
                "updated_at": int(time.time())
            }
            
            return task_id
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"极梦3.0图片生成失败: {str(e)}")
    
    def get_dream_3_image_status(self, task_id: str) -> TaskResult:
        """
        获取极梦3.0图片生成状态
        """
        if not hasattr(self, '_image_results'):
            self._image_results = {}
        
        if task_id not in self._image_results:
            return TaskResult(
                task_id=task_id,
                status=TaskStatus.FAILED,
                error_message="任务不存在"
            )
        
        result = self._image_results[task_id]
        return TaskResult(
            task_id=task_id,
            status=TaskStatus.COMPLETED if result["status"] == "completed" else TaskStatus.PROCESSING,
            video_url=result.get("image_url"),  # 复用video_url字段存储图片URL
            created_at=result.get("created_at"),
            updated_at=result.get("updated_at")
        )
    
    def image_to_video(self, image_url: str, prompt: str = "", duration: int = 5) -> str:
        """
        图生视频 - 简化接口
        """
        request = VideoGenerationRequest(
            model="doubao-seedance-1-0-lite-i2v",
            prompt=prompt,
            image_url=image_url,
            image_role="first_frame",
            duration=duration
        )
        return self.create_video_generation_task(request)
    
    def validate_image(self, image_data: str) -> bool:
        """
        验证图片格式和大小
        """
        try:
            # 如果是base64编码
            if image_data.startswith('data:image/'):
                header, encoded = image_data.split(',', 1)
                image_bytes = base64.b64decode(encoded)
            else:
                # 如果是URL，尝试下载验证
                response = requests.head(image_data, timeout=10)
                response.raise_for_status()
                return True
            
            # 检查文件大小 (30MB限制)
            if len(image_bytes) > 30 * 1024 * 1024:
                return False
            
            return True
            
        except Exception:
            return False

# 全局服务实例
volcengine_service = VolcengineService()