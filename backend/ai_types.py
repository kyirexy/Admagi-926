"""
AI service type definitions
Contains all types for image generation and video generation
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Dict, Any
from enum import Enum

# ========== Image Generation Types ==========

class Dream3Style(str, Enum):
    """Dream3.0 supported styles"""
    REALISTIC = "realistic"  # Realistic style
    ARTISTIC = "artistic"    # Artistic style
    CARTOON = "cartoon"      # Cartoon style
    ANIME = "anime"          # Anime style


class Dream3Size(str, Enum):
    """Dream3.0 supported sizes"""
    SQUARE_1024 = "1024x1024"  # Square
    LANDSCAPE_1024 = "1024x768"  # Landscape
    PORTRAIT_1024 = "768x1024"   # Portrait


class Dream3ImageRequest(BaseModel):
    """Dream3.0 image generation request"""
    prompt: str
    style: Dream3Style = Dream3Style.REALISTIC
    size: Dream3Size = Dream3Size.SQUARE_1024
    quality: Literal["standard", "hd"] = "hd"
    n: int = 1  # Number of generated images


class Dream3ImageResponse(BaseModel):
    """Dream3.0 image generation response"""
    success: bool
    task_id: str
    message: str
    prompt: str
    style: str
    size: str
    image_url: Optional[str] = None


# ========== Video Generation Types ==========

class VideoAspectRatio(str, Enum):
    """Video aspect ratio"""
    RATIO_16_9 = "16:9"    # 1920 * 1088
    RATIO_4_3 = "4:3"      # 1664 * 1248
    RATIO_1_1 = "1:1"      # 1440 * 1440
    RATIO_3_4 = "3:4"      # 1248 * 1664
    RATIO_9_16 = "9:16"    # 1088 * 1920
    RATIO_21_9 = "21:9"    # 2176 * 928


class VideoFrames(int, Enum):
    """Video frame count"""
    FIVE_SECONDS = 121     # 5 second video
    TEN_SECONDS = 241      # 10 second video


class VideoGenerationType(str, Enum):
    """Video generation type"""
    TEXT_TO_VIDEO = "text_to_video"    # Text to video
    IMAGE_TO_VIDEO = "image_to_video"  # Image to video


class TextToVideoRequest(BaseModel):
    """Text to video request"""
    prompt: str
    frames: VideoFrames = VideoFrames.FIVE_SECONDS
    aspect_ratio: VideoAspectRatio = VideoAspectRatio.RATIO_16_9
    seed: int = -1


class ImageToVideoRequest(BaseModel):
    """Image to video request"""
    prompt: str = ""
    frames: VideoFrames = VideoFrames.FIVE_SECONDS
    aspect_ratio: VideoAspectRatio = VideoAspectRatio.RATIO_16_9
    seed: int = -1


class VideoGenerationResponse(BaseModel):
    """Video generation response"""
    success: bool
    task_id: str
    message: str
    generation_type: VideoGenerationType
    prompt: str
    frames: int
    aspect_ratio: str
    debug_id: Optional[str] = None


class VideoTaskStatusResponse(BaseModel):
    """Video task status response"""
    task_id: str
    status: str  # in_queue, generating, done, not_found, expired
    video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    progress: int = 0  # Progress percentage
    debug_id: Optional[str] = None


# ========== Creative Board Types ==========

class CanvasPoint(BaseModel):
    """Canvas coordinate expressed in pixels."""
    x: float
    y: float


class CanvasSize(BaseModel):
    """Canvas dimensions."""
    width: float
    height: float


class CanvasBounds(BaseModel):
    """Position and size metadata for a canvas element."""
    position: CanvasPoint
    size: CanvasSize
    rotation: float = 0.0
    scale: float = 1.0


class CreativeImageSource(str, Enum):
    """Image origin used on the creative board."""
    UPLOAD = "upload"
    LIBRARY = "library"
    GENERATED = "generated"
    URL = "url"


class CanvasImage(BaseModel):
    """Placed image node on the board."""
    id: str
    url: str
    bounds: CanvasBounds
    z_index: int = 0
    name: Optional[str] = None
    caption: Optional[str] = None
    description: Optional[str] = None
    source: CreativeImageSource = CreativeImageSource.UPLOAD
    original_width: Optional[int] = None
    original_height: Optional[int] = None
    thumbnail_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CanvasConnectionAnchor(str, Enum):
    """Anchor point for drawing a connection."""
    CENTER = "center"
    TOP = "top"
    RIGHT = "right"
    BOTTOM = "bottom"
    LEFT = "left"


class ConnectionEndpoint(BaseModel):
    """Source or target metadata for a connection."""
    image_id: str
    anchor: CanvasConnectionAnchor = CanvasConnectionAnchor.CENTER


class ConnectionLabel(BaseModel):
    """Editable label shown on the connection."""
    text: str
    position: CanvasPoint
    background: str = "#BFDBFE"
    color: str = "#FFFFFF"


class CanvasConnection(BaseModel):
    """Dashed line between two images with optional label."""
    id: str
    source: ConnectionEndpoint
    target: ConnectionEndpoint
    path_points: List[CanvasPoint] = Field(default_factory=list)
    path_style: Literal["curved", "straight", "orthogonal"] = "curved"
    label: Optional[ConnectionLabel] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CanvasLayer(BaseModel):
    """Logical layer grouping canvas elements for ordering control."""
    id: str
    name: str
    visible: bool = True
    locked: bool = False
    z_index: int = 0
    image_ids: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WorkflowNodeType(str, Enum):
    """Supported workflow node types for the creative board engine."""
    INPUT_IMAGE = "input_image"
    PROMPT = "prompt"
    STYLE_TRANSFER = "style_transfer"
    COMPOSITE = "composite"
    UPSCALE = "upscale"
    OUTPUT = "output"
    LLM_DIRECTIVE = "llm_directive"
    CUSTOM = "custom"


class WorkflowNodeRunStatus(str, Enum):
    """Execution status for a workflow node."""
    IDLE = "idle"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class WorkflowRunStatus(str, Enum):
    """Overall workflow execution status."""
    NOT_STARTED = "not_started"
    RUNNING = "running"
    COMPLETED = "completed"
    PARTIAL = "partial"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowNodeConfig(BaseModel):
    """Parameter payload for a workflow node."""
    prompt: Optional[str] = None
    strength: Optional[float] = None
    model: Optional[str] = None
    parameters: Dict[str, Any] = Field(default_factory=dict)


class WorkflowPort(BaseModel):
    """Workflow connection port metadata."""
    node_id: str
    port: str = "default"
    label: Optional[str] = None


class WorkflowEdge(BaseModel):
    """Directed edge between workflow nodes."""
    id: str
    source: WorkflowPort
    target: WorkflowPort
    label: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WorkflowNodeDefinition(BaseModel):
    """Declarative description of a workflow node."""
    id: str
    type: WorkflowNodeType
    title: str
    description: Optional[str] = None
    config: WorkflowNodeConfig = Field(default_factory=WorkflowNodeConfig)
    input_ids: List[str] = Field(default_factory=list)
    layer_id: Optional[str] = None
    output_variable: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CanvasWorkflowDefinition(BaseModel):
    """Workflow composed on top of the canvas graph."""
    version: str = "1.0"
    nodes: List[WorkflowNodeDefinition] = Field(default_factory=list)
    edges: List[WorkflowEdge] = Field(default_factory=list)
    entry_ids: List[str] = Field(default_factory=list)
    output_ids: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WorkflowNodeState(BaseModel):
    """Runtime state for a workflow node execution."""
    node_id: str
    status: WorkflowNodeRunStatus = WorkflowNodeRunStatus.IDLE
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    progress: float = 0.0
    output_asset: Optional[str] = None
    output_metadata: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
    cached: bool = False
    upstream_ids: List[str] = Field(default_factory=list)


class WorkflowExecutionState(BaseModel):
    """Snapshot of a workflow execution."""
    workflow_id: str
    board_id: str
    status: WorkflowRunStatus = WorkflowRunStatus.NOT_STARTED
    node_states: List[WorkflowNodeState] = Field(default_factory=list)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    current_node_id: Optional[str] = None
    error_message: Optional[str] = None


class LLMDirectiveResolution(BaseModel):
    """Resolution result for a natural language directive on a connection."""
    connection_id: str
    original_text: str
    resolved_prompt: str
    suggested_node_type: WorkflowNodeType = WorkflowNodeType.CUSTOM
    parameters: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.0

class CreativeBoardCanvas(BaseModel):
    """Canvas level configuration."""
    size: CanvasSize = Field(default_factory=lambda: CanvasSize(width=1440, height=900))
    grid_spacing: int = 50
    show_grid: bool = True
    background_color: str = "#F3F4F6"


class CreativeBoardSnapshot(BaseModel):
    """Serializable board state used for drafts and generation."""
    canvas: CreativeBoardCanvas = Field(default_factory=CreativeBoardCanvas)
    images: List[CanvasImage] = Field(default_factory=list)
    connections: List[CanvasConnection] = Field(default_factory=list)
    layers: List[CanvasLayer] = Field(default_factory=list)
    workflow: Optional[CanvasWorkflowDefinition] = None


class GenerationStatus(str, Enum):
    """Status for generated previews."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class GeneratedImagePreview(BaseModel):
    """Preview item rendered below the canvas."""
    preview_id: str
    task_id: str
    workflow_id: Optional[str] = None
    title: str
    prompt: str
    status: GenerationStatus = GenerationStatus.PENDING
    image_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CreativeBoardDraft(BaseModel):
    """Stored draft inside the local creative library."""
    board_id: str
    owner_id: Optional[str] = None
    name: str = "Starry Creative Board"
    notes: Optional[str] = None
    snapshot: CreativeBoardSnapshot = Field(default_factory=CreativeBoardSnapshot)
    generations: List[GeneratedImagePreview] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class CreativeBoardSaveRequest(BaseModel):
    """Payload used to persist the creative board draft."""
    board_id: Optional[str] = None
    name: Optional[str] = None
    notes: Optional[str] = None
    snapshot: CreativeBoardSnapshot


class CreativeBoardWorkflowRunOptions(BaseModel):
    """Execution options provided by the client when running a workflow."""
    use_llm: bool = False
    greedy_cache: bool = True
    focus_node_ids: Optional[List[str]] = None
    priority: Literal["low", "normal", "high"] = "normal"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CreativeBoardWorkflowRunRequest(BaseModel):
    """Request payload to execute a workflow for the creative board."""
    board_id: Optional[str] = None
    snapshot: CreativeBoardSnapshot
    options: CreativeBoardWorkflowRunOptions = Field(default_factory=CreativeBoardWorkflowRunOptions)


class WorkflowRecomputeRequest(BaseModel):
    """Payload to trigger a partial workflow recompute."""
    node_ids: List[str]
    snapshot: Optional[CreativeBoardSnapshot] = None
    options: CreativeBoardWorkflowRunOptions = Field(default_factory=CreativeBoardWorkflowRunOptions)


class WorkflowNodePatchRequest(BaseModel):
    """Partial update for workflow node configuration."""
    node_id: str
    config: WorkflowNodeConfig
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WorkflowExecutionListItem(BaseModel):
    """Basic listing payload for workflows associated with a board."""
    workflow_id: str
    board_id: str
    status: WorkflowRunStatus
    created_at: datetime
    updated_at: datetime


class LLMDirectiveBatchResponse(BaseModel):
    """Batch response for resolved directives on connections."""
    workflow_id: Optional[str] = None
    directives: List[LLMDirectiveResolution] = Field(default_factory=list)


class CreativeBoardGenerateRequest(BaseModel):
    """Trigger AI generation without overriding existing drafts."""
    board_id: Optional[str] = None
    snapshot: Optional[CreativeBoardSnapshot] = None
    extra_prompt: Optional[str] = None
    focus_connection_ids: Optional[List[str]] = None
    style: Dream3Style = Dream3Style.REALISTIC
    size: Dream3Size = Dream3Size.SQUARE_1024
    quality: Literal["standard", "hd"] = "hd"
    title: Optional[str] = None


class CreativeBoardGenerateResponse(BaseModel):
    """Response returned after dispatching an AI job."""
    board_id: str
    task_id: str
    status: GenerationStatus
    prompt: str
    preview: GeneratedImagePreview
    next_poll_seconds: int = 3
    workflow_id: Optional[str] = None
    workflow_state: Optional[WorkflowExecutionState] = None


class CreativeBoardGenerationStatusResponse(BaseModel):
    """Polling response for AI generation status."""
    board_id: str
    task_id: str
    status: GenerationStatus
    preview: GeneratedImagePreview
    workflow_id: Optional[str] = None
    workflow_state: Optional[WorkflowExecutionState] = None


# ========== General Types ==========

class TaskStatusResponse(BaseModel):
    """Task status response"""
    task_id: str
    status: str
    progress: int
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    debug_id: Optional[str] = None