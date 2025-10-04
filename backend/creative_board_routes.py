from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4
from auth_service import get_current_active_user, User


router = APIRouter(prefix="/api/ai/creative-board", tags=["Creative Board"])


class CanvasPoint(BaseModel):
    x: float
    y: float


class CanvasSize(BaseModel):
    width: float
    height: float


class CanvasBounds(BaseModel):
    position: CanvasPoint
    size: CanvasSize
    rotation: Optional[float] = 0
    scale: Optional[float] = 1


class SnapshotImage(BaseModel):
    id: str
    url: str
    name: Optional[str] = None
    caption: Optional[str] = None
    description: Optional[str] = None
    bounds: CanvasBounds
    z_index: int
    source: Optional[str] = None
    original_width: Optional[int] = None
    original_height: Optional[int] = None
    thumbnail_url: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SnapshotConnection(BaseModel):
    id: str
    source: Dict[str, Any]
    target: Dict[str, Any]
    path_points: List[CanvasPoint]
    path_style: str
    label: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CanvasConfig(BaseModel):
    size: CanvasSize
    grid_spacing: int
    show_grid: bool
    background_color: str


class Snapshot(BaseModel):
    canvas: CanvasConfig
    images: List[SnapshotImage]
    connections: List[SnapshotConnection]


class Draft(BaseModel):
    board_id: str
    name: str
    notes: Optional[str] = None
    snapshot: Snapshot
    created_at: str
    updated_at: str


class CreateDraftRequest(BaseModel):
    board_id: str
    name: str
    notes: Optional[str] = None
    snapshot: Snapshot


class GenerationRequest(BaseModel):
    board_id: str
    title: Optional[str] = None
    snapshot: Snapshot
    connection_id: Optional[str] = None
    prompt: Optional[str] = None


class GeneratedPreview(BaseModel):
    preview_id: str
    task_id: str
    title: str
    prompt: str
    status: str
    image_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: str
    updated_at: str


# In-memory stores for demo purposes
_drafts_by_user: Dict[str, Dict[str, Draft]] = {}
_tasks_by_user: Dict[str, Dict[str, GeneratedPreview]] = {}


def _now_iso() -> str:
    return datetime.utcnow().isoformat()


@router.get("/drafts", response_model=List[Draft])
async def list_drafts(current_user: User = Depends(get_current_active_user)):
    user_store = _drafts_by_user.get(current_user.id, {})
    return list(user_store.values())


@router.get("/drafts/{board_id}", response_model=Draft)
async def get_draft(board_id: str, current_user: User = Depends(get_current_active_user)):
    user_store = _drafts_by_user.get(current_user.id, {})
    draft = user_store.get(board_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@router.post("/drafts", response_model=Draft)
async def save_draft(body: CreateDraftRequest, current_user: User = Depends(get_current_active_user)):
    user_store = _drafts_by_user.setdefault(current_user.id, {})
    now = _now_iso()
    # preserve created_at if exists
    prev = user_store.get(body.board_id)
    draft = Draft(
        board_id=body.board_id,
        name=body.name,
        notes=body.notes,
        snapshot=body.snapshot,
        created_at=prev.created_at if prev else now,
        updated_at=now
    )
    user_store[body.board_id] = draft
    return draft


@router.post("/generate")
async def generate(body: GenerationRequest, current_user: User = Depends(get_current_active_user)):
    tasks = _tasks_by_user.setdefault(current_user.id, {})
    task_id = str(uuid4())
    preview_id = str(uuid4())
    title = body.title or "创意合成"

    # Simple prompt synthesis for demo
    auto_prompt = f"Images: {len(body.snapshot.images)}, Connections: {len(body.snapshot.connections)}"
    prompt = body.prompt or auto_prompt
    preview = GeneratedPreview(
        preview_id=preview_id,
        task_id=task_id,
        title=title,
        prompt=prompt,
        status="processing",
        image_url=None,
        created_at=_now_iso(),
        updated_at=_now_iso()
    )
    tasks[task_id] = preview
    return {"preview": preview}


@router.get("/generate/{task_id}")
async def poll_generate(task_id: str, current_user: User = Depends(get_current_active_user)):
    tasks = _tasks_by_user.setdefault(current_user.id, {})
    preview = tasks.get(task_id)
    if not preview:
        raise HTTPException(status_code=404, detail="Task not found")

    # Fake progress: mark completed and attach a placeholder image URL
    if preview.status in ("pending", "processing"):
        preview.status = "completed"
        preview.image_url = "https://picsum.photos/seed/" + task_id + "/720/480"
        preview.updated_at = _now_iso()
        tasks[task_id] = preview

    return {"preview": preview}


