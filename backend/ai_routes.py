"""
AI功能路由 - 图生视频、解说视频、AI图片生成
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import uuid
import asyncio
from datetime import datetime

from auth_service import get_current_user
from volcengine_service import volcengine_service, VideoGenerationRequest, TaskStatus
from models_adapted import User
from ai_types import Dream3ImageRequest, Dream3ImageResponse

router = APIRouter(prefix="/api/ai", tags=["AI功能"])

# 请求模型
class TextToVideoRequest(BaseModel):
    prompt: str
    duration: int = 5
    resolution: str = "720p"
    ratio: str = "16:9"

class ImageToVideoRequest(BaseModel):
    prompt: Optional[str] = ""
    duration: int = 5
    resolution: str = "720p"
    ratio: str = "16:9"

# Dream3ImageRequest 已从 dream_3_types 导入

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: int
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# 内存中的任务存储（生产环境应使用数据库）
tasks_storage = {}

@router.post("/text-to-video")
async def create_text_to_video(
    request: TextToVideoRequest,
    current_user: User = Depends(get_current_user)
):
    """
    文生视频接口
    """
    try:
        # 验证用户权限（可以添加积分检查等）
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 创建视频生成任务
        task_id = volcengine_service.text_to_video(
            prompt=request.prompt,
            duration=request.duration,
            resolution=request.resolution
        )
        
        # 存储任务信息
        tasks_storage[task_id] = {
            "user_id": current_user.id,
            "type": "text_to_video",
            "request": request.dict(),
            "created_at": datetime.now()
        }
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "视频生成任务已创建，请稍后查询结果"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建任务失败: {str(e)}")

@router.post("/image-to-video")
async def create_image_to_video(
    prompt: str = Form(""),
    duration: int = Form(5),
    resolution: str = Form("720p"),
    ratio: str = Form("16:9"),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    图生视频接口 - 支持文件上传
    """
    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 验证图片文件
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="请上传图片文件")
        
        # 读取图片内容并转换为base64
        image_content = await image.read()
        if len(image_content) > 30 * 1024 * 1024:  # 30MB限制
            raise HTTPException(status_code=400, detail="图片文件过大，请上传小于30MB的图片")
        
        import base64
        image_base64 = f"data:{image.content_type};base64,{base64.b64encode(image_content).decode()}"
        
        # 创建视频生成任务
        task_id = volcengine_service.image_to_video(
            image_url=image_base64,
            prompt=prompt,
            duration=duration
        )
        
        # 存储任务信息
        tasks_storage[task_id] = {
            "user_id": current_user.id,
            "type": "image_to_video",
            "request": {
                "prompt": prompt,
                "duration": duration,
                "resolution": resolution,
                "ratio": ratio,
                "image_name": image.filename
            },
            "created_at": datetime.now()
        }
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "图生视频任务已创建，请稍后查询结果"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建任务失败: {str(e)}")

@router.post("/image-to-video-url")
async def create_image_to_video_by_url(
    request: ImageToVideoRequest,
    image_url: str,
    current_user: User = Depends(get_current_user)
):
    """
    图生视频接口 - 通过图片URL
    """
    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 验证图片URL
        if not volcengine_service.validate_image(image_url):
            raise HTTPException(status_code=400, detail="无效的图片URL或图片格式不支持")
        
        # 创建视频生成任务
        task_id = volcengine_service.image_to_video(
            image_url=image_url,
            prompt=request.prompt,
            duration=request.duration
        )
        
        # 存储任务信息
        tasks_storage[task_id] = {
            "user_id": current_user.id,
            "type": "image_to_video_url",
            "request": {**request.dict(), "image_url": image_url},
            "created_at": datetime.now()
        }
        
        return {
            "success": True,
            "task_id": task_id,
            "message": "图生视频任务已创建，请稍后查询结果"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建任务失败: {str(e)}")

@router.post("/dream-3-image", response_model=Dream3ImageResponse)
async def create_dream_3_image(
    request: Dream3ImageRequest,
    current_user: User = Depends(get_current_user)
):
    """
    极梦3.0图片生成接口
    用户输入"喵"字段，生成高质量图片
    """
    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 验证输入参数
        if not request.prompt or len(request.prompt.strip()) < 2:
            raise HTTPException(status_code=400, detail="请输入有效的描述文字")
        
        # 限制输入长度
        if len(request.prompt) > 500:
            raise HTTPException(status_code=400, detail="描述文字过长，请控制在500字以内")
        
        # 创建图片生成任务
        task_id = volcengine_service.dream_3_0_image_generation(
            prompt=request.prompt,
            style=request.style,
            size=request.size
        )
        
        # 存储任务信息
        tasks_storage[task_id] = {
            "user_id": current_user.id,
            "type": "dream_3_image",
            "request": request.dict(),
            "created_at": datetime.now()
        }
        
        print(f"🎨 极梦3.0图片生成任务创建: {current_user.email} - {request.prompt[:50]}...")
        
        return Dream3ImageResponse(
            success=True,
            task_id=task_id,
            message="极梦3.0图片生成任务已创建，请稍后查询结果",
            prompt=request.prompt,
            style=request.style.value,
            size=request.size.value
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建图片生成任务失败: {str(e)}")

@router.get("/task/{task_id}")
async def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    查询任务状态
    """
    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 检查任务是否属于当前用户
        if task_id not in tasks_storage:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        task_info = tasks_storage[task_id]
        if task_info["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="无权访问此任务")
        
        # 查询火山引擎任务状态
        if task_info["type"] == "dream_3_image":
            result = volcengine_service.get_dream_3_image_status(task_id)
        else:
            result = volcengine_service.get_task_status(task_id)
        
        return TaskStatusResponse(
            task_id=result.task_id,
            status=result.status.value,
            progress=result.progress,
            video_url=result.video_url,
            error_message=result.error_message,
            created_at=task_info["created_at"],
            updated_at=datetime.fromtimestamp(result.updated_at) if result.updated_at else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询任务状态失败: {str(e)}")

@router.get("/tasks")
async def get_user_tasks(
    current_user: User = Depends(get_current_user)
):
    """
    获取用户的所有任务
    """
    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 筛选当前用户的任务
        user_tasks = []
        for task_id, task_info in tasks_storage.items():
            if task_info["user_id"] == current_user.id:
                try:
                    # 查询最新状态
                    result = volcengine_service.get_task_status(task_id)
                    user_tasks.append({
                        "task_id": task_id,
                        "type": task_info["type"],
                        "status": result.status.value,
                        "progress": result.progress,
                        "video_url": result.video_url,
                        "created_at": task_info["created_at"],
                        "request": task_info["request"]
                    })
                except Exception:
                    # 如果查询失败，显示基本信息
                    user_tasks.append({
                        "task_id": task_id,
                        "type": task_info["type"],
                        "status": "unknown",
                        "progress": 0,
                        "video_url": None,
                        "created_at": task_info["created_at"],
                        "request": task_info["request"]
                    })
        
        # 按创建时间倒序排列
        user_tasks.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "success": True,
            "tasks": user_tasks,
            "total": len(user_tasks)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取任务列表失败: {str(e)}")

# 预设的提示词模板
@router.get("/prompts/templates")
async def get_prompt_templates():
    """
    获取提示词模板
    """
    templates = {
        "text_to_video": [
            {
                "name": "商品展示",
                "prompt": "一个精美的产品在旋转展示，背景简洁，光线柔和，商业摄影风格",
                "category": "商业"
            },
            {
                "name": "自然风景",
                "prompt": "美丽的山水风景，云雾缭绕，阳光透过云层洒向大地，电影级画质",
                "category": "风景"
            },
            {
                "name": "科技感",
                "prompt": "未来科技感的场景，霓虹灯光效果，赛博朋克风格，高科技元素",
                "category": "科技"
            }
        ],
        "image_to_video": [
            {
                "name": "人物动作",
                "prompt": "人物自然地眨眼和微笑，表情生动自然",
                "category": "人物"
            },
            {
                "name": "物体运动",
                "prompt": "物体轻微摆动，增加动态效果",
                "category": "物体"
            },
            {
                "name": "场景动画",
                "prompt": "背景元素轻微移动，营造生动的场景氛围",
                "category": "场景"
            }
        ],
        "dream_3_image": [
            {
                "name": "可爱猫咪",
                "prompt": "一只可爱的橘色小猫，毛茸茸的，大眼睛，坐在窗台上，阳光洒在身上，超高清，细节丰富",
                "category": "动物",
                "style": "realistic"
            },
            {
                "name": "梦幻风景",
                "prompt": "梦幻般的森林，阳光透过树叶洒下，有精灵般的光点飞舞，仙境般的氛围，艺术风格",
                "category": "风景",
                "style": "artistic"
            },
            {
                "name": "未来城市",
                "prompt": "未来主义城市景观，高楼大厦，霓虹灯闪烁，飞行汽车穿梭，赛博朋克风格，科技感十足",
                "category": "科幻",
                "style": "artistic"
            },
            {
                "name": "美食摄影",
                "prompt": "精美的蛋糕，奶油装饰，草莓点缀，专业美食摄影，光线柔和，诱人的色彩",
                "category": "美食",
                "style": "realistic"
            },
            {
                "name": "动漫风格",
                "prompt": "二次元风格的少女，长发飘逸，穿着可爱的服装，背景是樱花飞舞的校园，动漫风格",
                "category": "人物",
                "style": "anime"
            },
            {
                "name": "卡通角色",
                "prompt": "可爱的卡通小熊，圆润的造型，温暖的微笑，适合儿童插画，卡通风格",
                "category": "卡通",
                "style": "cartoon"
            }
        ]
    }
    
    return {
        "success": True,
        "templates": templates
    }