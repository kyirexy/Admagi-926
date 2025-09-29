"""
即梦AI-视频生成3.0 Pro API路由
支持文生视频和图生视频功能
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, List
import uuid
import asyncio
from datetime import datetime

from auth_service import get_current_user
from volcengine_video_service import volcengine_video_service, VideoGenerationRequest, VideoTaskStatus
from models_adapted import User
from ai_types import (
    TextToVideoRequest, ImageToVideoRequest, VideoGenerationResponse,
    VideoTaskStatusResponse, VideoGenerationType,
    VideoAspectRatio, VideoFrames
)

router = APIRouter(prefix="/api/video", tags=["视频生成"])

# 内存中的任务存储（生产环境应使用数据库）
video_tasks_storage = {}

@router.post("/text-to-video", response_model=VideoGenerationResponse)
async def create_text_to_video(
    request: TextToVideoRequest,
    current_user: User = Depends(get_current_user)
):
    """
    文生视频接口
    输入文本提示词生成视频
    """
    debug_id = str(uuid.uuid4())
    print(
        f"🪪 [text_to_video] 调试ID: {debug_id}",
        {
            "prompt_length": len(request.prompt or ""),
            "frames": request.frames.value,
            "aspect_ratio": request.aspect_ratio.value,
            "user": current_user.email if current_user else "anonymous"
        }
    )

    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail={"message": "用户未登录", "debug_id": debug_id})
        
        # 验证输入参数
        if not request.prompt or len(request.prompt.strip()) < 2:
            raise HTTPException(status_code=400, detail={"message": "请输入有效的描述文字", "debug_id": debug_id})
        
        # 限制输入长度
        if len(request.prompt) > 800:
            raise HTTPException(status_code=400, detail={"message": "描述文字过长，请控制在800字以内", "debug_id": debug_id})
        
        # 创建视频生成任务
        task_id = volcengine_video_service.text_to_video(
            prompt=request.prompt,
            frames=request.frames.value,
            aspect_ratio=request.aspect_ratio.value
        )
        
        # 存储任务信息
        video_tasks_storage[task_id] = {
            "user_id": current_user.id,
            "type": VideoGenerationType.TEXT_TO_VIDEO,
            "request": request.dict(),
            "created_at": datetime.now(),
            "debug_id": debug_id
        }
        
        print(f"🎬 文生视频任务创建成功: {current_user.email} - {request.prompt[:50]}... (debug_id={debug_id})")
        
        return VideoGenerationResponse(
            success=True,
            task_id=task_id,
            message="文生视频任务已创建，请稍后查询结果",
            generation_type=VideoGenerationType.TEXT_TO_VIDEO,
            prompt=request.prompt,
            frames=request.frames.value,
            aspect_ratio=request.aspect_ratio.value,
            debug_id=debug_id
        )
        
    except HTTPException as http_exc:
        print(f"⚠️ 文生视频请求校验失败 (debug_id={debug_id}): {http_exc.detail}")
        raise
    except Exception as e:
        print(f"❌ 创建文生视频任务失败 (debug_id={debug_id}): {e}")
        raise HTTPException(
            status_code=500,
            detail={"message": f"创建文生视频任务失败: {str(e)}", "debug_id": debug_id}
        )

@router.post("/image-to-video", response_model=VideoGenerationResponse)
async def create_image_to_video(
    prompt: str = Form(""),
    frames: int = Form(121),
    aspect_ratio: str = Form("16:9"),
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    图生视频接口 - 支持文件上传
    """
    debug_id = str(uuid.uuid4())
    print(
        f"🪪 [image_to_video] 调试ID: {debug_id}",
        {
            "prompt_length": len(prompt or ""),
            "frames": frames,
            "aspect_ratio": aspect_ratio,
            "filename": image.filename if image else None,
            "user": current_user.email if current_user else "anonymous"
        }
    )

    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail={"message": "用户未登录", "debug_id": debug_id})
        
        # 验证图片文件
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail={"message": "请上传图片文件", "debug_id": debug_id})
        
        # 读取图片内容并转换为base64
        image_content = await image.read()
        if len(image_content) > 4.7 * 1024 * 1024:  # 4.7MB限制
            raise HTTPException(status_code=400, detail={"message": "图片文件过大，请上传小于4.7MB的图片", "debug_id": debug_id})
        
        print(f"📸 图片上传信息: {image.filename}, 大小: {len(image_content)} bytes")
        
        import base64
        image_base64 = base64.b64encode(image_content).decode()
        
        print(f"📸 Base64编码完成，长度: {len(image_base64)} 字符")
        
        # 创建视频生成任务
        task_id = volcengine_video_service.image_to_video_base64(
            image_base64=image_base64,
            prompt=prompt,
            frames=frames,
            aspect_ratio=aspect_ratio
        )
        
        # 存储任务信息
        video_tasks_storage[task_id] = {
            "user_id": current_user.id,
            "type": VideoGenerationType.IMAGE_TO_VIDEO,
            "request": {
                "prompt": prompt,
                "frames": frames,
                "aspect_ratio": aspect_ratio,
                "image_name": image.filename
            },
            "created_at": datetime.now(),
            "debug_id": debug_id
        }
        
        print(f"🎬 图生视频任务创建成功: {current_user.email} - {prompt[:50] if prompt else '无提示词'}... (debug_id={debug_id})")
        
        return VideoGenerationResponse(
            success=True,
            task_id=task_id,
            message="图生视频任务已创建，请稍后查询结果",
            generation_type=VideoGenerationType.IMAGE_TO_VIDEO,
            prompt=prompt,
            frames=frames,
            aspect_ratio=aspect_ratio,
            debug_id=debug_id
        )
        
    except HTTPException as http_exc:
        print(f"⚠️ 图生视频请求校验失败 (debug_id={debug_id}): {http_exc.detail}")
        raise
    except Exception as e:
        print(f"❌ 创建图生视频任务失败 (debug_id={debug_id}): {e}")
        raise HTTPException(
            status_code=500,
            detail={"message": f"创建图生视频任务失败: {str(e)}", "debug_id": debug_id}
        )

@router.post("/image-to-video-url", response_model=VideoGenerationResponse)
async def create_image_to_video_by_url(
    request: ImageToVideoRequest,
    image_url: str,
    current_user: User = Depends(get_current_user)
):
    """
    图生视频接口 - 通过图片URL
    """
    debug_id = str(uuid.uuid4())
    print(
        f"🪪 [image_to_video_url] 调试ID: {debug_id}",
        {
            "prompt_length": len(request.prompt or ""),
            "frames": request.frames.value,
            "aspect_ratio": request.aspect_ratio.value,
            "image_url": image_url,
            "user": current_user.email if current_user else "anonymous"
        }
    )

    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail={"message": "用户未登录", "debug_id": debug_id})
        
        # 创建视频生成任务
        task_id = volcengine_video_service.image_to_video(
            image_url=image_url,
            prompt=request.prompt,
            frames=request.frames.value,
            aspect_ratio=request.aspect_ratio.value
        )
        
        # 存储任务信息
        video_tasks_storage[task_id] = {
            "user_id": current_user.id,
            "type": VideoGenerationType.IMAGE_TO_VIDEO,
            "request": {**request.dict(), "image_url": image_url},
            "created_at": datetime.now(),
            "debug_id": debug_id
        }
        
        return VideoGenerationResponse(
            success=True,
            task_id=task_id,
            message="图生视频任务已创建，请稍后查询结果",
            generation_type=VideoGenerationType.IMAGE_TO_VIDEO,
            prompt=request.prompt,
            frames=request.frames.value,
            aspect_ratio=request.aspect_ratio.value,
            debug_id=debug_id
        )
        
    except HTTPException as http_exc:
        print(f"⚠️ 图生视频URL请求校验失败 (debug_id={debug_id}): {http_exc.detail}")
        raise
    except Exception as e:
        print(f"❌ 创建图生视频任务失败 (debug_id={debug_id}): {e}")
        raise HTTPException(
            status_code=500,
            detail={"message": f"创建图生视频任务失败: {str(e)}", "debug_id": debug_id}
        )

@router.get("/task/{task_id}", response_model=VideoTaskStatusResponse)
async def get_video_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    查询视频生成任务状态
    """
    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 检查任务是否属于当前用户
        if task_id not in video_tasks_storage:
            raise HTTPException(status_code=404, detail="任务不存在")

        task_info = video_tasks_storage[task_id]
        if task_info["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="无权访问此任务")
        debug_id = task_info.get("debug_id")

        # 查询火山引擎任务状态
        result = volcengine_video_service.get_video_task_status(task_id)

        # 计算进度
        progress = 0
        if result.status == VideoTaskStatus.IN_QUEUE:
            progress = 10
        elif result.status == VideoTaskStatus.GENERATING:
            progress = 50
        elif result.status == VideoTaskStatus.DONE:
            progress = 100

        print(
            f"📡 查询任务状态 (debug_id={debug_id}):",
            {
                "task_id": task_id,
                "status": result.status.value,
                "progress": progress,
                "error": result.error_message
            }
        )

        return VideoTaskStatusResponse(
            task_id=result.task_id,
            status=result.status.value,
            progress=progress,
            video_url=result.video_url,
            error_message=result.error_message,
            created_at=task_info["created_at"].isoformat(),
            updated_at=datetime.now().isoformat(),
            debug_id=debug_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询任务状态失败: {str(e)}")

@router.get("/tasks")
async def get_user_video_tasks(
    current_user: User = Depends(get_current_user)
):
    """
    获取用户的所有视频任务
    """
    try:
        # 验证用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 筛选当前用户的任务
        user_tasks = []
        for task_id, task_info in video_tasks_storage.items():
            if task_info["user_id"] == current_user.id:
                try:
                    # 查询最新状态
                    result = volcengine_video_service.get_video_task_status(task_id)
                    
                    # 计算进度
                    progress = 0
                    if result.status == VideoTaskStatus.IN_QUEUE:
                        progress = 10
                    elif result.status == VideoTaskStatus.GENERATING:
                        progress = 50
                    elif result.status == VideoTaskStatus.DONE:
                        progress = 100
                    
                    user_tasks.append({
                        "task_id": task_id,
                        "type": task_info["type"],
                        "status": result.status.value,
                        "progress": progress,
                        "video_url": result.video_url,
                        "created_at": task_info["created_at"].isoformat() if hasattr(task_info["created_at"], "isoformat") else task_info["created_at"],
                        "request": task_info["request"],
                        "debug_id": task_info.get("debug_id")
                    })
                except Exception:
                    # 如果查询失败，显示基本信息
                    user_tasks.append({
                        "task_id": task_id,
                        "type": task_info["type"],
                        "status": "unknown",
                        "progress": 0,
                        "video_url": None,
                        "created_at": task_info["created_at"].isoformat() if hasattr(task_info["created_at"], "isoformat") else task_info["created_at"],
                        "request": task_info["request"],
                        "debug_id": task_info.get("debug_id")
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

# 视频生成模板
@router.get("/templates")
async def get_video_templates():
    """
    获取视频生成模板
    """
    templates = {
        "text_to_video": [
            {
                "name": "商品展示",
                "prompt": "一个精美的产品在旋转展示，背景简洁，光线柔和，商业摄影风格，专业级质感",
                "category": "商业",
                "generation_type": VideoGenerationType.TEXT_TO_VIDEO,
                "frames": VideoFrames.FIVE_SECONDS,
                "aspect_ratio": VideoAspectRatio.RATIO_16_9
            },
            {
                "name": "自然风景",
                "prompt": "美丽的山水风景，云雾缭绕，阳光透过云层洒向大地，电影级画质，动态流畅",
                "category": "风景",
                "generation_type": VideoGenerationType.TEXT_TO_VIDEO,
                "frames": VideoFrames.TEN_SECONDS,
                "aspect_ratio": VideoAspectRatio.RATIO_16_9
            },
            {
                "name": "科技感",
                "prompt": "未来科技感的场景，霓虹灯光效果，赛博朋克风格，高科技元素，动态光影",
                "category": "科技",
                "generation_type": VideoGenerationType.TEXT_TO_VIDEO,
                "frames": VideoFrames.FIVE_SECONDS,
                "aspect_ratio": VideoAspectRatio.RATIO_21_9
            },
            {
                "name": "人物动作",
                "prompt": "优雅的人物动作，流畅自然的肢体语言，专业级表现力，电影质感",
                "category": "人物",
                "generation_type": VideoGenerationType.TEXT_TO_VIDEO,
                "frames": VideoFrames.FIVE_SECONDS,
                "aspect_ratio": VideoAspectRatio.RATIO_9_16
            }
        ],
        "image_to_video": [
            {
                "name": "产品动画",
                "prompt": "产品轻微旋转，展示不同角度，光线变化，专业级质感",
                "category": "产品",
                "generation_type": VideoGenerationType.IMAGE_TO_VIDEO,
                "frames": VideoFrames.FIVE_SECONDS,
                "aspect_ratio": VideoAspectRatio.RATIO_16_9
            },
            {
                "name": "人物表情",
                "prompt": "人物自然的表情变化，眨眼和微笑，生动自然",
                "category": "人物",
                "generation_type": VideoGenerationType.IMAGE_TO_VIDEO,
                "frames": VideoFrames.FIVE_SECONDS,
                "aspect_ratio": VideoAspectRatio.RATIO_1_1
            },
            {
                "name": "场景动画",
                "prompt": "背景元素轻微移动，营造生动的场景氛围，自然流畅",
                "category": "场景",
                "generation_type": VideoGenerationType.IMAGE_TO_VIDEO,
                "frames": VideoFrames.TEN_SECONDS,
                "aspect_ratio": VideoAspectRatio.RATIO_16_9
            }
        ]
    }
    
    return {
        "success": True,
        "templates": templates
    }
