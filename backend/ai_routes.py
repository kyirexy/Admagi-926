"""
AI功能路由 - 文本转视频、图生视频、即梦3.0图片生成、创意画布
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid
import asyncio
from datetime import datetime

from auth_service import get_current_user
from volcengine_service import volcengine_service, VideoGenerationRequest, TaskStatus
from models_adapted import User
from ai_types import (
    Dream3ImageRequest,
    Dream3ImageResponse,
    CreativeBoardSaveRequest,
    CreativeBoardDraft,
    CreativeBoardGenerateRequest,
    CreativeBoardGenerateResponse,
    CreativeBoardGenerationStatusResponse,
    GenerationStatus,
    CreativeBoardSnapshot,
    GeneratedImagePreview,
    CreativeBoardWorkflowRunRequest,
    CreativeBoardWorkflowRunOptions,
    WorkflowExecutionState,
    WorkflowExecutionListItem,
    WorkflowRecomputeRequest,
)
from workflow_engine import workflow_engine, WorkflowExecutionError, WorkflowValidationError

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

# Dream3ImageRequest 已从 ai_types 导入

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

creative_board_drafts: Dict[str, CreativeBoardDraft] = {}
creative_board_generations: Dict[str, GeneratedImagePreview] = {}
creative_board_task_index: Dict[str, str] = {}
creative_board_workflow_board_index: Dict[str, str] = {}
creative_board_workflow_owner_index: Dict[str, str] = {}
creative_board_task_to_workflow: Dict[str, str] = {}


def _current_user_id(user: User) -> str:
    if not user or not getattr(user, "id", None):
        raise HTTPException(status_code=401, detail="用户未登录")
    return str(user.id)


def _get_draft_for_user(board_id: str, user_id: str) -> CreativeBoardDraft:
    draft = creative_board_drafts.get(board_id)
    if not draft:
        raise HTTPException(status_code=404, detail="创意画布不存在")
    if draft.owner_id and draft.owner_id != user_id:
        raise HTTPException(status_code=403, detail="无权访问此创意画布")
    return draft


def _assert_workflow_access(workflow_id: str, user_id: str) -> None:
    owner_id = creative_board_workflow_owner_index.get(workflow_id)
    if owner_id is None:
        raise HTTPException(status_code=404, detail="工作流不存在")
    if owner_id != user_id:
        raise HTTPException(status_code=403, detail="无权访问该工作流")


def _register_workflow(execution, owner_id: str) -> WorkflowExecutionState:
    creative_board_workflow_owner_index[execution.workflow_id] = owner_id
    creative_board_workflow_board_index[execution.workflow_id] = execution.board_id
    return execution.snapshot_state()


def _build_board_prompt(
    snapshot: CreativeBoardSnapshot,
    extra_prompt: Optional[str] = None,
    focus_connection_ids: Optional[List[str]] = None,
) -> str:
    image_descriptions: List[str] = []
    connection_descriptions: List[str] = []
    image_labels: Dict[str, str] = {}

    for index, image in enumerate(snapshot.images):
        label = image.description or image.caption or image.name or f"图像{index + 1}"
        image_labels[image.id] = label
        position = getattr(image.bounds, "position", None)
        size = getattr(image.bounds, "size", None)
        if position and size:
            description = (
                f"{label} 位置({int(position.x)}, {int(position.y)}), 尺寸 {int(size.width)}x{int(size.height)} 像素"
            )
        else:
            description = label
        image_descriptions.append(description)

    highlighted = set(focus_connection_ids or [])
    for connection in snapshot.connections:
        if highlighted and connection.id not in highlighted:
            continue
        source_label = image_labels.get(connection.source.image_id, connection.source.image_id)
        target_label = image_labels.get(connection.target.image_id, connection.target.image_id)
        if connection.label and connection.label.text and connection.label.text.strip():
            connection_descriptions.append(connection.label.text.strip())
        else:
            connection_descriptions.append(f"连接 {source_label} 和 {target_label}")

    prompt_parts: List[str] = [
        "请根据以下元素组合生成一张具有统一风格的合成图："
    ]
    if image_descriptions:
        prompt_parts.append("画面元素: " + "; ".join(image_descriptions))
    if connection_descriptions:
        prompt_parts.append("关系描述: " + "; ".join(connection_descriptions))
    if extra_prompt:
        prompt_parts.append(f"额外提示: {extra_prompt.strip()}")

    return " ".join(part for part in prompt_parts if part).strip()


def _derive_preview_title(request_title: Optional[str], snapshot: CreativeBoardSnapshot) -> str:
    if request_title and request_title.strip():
        base = request_title.strip()
    else:
        base = None
        for connection in snapshot.connections:
            if connection.label and connection.label.text and connection.label.text.strip():
                base = connection.label.text.strip()
                break
        if not base and snapshot.images:
            first_image = snapshot.images[0]
            base = first_image.caption or first_image.description or first_image.name
        if not base:
            base = "创意合成"
    return base


def _default_board_name(snapshot: CreativeBoardSnapshot) -> str:
    if snapshot.connections:
        for connection in snapshot.connections:
            if connection.label and connection.label.text.strip():
                return f"创意合成：{connection.label.text.strip()}"
    if snapshot.images:
        first_image = snapshot.images[0]
        fallback = first_image.caption or first_image.description or first_image.name
        if fallback:
            return f"创意合成：{fallback}"
    return "创意合成作品"

@router.post("/text-to-video")
async def create_text_to_video(
    request: TextToVideoRequest,
    current_user: User = Depends(get_current_user)
):
    """
    文本生成视频接口
    """
    try:
        # 楠岃瘉鐢ㄦ埛鏉冮檺锛堝彲浠ユ坊鍔犵Н鍒嗘鏌ョ瓑锛?
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
        # 校验用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 校验图片文件
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="请上传图片文件")
        
        # 读取图片内容并转为base64
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
        # 校验用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 校验图片URL
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
    即梦3.0图片生成接口
    用户输入「提示词」生成高质量图片
    """
    try:
        # 校验用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 校验输入参数
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
        
        print(f"🖼️ 即梦3.0图片生成任务创建: {current_user.email} - {request.prompt[:50]}...")
        
        return Dream3ImageResponse(
            success=True,
            task_id=task_id,
            message="即梦3.0图片生成任务已创建，请稍后查询结果",
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
        # 校验用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 检查任务是否属于当前用户
        if task_id not in tasks_storage:
            raise HTTPException(status_code=404, detail="任务不存在")
        
        task_info = tasks_storage[task_id]
        if task_info["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="无权访问该任务")
        
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
    获取当前用户的所有任务
    """
    try:
        # 校验用户权限
        if not current_user:
            raise HTTPException(status_code=401, detail="用户未登录")
        
        # 过滤当前用户的任务
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
                    # 查询失败时展示基础信息
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



@router.post("/creative-board/drafts", response_model=CreativeBoardDraft)
async def save_creative_board_draft(
    request: CreativeBoardSaveRequest,
    current_user: User = Depends(get_current_user)
):
    user_id = _current_user_id(current_user)
    now = datetime.now()
    board_id = request.board_id or str(uuid.uuid4())
    existing = creative_board_drafts.get(board_id)

    if existing and existing.owner_id and existing.owner_id != user_id:
        raise HTTPException(status_code=403, detail="无权访问此创意画布")

    name = (request.name or "").strip() or (existing.name if existing else _default_board_name(request.snapshot))
    notes = request.notes if request.notes is not None else (existing.notes if existing else None)
    generations = list(existing.generations) if existing else []
    created_at = existing.created_at if existing else now

    draft = CreativeBoardDraft(
        board_id=board_id,
        owner_id=user_id,
        name=name,
        notes=notes,
        snapshot=request.snapshot,
        generations=generations,
        created_at=created_at,
        updated_at=now,
    )
    creative_board_drafts[board_id] = draft
    return draft


@router.get("/creative-board/drafts", response_model=List[CreativeBoardDraft])
async def list_creative_board_drafts(
    current_user: User = Depends(get_current_user)
):
    user_id = _current_user_id(current_user)
    drafts = [draft for draft in creative_board_drafts.values() if draft.owner_id == user_id]
    drafts.sort(key=lambda item: item.updated_at, reverse=True)
    return drafts


@router.get("/creative-board/drafts/{board_id}", response_model=CreativeBoardDraft)
async def get_creative_board_draft(
    board_id: str,
    current_user: User = Depends(get_current_user)
):
    user_id = _current_user_id(current_user)
    draft = _get_draft_for_user(board_id, user_id)
    if not draft.owner_id:
        draft = draft.copy(update={"owner_id": user_id})
        creative_board_drafts[board_id] = draft
    return draft


@router.post("/creative-board/generate", response_model=CreativeBoardGenerateResponse)
async def generate_creative_board_image(
    request: CreativeBoardGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    user_id = _current_user_id(current_user)
    board_id = request.board_id or str(uuid.uuid4())
    existing = creative_board_drafts.get(board_id)

    if existing and existing.owner_id and existing.owner_id != user_id:
        raise HTTPException(status_code=403, detail="无权访问此创意画布")

    snapshot = request.snapshot or (existing.snapshot if existing else None)
    if not snapshot:
        raise HTTPException(status_code=400, detail="请先提供画布状态数据")

    now = datetime.now()
    options_metadata = {
        "style": request.style.value,
        "size": request.size.value,
        "quality": request.quality,
    }
    if request.extra_prompt:
        options_metadata["extra_prompt"] = request.extra_prompt.strip()
    if request.focus_connection_ids:
        options_metadata["focus_connection_ids"] = request.focus_connection_ids

    workflow_options = CreativeBoardWorkflowRunOptions(
        use_llm=bool(request.focus_connection_ids),
        greedy_cache=True,
        focus_node_ids=request.focus_connection_ids,
        priority="normal",
        metadata=options_metadata,
    )

    try:
        execution = await workflow_engine.start_workflow(
            board_id=board_id,
            snapshot=snapshot,
            options=workflow_options,
            owner_id=user_id,
        )
    except WorkflowValidationError as exc:
        raise HTTPException(status_code=400, detail=f"工作流解析失败: {str(exc)}")
    except WorkflowExecutionError as exc:
        raise HTTPException(status_code=500, detail=f"工作流执行失败: {str(exc)}")

    workflow_state = _register_workflow(execution, user_id)

    prompt = execution.final_prompt or _build_board_prompt(
        snapshot,
        None,
        request.focus_connection_ids,
    )
    if request.extra_prompt and request.extra_prompt.strip():
        extra_prompt = request.extra_prompt.strip()
        prompt = f"{prompt} {extra_prompt}".strip() if prompt else extra_prompt

    if not prompt:
        raise HTTPException(status_code=400, detail="画布内容不足以生成合成图")

    try:
        task_id = volcengine_service.dream_3_0_image_generation(
            prompt=prompt,
            style=request.style.value,
            size=request.size.value,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"创意画布生成失败: {str(exc)}")

    workflow_engine.attach_task(execution.workflow_id, task_id)
    creative_board_task_to_workflow[task_id] = execution.workflow_id

    preview_title = request.title or _default_board_name(snapshot)
    preview = GeneratedImagePreview(
        preview_id=str(uuid.uuid4()),
        task_id=task_id,
        workflow_id=execution.workflow_id,
        title=preview_title,
        prompt=prompt,
        status=GenerationStatus.PENDING,
        image_url=None,
        error_message=None,
        created_at=now,
        updated_at=now,
    )

    generations = [preview]
    if existing:
        generations.extend(item for item in existing.generations if item.task_id != task_id)
        created_at = existing.created_at
        board_name = existing.name
        notes = existing.notes
    else:
        created_at = now
        board_name = preview_title
        notes = None

    draft = CreativeBoardDraft(
        board_id=board_id,
        owner_id=user_id,
        name=board_name,
        notes=notes,
        snapshot=snapshot,
        generations=generations,
        created_at=created_at,
        updated_at=now,
    )

    creative_board_drafts[board_id] = draft
    creative_board_generations[task_id] = preview
    creative_board_task_index[task_id] = board_id

    tasks_storage[task_id] = {
        "user_id": current_user.id,
        "type": "creative_board_image",
        "request": {
            "board_id": board_id,
            "prompt": prompt,
            "style": request.style.value,
            "size": request.size.value,
        },
        "created_at": now,
        "workflow_id": execution.workflow_id,
    }

    return CreativeBoardGenerateResponse(
        board_id=board_id,
        task_id=task_id,
        status=GenerationStatus.PENDING,
        prompt=prompt,
        preview=preview,
        next_poll_seconds=3,
        workflow_id=execution.workflow_id,
        workflow_state=workflow_state,
    )





@router.post("/creative-board/workflows/run", response_model=WorkflowExecutionState)
async def run_creative_board_workflow(
    request: CreativeBoardWorkflowRunRequest,
    current_user: User = Depends(get_current_user)
):
    user_id = _current_user_id(current_user)
    board_id = request.board_id or str(uuid.uuid4())

    try:
        execution = await workflow_engine.start_workflow(
            board_id=board_id,
            snapshot=request.snapshot,
            options=request.options,
            owner_id=user_id,
        )
    except WorkflowValidationError as exc:
        raise HTTPException(status_code=400, detail=f"工作流解析失败: {str(exc)}")
    except WorkflowExecutionError as exc:
        raise HTTPException(status_code=500, detail=f"工作流执行失败: {str(exc)}")

    return _register_workflow(execution, user_id)


@router.get("/creative-board/workflows/{workflow_id}", response_model=WorkflowExecutionState)
async def get_creative_board_workflow_state(
    workflow_id: str,
    current_user: User = Depends(get_current_user)
):
    user_id = _current_user_id(current_user)
    _assert_workflow_access(workflow_id, user_id)
    try:
        return workflow_engine.get_state(workflow_id)
    except WorkflowExecutionError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/creative-board/workflows/{workflow_id}/rerun", response_model=WorkflowExecutionState)
async def rerun_creative_board_workflow(
    workflow_id: str,
    request: WorkflowRecomputeRequest,
    current_user: User = Depends(get_current_user)
):
    user_id = _current_user_id(current_user)
    _assert_workflow_access(workflow_id, user_id)
    try:
        execution = await workflow_engine.recompute_workflow(
            workflow_id,
            snapshot=request.snapshot,
            options=request.options,
            node_ids=request.node_ids,
        )
    except WorkflowExecutionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return execution.snapshot_state()


@router.get("/creative-board/{board_id}/workflows", response_model=List[WorkflowExecutionListItem])
async def list_creative_board_workflows(
    board_id: str,
    current_user: User = Depends(get_current_user)
):
    user_id = _current_user_id(current_user)
    if board_id in creative_board_drafts:
        _get_draft_for_user(board_id, user_id)
    return workflow_engine.list_executions(board_id=board_id, owner_id=user_id)

@router.get("/creative-board/generate/{task_id}", response_model=CreativeBoardGenerationStatusResponse)
async def get_creative_board_generation_status(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    user_id = _current_user_id(current_user)
    preview = creative_board_generations.get(task_id)
    if not preview:
        raise HTTPException(status_code=404, detail="合成任务不存在")

    board_id = creative_board_task_index.get(task_id)
    if not board_id:
        raise HTTPException(status_code=404, detail="找不到关联的创意画布")

    draft = _get_draft_for_user(board_id, user_id)

    workflow_id = preview.workflow_id or creative_board_task_to_workflow.get(task_id)
    if workflow_id:
        try:
            _assert_workflow_access(workflow_id, user_id)
        except HTTPException:
            workflow_id = None

    try:
        result = volcengine_service.get_dream_3_image_status(task_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"查询生成状态失败: {str(exc)}")

    status_map = {
        TaskStatus.PENDING: GenerationStatus.PENDING,
        TaskStatus.PROCESSING: GenerationStatus.PROCESSING,
        TaskStatus.COMPLETED: GenerationStatus.COMPLETED,
        TaskStatus.FAILED: GenerationStatus.FAILED,
    }
    updated_status = status_map.get(result.status, GenerationStatus.PENDING)

    final_asset = getattr(result, "video_url", None) or getattr(result, "image_url", None) or preview.image_url
    if workflow_id:
        if updated_status == GenerationStatus.COMPLETED and final_asset:
            workflow_engine.update_output_asset(workflow_id, final_asset)
        elif updated_status == GenerationStatus.FAILED:
            workflow_engine.update_output_asset(workflow_id, None)

    updated_preview = preview.copy(update={
        "status": updated_status,
        "image_url": final_asset,
        "error_message": result.error_message or preview.error_message,
        "updated_at": datetime.now(),
    })
    creative_board_generations[task_id] = updated_preview

    updated_generations = []
    for item in draft.generations:
        if item.task_id == task_id:
            updated_generations.append(updated_preview)
        else:
            updated_generations.append(item)

    creative_board_drafts[board_id] = draft.copy(update={
        "generations": updated_generations,
        "updated_at": datetime.now(),
    })

    workflow_state = None
    if workflow_id:
        try:
            workflow_state = workflow_engine.get_state(workflow_id)
        except WorkflowExecutionError:
            workflow_state = None

    return CreativeBoardGenerationStatusResponse(
        board_id=board_id,
        task_id=task_id,
        status=updated_preview.status,
        preview=updated_preview,
        workflow_id=workflow_id,
        workflow_state=workflow_state,
    )


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
                "prompt": "一款极简风格的商品在镜头前展示，背景简洁，光线柔和，具有商业质感",
                "category": "商业"
            },
            {
                "name": "自然风景",
                "prompt": "宁静的湖面波光粼粼，远山云雾缭绕，阳光穿过树叶洒在草地上，电影质感",
                "category": "风景"
            },
            {
                "name": "科技意象",
                "prompt": "未来科技感的场景，霓虹灯光效果，玻璃金属材质，高科技元素",
                "category": "科技"
            }
        ],
        "image_to_video": [
            {
                "name": "生物动作",
                "prompt": "生物自然地在观察和呼吸，表情生动自然",
                "category": "生物"
            },
            {
                "name": "物体运动",
                "prompt": "物体平滑移动与旋转，增加动效",
                "category": "物体"
            },
            {
                "name": "场景动画",
                "prompt": "背景元素平滑移动，营造生动的场景氛围",
                "category": "场景"
            }
        ],
        "dream_3_image": [
            {
                "name": "可爱小猫",
                "prompt": "一只可爱的橘色小猫，毛茸茸的，趴在窗台上，阳光洒在身上，超高清，细节丰富",
                "category": "动物",
                "style": "realistic"
            },
            {
                "name": "夏日风景",
                "prompt": "夏日清新的海岸线，阳光穿过云层洒落，有明亮的色彩点缀，给人愉悦的画面，清新风格",
                "category": "风景",
                "style": "artistic"
            },
            {
                "name": "未来城市",
                "prompt": "未来感城市景观，高耸的建筑，霓虹灯光，飞行汽车穿梭，赛博朋克风格，科技元素丰富",
                "category": "城市",
                "style": "artistic"
            },
            {
                "name": "美食摄影",
                "prompt": "精致的甜点，精美摆盘，浅景深，专业美食摄影，光线柔和，色彩丰富",
                "category": "美食",
                "style": "realistic"
            },
            {
                "name": "二次元风格",
                "prompt": "二次元风格的少年，长发飘逸，穿着可爱的服装，背景是樱花树的公园，动感画面",
                "category": "人物",
                "style": "anime"
            },
            {
                "name": "卡通配色",
                "prompt": "可爱的手绘小狗，在糖果色的调性下，饱和的光影，适合儿童插画，手绘风格",
                "category": "卡通",
                "style": "cartoon"
            }
        ]
    }
    
    return {
        "success": True,
        "templates": templates
    }




