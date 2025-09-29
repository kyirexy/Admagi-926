"""
AI服务类型定义
包含图片生成和视频生成的所有类型
"""

from pydantic import BaseModel
from typing import Optional, List, Literal
from enum import Enum

# ========== 图片生成类型 ==========

class Dream3Style(str, Enum):
    """极梦3.0支持的风格"""
    REALISTIC = "realistic"  # 写实风格
    ARTISTIC = "artistic"    # 艺术风格
    CARTOON = "cartoon"      # 卡通风格
    ANIME = "anime"          # 动漫风格

class Dream3Size(str, Enum):
    """极梦3.0支持的尺寸"""
    SQUARE_1024 = "1024x1024"  # 正方形
    LANDSCAPE_1024 = "1024x768"  # 横屏
    PORTRAIT_1024 = "768x1024"   # 竖屏

class Dream3ImageRequest(BaseModel):
    """极梦3.0图片生成请求"""
    prompt: str
    style: Dream3Style = Dream3Style.REALISTIC
    size: Dream3Size = Dream3Size.SQUARE_1024
    quality: Literal["standard", "hd"] = "hd"
    n: int = 1  # 生成图片数量

class Dream3ImageResponse(BaseModel):
    """极梦3.0图片生成响应"""
    success: bool
    task_id: str
    message: str
    prompt: str
    style: str
    size: str
    image_url: Optional[str] = None

# ========== 视频生成类型 ==========

class VideoAspectRatio(str, Enum):
    """视频长宽比"""
    RATIO_16_9 = "16:9"    # 1920 * 1088
    RATIO_4_3 = "4:3"      # 1664 * 1248
    RATIO_1_1 = "1:1"      # 1440 * 1440
    RATIO_3_4 = "3:4"      # 1248 * 1664
    RATIO_9_16 = "9:16"    # 1088 * 1920
    RATIO_21_9 = "21:9"    # 2176 * 928

class VideoFrames(int, Enum):
    """视频帧数"""
    FIVE_SECONDS = 121     # 5秒视频
    TEN_SECONDS = 241      # 10秒视频

class VideoGenerationType(str, Enum):
    """视频生成类型"""
    TEXT_TO_VIDEO = "text_to_video"    # 文生视频
    IMAGE_TO_VIDEO = "image_to_video"  # 图生视频

class TextToVideoRequest(BaseModel):
    """文生视频请求"""
    prompt: str
    frames: VideoFrames = VideoFrames.FIVE_SECONDS
    aspect_ratio: VideoAspectRatio = VideoAspectRatio.RATIO_16_9
    seed: int = -1

class ImageToVideoRequest(BaseModel):
    """图生视频请求"""
    prompt: str = ""
    frames: VideoFrames = VideoFrames.FIVE_SECONDS
    aspect_ratio: VideoAspectRatio = VideoAspectRatio.RATIO_16_9
    seed: int = -1

class VideoGenerationResponse(BaseModel):
    """视频生成响应"""
    success: bool
    task_id: str
    message: str
    generation_type: VideoGenerationType
    prompt: str
    frames: int
    aspect_ratio: str
    debug_id: Optional[str] = None

class VideoTaskStatusResponse(BaseModel):
    """视频任务状态响应"""
    task_id: str
    status: str  # in_queue, generating, done, not_found, expired
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    progress: int = 0  # 进度百分比
    debug_id: Optional[str] = None

# ========== 通用类型 ==========

class TaskStatusResponse(BaseModel):
    """任务状态响应"""
    task_id: str
    status: str
    progress: int
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    debug_id: Optional[str] = None
