
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useDropzone } from "react-dropzone";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/components/auth/auth-provider";
import { Download, ImagePlus, Link2, Pencil, RotateCcw, Save, Sparkles, Trash2, Upload } from "lucide-react";

interface CanvasPoint {
  x: number;
  y: number;
}

interface CanvasSize {
  width: number;
  height: number;
}

interface CanvasBounds {
  position: CanvasPoint;
  size: CanvasSize;
  rotation?: number;
  scale?: number;
}

interface BoardImage {
  id: string;
  url: string;
  name?: string;
  caption?: string;
  description?: string;
  bounds: CanvasBounds;
  zIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface BoardConnection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreativeBoardCanvas {
  size: CanvasSize;
  grid_spacing: number;
  show_grid: boolean;
  background_color: string;
}

interface CreativeBoardSnapshotImage {
  id: string;
  url: string;
  name?: string;
  caption?: string;
  description?: string;
  bounds: CanvasBounds;
  z_index: number;
  source?: string;
  original_width?: number | null;
  original_height?: number | null;
  thumbnail_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface CreativeBoardSnapshotConnection {
  id: string;
  source: { image_id: string; anchor: "center" | "top" | "right" | "bottom" | "left" };
  target: { image_id: string; anchor: "center" | "top" | "right" | "bottom" | "left" };
  path_points: CanvasPoint[];
  path_style: "curved" | "straight" | "orthogonal";
  label?: { text: string; position: CanvasPoint; background: string; color: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface CreativeBoardSnapshot {
  canvas: CreativeBoardCanvas;
  images: CreativeBoardSnapshotImage[];
  connections: CreativeBoardSnapshotConnection[];
}

type GenerationStatus = "pending" | "processing" | "completed" | "failed";

interface GeneratedImagePreview {
  preview_id: string;
  task_id: string;
  title: string;
  prompt: string;
  status: GenerationStatus;
  image_url?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

interface CreativeBoardDraft {
  board_id: string;
  owner_id?: string | null;
  name: string;
  notes?: string | null;
  snapshot: CreativeBoardSnapshot;
  generations: GeneratedImagePreview[];
  created_at: string;
  updated_at: string;
}
const BOARD_WIDTH = 1200;
const BOARD_HEIGHT = 720;
const GRID_SIZE = 50;
const API_BASE = "http://localhost:8000/api/ai";
const LABEL_PLACEHOLDER = "请输入连线描述";
const DEFAULT_NAME = "星辰创意画板";
const AUTH_WARNING = "未检测到登录凭证，请先登录后重试";

const defaultCanvas: CreativeBoardCanvas = {
  size: { width: BOARD_WIDTH, height: BOARD_HEIGHT },
  grid_spacing: GRID_SIZE,
  show_grid: true,
  background_color: "#F3F4F6",
};

const nowIso = () => new Date().toISOString();

const createImage = (url: string, name: string, width: number, height: number, offset = 0): BoardImage => {
  const timestamp = nowIso();
  return {
    id: crypto.randomUUID(),
    url,
    name,
    caption: name,
    description: name,
    bounds: {
      position: {
        x: (BOARD_WIDTH - width) / 2 + offset,
        y: (BOARD_HEIGHT - height) / 2 + offset,
      },
      size: { width, height },
      rotation: 0,
      scale: 1,
    },
    zIndex: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};
const isAuthMissingError = (err: unknown): boolean => err instanceof Error && err.message === "AUTH_TOKEN_MISSING";

// 添加画布视图状态接口
interface CanvasViewport {
  x: number;
  y: number;
  scale: number;
}

export default function CreativeBoardPage() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated } = useAuth();
  
  // 添加画布视图状态
  const [viewport, setViewport] = useState<CanvasViewport>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [boardId, setBoardId] = useState<string>(() => crypto.randomUUID());
  const [draftName, setDraftName] = useState<string>(DEFAULT_NAME);
  const [boardNotes, setBoardNotes] = useState<string>("");
  const [images, setImages] = useState<BoardImage[]>([]);
  const [connections, setConnections] = useState<BoardConnection[]>([]);
  const [generations, setGenerations] = useState<GeneratedImagePreview[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<CreativeBoardDraft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [editingLabelDraft, setEditingLabelDraft] = useState("");

  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const dragOffset = useRef({ offsetX: 0, offsetY: 0 });

  // 添加画布交互处理函数
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-background')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      setSelectedImageId(null); // 点击空白区域取消选中
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragStart) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, viewport.scale * scaleFactor));
    
    // 计算缩放中心点
    const scaleRatio = newScale / viewport.scale;
    const newX = mouseX - (mouseX - viewport.x) * scaleRatio;
    const newY = mouseY - (mouseY - viewport.y) * scaleRatio;
    
    setViewport({
      x: newX,
      y: newY,
      scale: newScale
    });
  };

  // 重置视图
  const resetViewport = () => {
    setViewport({ x: 0, y: 0, scale: 1 });
  };

  // 适应画布内容
  const fitToContent = () => {
    if (images.length === 0) {
      resetViewport();
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    images.forEach(img => {
      const { position, size } = img.bounds;
      minX = Math.min(minX, position.x);
      minY = Math.min(minY, position.y);
      maxX = Math.max(maxX, position.x + size.width);
      maxY = Math.max(maxY, position.y + size.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const padding = 100;
    
    const containerRect = canvasRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    
    const scaleX = (containerRect.width - padding * 2) / contentWidth;
    const scaleY = (containerRect.height - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    setViewport({
      x: containerRect.width / 2 - centerX * scale,
      y: containerRect.height / 2 - centerY * scale,
      scale
    });
  };

  // 转换屏幕坐标到画布坐标
  const screenToCanvas = (screenX: number, screenY: number): CanvasPoint => {
    return {
      x: (screenX - viewport.x) / viewport.scale,
      y: (screenY - viewport.y) / viewport.scale
    };
  };

  // 转换画布坐标到屏幕坐标
  const canvasToScreen = (canvasX: number, canvasY: number): CanvasPoint => {
    return {
      x: canvasX * viewport.scale + viewport.x,
      y: canvasY * viewport.scale + viewport.y
    };
  };

  const activeTaskIds = useMemo(
    () =>
      generations
        .filter((item) => item.status === "pending" || item.status === "processing")
        .map((item) => item.task_id),
    [generations],
  );

  const fetchWithAuth = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("AUTH_TOKEN_MISSING");
      }
      const headers = new Headers(init.headers || {});
      headers.set("Authorization", `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    },
    [],
  );


  const applyDraft = useCallback((draft: CreativeBoardDraft) => {
    setBoardId(draft.board_id);
    setDraftName(draft.name || DEFAULT_NAME);
    setBoardNotes(draft.notes || "");

    const loadedImages: BoardImage[] = draft.snapshot.images
      .map((img, index) => ({
        id: img.id,
        url: img.url,
        name: img.name,
        caption: img.caption,
        description: img.description,
        bounds: {
          position: {
            x: img.bounds?.position?.x ?? 120 + index * 20,
            y: img.bounds?.position?.y ?? 120 + index * 20,
          },
          size: {
            width: img.bounds?.size?.width ?? 400,
            height: img.bounds?.size?.height ?? 300,
          },
          rotation: img.bounds?.rotation ?? 0,
          scale: img.bounds?.scale ?? 1,
        },
        zIndex: img.z_index ?? index + 1,
        createdAt: img.created_at ?? draft.created_at,
        updatedAt: img.updated_at ?? draft.updated_at,
      }))
      .sort((a, b) => a.zIndex - b.zIndex);

    const loadedConnections: BoardConnection[] = draft.snapshot.connections.map((conn) => ({
      id: conn.id,
      sourceId: conn.source.image_id,
      targetId: conn.target.image_id,
      label: conn.label?.text,
      createdAt: conn.created_at ?? draft.created_at,
      updatedAt: conn.updated_at ?? draft.updated_at,
    }));

    setImages(loadedImages);
    setConnections(loadedConnections);
    setGenerations(draft.generations || []);
  }, []);

  const fetchDrafts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`${API_BASE}/creative-board/drafts`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data: CreativeBoardDraft[] = await response.json();
      setDrafts(data);
      if (data.length > 0) {
        setSelectedDraftId(data[0].board_id);
        applyDraft(data[0]);
      }
    } catch (err) {
      console.error(err);
      if (isAuthMissingError(err)) {
        setError(AUTH_WARNING);
      } else {
        setError("加载草稿列表失败，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyDraft, fetchWithAuth, isAuthMissingError]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDrafts();
    }
  }, [isAuthenticated, fetchDrafts]);

  useEffect(() => {
    if (!draggingImageId) {
      return;
    }
    const handlePointerMove = (event: PointerEvent) => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) {
        return;
      }
      const rect = canvasEl.getBoundingClientRect();
      const { offsetX, offsetY } = dragOffset.current;
      
      // 将屏幕坐标转换为画布坐标
      const screenX = event.clientX - rect.left - offsetX;
      const screenY = event.clientY - rect.top - offsetY;
      const canvasPos = screenToCanvas(screenX, screenY);
      
      // 网格对齐（可选）
      const gridSize = 20;
      const nextX = Math.round(canvasPos.x / gridSize) * gridSize;
      const nextY = Math.round(canvasPos.y / gridSize) * gridSize;
      
      setImages((prev) =>
        prev.map((img) =>
          img.id === draggingImageId
            ? {
                ...img,
                bounds: {
                  ...img.bounds,
                  position: {
                    x: nextX,
                    y: nextY,
                  },
                },
                updatedAt: nowIso(),
              }
            : img,
        ),
      );
    };
    const handlePointerUp = () => setDraggingImageId(null);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingImageId, screenToCanvas]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          const imgElement = new Image();
          imgElement.onload = () => {
            const aspect = imgElement.width / imgElement.height || 1;
            const width = 400;
            const height = Math.round(width / aspect);
            setImages((prev) => {
              const offset = prev.length * 12 + index * 12;
              const next = [...prev, createImage(url, file.name, width, height, offset)];
              return next.map((img, order) => ({ ...img, zIndex: order + 1 }));
            });
            // 确保新图可见
            setTimeout(() => {
              fitToContent();
            }, 0);
          };
          imgElement.src = url;
        };
        reader.readAsDataURL(file);
      });
    },
  });
  const handleDeleteImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setConnections((prev) => prev.filter((conn) => conn.sourceId !== imageId && conn.targetId !== imageId));
  };

  const resetBoard = () => {
    setImages([]);
    setConnections([]);
    setGenerations([]);
    setBoardId(crypto.randomUUID());
    setDraftName(DEFAULT_NAME);
    setBoardNotes("");
    setStatusMessage("草稿已加载");
  };

  const beginConnection = (imageId: string) => {
    if (connectSourceId === imageId) {
      setConnectSourceId(null);
      return;
    }
    if (connectSourceId) {
      if (connectSourceId === imageId) {
        setConnectSourceId(null);
        return;
      }
      const connection: BoardConnection = {
        id: crypto.randomUUID(),
        sourceId: connectSourceId,
        targetId: imageId,
        label: LABEL_PLACEHOLDER,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setConnections((prev) => [...prev, connection]);
      setConnectSourceId(null);
      setEditingConnectionId(connection.id);
      setEditingLabelDraft(connection.label);
    } else {
      setConnectSourceId(imageId);
    }
  };

  const handleConnectionLabelSubmit = (connectionId: string) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === connectionId
          ? {
              ...conn,
              label: editingLabelDraft.trim() || "\u672a\u547d\u540d\u63cf\u8ff0",
              updatedAt: nowIso(),
            }
          : conn,
      ),
    );
    setEditingConnectionId(null);
    setEditingLabelDraft("");
  };

  const buildSnapshot = useCallback((): CreativeBoardSnapshot => ({
    canvas: defaultCanvas,
    images: images.map((img, index) => ({
      id: img.id,
      url: img.url,
      name: img.name,
      caption: img.caption,
      description: img.description,
      bounds: img.bounds,
      z_index: index + 1,
      source: "upload",
      original_width: Math.round(img.bounds.size.width),
      original_height: Math.round(img.bounds.size.height),
      thumbnail_url: null,
      created_at: img.createdAt,
      updated_at: img.updatedAt,
    })),
    connections: connections.map((conn) => {
      const sourceImg = images.find((img) => img.id === conn.sourceId);
      const targetImg = images.find((img) => img.id === conn.targetId);
      const sourceCenter: CanvasPoint = sourceImg
        ? {
            x: sourceImg.bounds.position.x + sourceImg.bounds.size.width / 2,
            y: sourceImg.bounds.position.y + sourceImg.bounds.size.height / 2,
          }
        : { x: 0, y: 0 };
      const targetCenter: CanvasPoint = targetImg
        ? {
            x: targetImg.bounds.position.x + targetImg.bounds.size.width / 2,
            y: targetImg.bounds.position.y + targetImg.bounds.size.height / 2,
          }
        : { x: 0, y: 0 };
      const labelPosition: CanvasPoint = {
        x: (sourceCenter.x + targetCenter.x) / 2,
        y: (sourceCenter.y + targetCenter.y) / 2,
      };
      return {
        id: conn.id,
        source: { image_id: conn.sourceId, anchor: "center" },
        target: { image_id: conn.targetId, anchor: "center" },
        path_points: [sourceCenter, labelPosition, targetCenter],
        path_style: "curved" as const,
        label: conn.label
          ? {
              text: conn.label,
              position: labelPosition,
              background: "#BFDBFE",
              color: "#FFFFFF",
            }
          : null,
        created_at: conn.createdAt,
        updated_at: conn.updatedAt,
      };
    }),
  }), [connections, images]);
  const handleLoadDraft = async (targetBoardId: string) => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`${API_BASE}/creative-board/drafts/${targetBoardId}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const draft: CreativeBoardDraft = await response.json();
      setSelectedDraftId(draft.board_id);
      applyDraft(draft);
      setStatusMessage("草稿已加载");
    } catch (err) {
      console.error(err);
      if (isAuthMissingError(err)) {
        setError(AUTH_WARNING);
        return;
      }
      setError("加载草稿失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setError(null);
      const payload = {
        board_id: boardId,
        name: draftName,
        notes: boardNotes,
        snapshot: buildSnapshot(),
      };
      const response = await fetchWithAuth(`${API_BASE}/creative-board/drafts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const draft: CreativeBoardDraft = await response.json();
      applyDraft(draft);
      setStatusMessage("草稿已保存");
      fetchDrafts();
    } catch (err) {
      console.error(err);
      if (isAuthMissingError(err)) {
        setError(AUTH_WARNING);
        return;
      }
      setError("保存草稿失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    try {
      if (images.length === 0) {
        setError("请先添加至少一张图片");
        return;
      }
      setIsGenerating(true);
      setError(null);
      const payload = {
        board_id: boardId,
        snapshot: buildSnapshot(),
        title: draftName,
      };
      const response = await fetchWithAuth(`${API_BASE}/creative-board/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      const preview: GeneratedImagePreview = data.preview;
      setGenerations((prev) => {
        const others = prev.filter((item) => item.task_id !== preview.task_id);
        return [preview, ...others];
      });
      setStatusMessage("生成任务已提交，请稍候查看");
    } catch (err) {
      console.error(err);
      if (isAuthMissingError(err)) {
        setError(AUTH_WARNING);
        return;
      }
      setError("生成请求提交失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 基于连线的工作台操作
  const handleGenerateForConnection = async (connectionId: string) => {
    try {
      const conn = connections.find(c => c.id === connectionId);
      if (!conn) return;
      setIsGenerating(true);
      setError(null);
      const payload = {
        board_id: boardId,
        snapshot: buildSnapshot(),
        title: draftName,
        connection_id: connectionId,
        prompt: (conn.label || '').trim() || '合成',
      };
      const response = await fetchWithAuth(`${API_BASE}/creative-board/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();
      const preview: GeneratedImagePreview = data.preview;
      setGenerations((prev) => {
        const others = prev.filter((item) => item.task_id !== preview.task_id);
        return [preview, ...others];
      });
      setStatusMessage("生成任务已提交，请稍候查看");
    } catch (err) {
      console.error(err);
      if (isAuthMissingError(err)) {
        setError(AUTH_WARNING);
        return;
      }
      setError("生成请求提交失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (activeTaskIds.length === 0) {
      return;
    }
    const timer = window.setInterval(async () => {
      for (const taskId of activeTaskIds) {
        try {
          const response = await fetchWithAuth(`${API_BASE}/creative-board/generate/${taskId}`);
          if (!response.ok) {
            continue;
          }
          const data = await response.json();
          const preview: GeneratedImagePreview = data.preview;
          setGenerations((prev) => {
            const others = prev.filter((item) => item.task_id !== preview.task_id);
            return [preview, ...others];
          });
        } catch (err) {
          if (isAuthMissingError(err)) {
            setError(AUTH_WARNING);
            return;
          }
          console.error(err);
        }
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [activeTaskIds, fetchWithAuth, isAuthMissingError]);
  const boardStyle: CSSProperties = {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    backgroundColor: "#F9FAFB",
    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
    backgroundImage:
      "linear-gradient(0deg, rgba(226,232,240,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,0.7) 1px, transparent 1px)",
    boxShadow: "0 18px 40px rgba(15,23,42,0.12)",
  };

  const renderConnections = () => (
    <svg className="absolute inset-0" width={BOARD_WIDTH} height={BOARD_HEIGHT}>
      {connections.map((conn) => {
        const sourceImg = images.find((img) => img.id === conn.sourceId);
        const targetImg = images.find((img) => img.id === conn.targetId);
        if (!sourceImg || !targetImg) {
          return null;
        }
        const sx = sourceImg.bounds.position.x + sourceImg.bounds.size.width / 2;
        const sy = sourceImg.bounds.position.y + sourceImg.bounds.size.height / 2;
        const tx = targetImg.bounds.position.x + targetImg.bounds.size.width / 2;
        const ty = targetImg.bounds.position.y + targetImg.bounds.size.height / 2;
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2 - 60;
        const path = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;
        const isEditing = editingConnectionId === conn.id;
        return (
          <g key={conn.id}>
            <path
              d={path}
              stroke="#3B82F6"
              strokeWidth={2}
              strokeDasharray="8 6"
              fill="none"
              style={{ cursor: "pointer" }}
              onClick={() => {
                setEditingConnectionId(conn.id);
                setEditingLabelDraft(conn.label || "");
              }}
            />
            <foreignObject x={mx - 90} y={my - 10} width={180} height={60} pointerEvents="none">
              <div className="flex justify-center pointer-events-auto">
                {isEditing ? (
                  <Input
                    autoFocus
                    value={editingLabelDraft}
                    onChange={(event) => setEditingLabelDraft(event.target.value)}
                    onBlur={() => handleConnectionLabelSubmit(conn.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleConnectionLabelSubmit(conn.id);
                      }
                    }}
                    className="h-9 w-64"
                  />
                ) : (
                  <button
                    className="px-3 py-1 text-xs bg-blue-200 text-blue-900 rounded-full shadow"
                    onClick={() => {
                      setEditingConnectionId(conn.id);
                      setEditingLabelDraft(conn.label || "");
                    }}
                  >
                    <Pencil className="w-3 h-3 mr-1 inline" />
                    {conn.label || "点击编辑"}
                  </button>
                )}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
  return (
    <MainLayout>
      <div className="flex h-full flex-col gap-4">
        {/* 页面标题与功能按钮 - 水平布局优化 */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              星辰创意画板
            </h1>
            <p className="text-slate-600 max-w-4xl leading-relaxed">
              自由拖拽画布中的图片、创建连线描述关系，AI 会依据当前布局生成新的合成图，原画布始终保持可编辑。
            </p>
          </div>
          
          {/* 主要功能按钮 - 右对齐 */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={resetBoard} className="border-gray-300 hover:border-gray-400">
              <RotateCcw className="w-4 h-4 mr-2" />
              清空画布
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving} className="border-gray-300 hover:border-gray-400">
              {isSaving ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              保存草稿
            </Button>
            <Button 
              size="sm" 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              {isGenerating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              上传图片
            </Button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-[1fr_360px] gap-4 min-h-0">
          <Card className="col-span-1 flex min-h-0 flex-col">
            <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-xl">创意画布</CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700">草稿名称</span>
                    <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="h-9 w-48" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700">创意备注</span>
                    <Input
                      value={boardNotes}
                      onChange={(event) => setBoardNotes(event.target.value)}
                      className="h-9 w-64"
                      placeholder="记录灵感或执行要点"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0">
              <div
                ref={canvasRef}
                className={`relative h-full rounded-2xl border border-slate-200 overflow-hidden transition-shadow ${isDragActive ? "ring-4 ring-indigo-300 ring-offset-2" : ""}`}
                style={{
                  width: '100%',
                  height: 'calc(100vh - 180px)',
                  backgroundColor: "#F9FAFB",
                  cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onWheel={handleCanvasWheel}
              >
                {isLoading && (
                  <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                    <LoadingSpinner className="w-8 h-8 text-indigo-500" />
                  </div>
                )}
                
                {/* 无限画布容器 */}
                <div
                  className="absolute canvas-background"
                  style={{
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                    transformOrigin: '0 0',
                    width: '10000px',
                    height: '10000px',
                    backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                    backgroundImage: "linear-gradient(0deg, rgba(226,232,240,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,0.7) 1px, transparent 1px)",
                  }}
                >
                  <div
                    {...getRootProps({
                      className: "absolute inset-0 z-10",
                    })}
                  >
                    <input {...getInputProps()} />
                    {isDragActive && (
                      <div className="absolute inset-0 bg-indigo-500/15 backdrop-blur-sm flex items-center justify-center text-indigo-700 font-medium">
                        松开鼠标即可添加图片
                      </div>
                    )}
                  </div>

                  {/* SVG连线层 */}
                  <svg 
                    className="absolute inset-0 pointer-events-none" 
                    style={{ width: '10000px', height: '10000px' }}
                  >
                    {connections.map((conn) => {
                      const sourceImg = images.find((img) => img.id === conn.sourceId);
                      const targetImg = images.find((img) => img.id === conn.targetId);
                      if (!sourceImg || !targetImg) {
                        return null;
                      }
                      const sx = sourceImg.bounds.position.x + sourceImg.bounds.size.width / 2;
                      const sy = sourceImg.bounds.position.y + sourceImg.bounds.size.height / 2;
                      const tx = targetImg.bounds.position.x + targetImg.bounds.size.width / 2;
                      const ty = targetImg.bounds.position.y + targetImg.bounds.size.height / 2;
                      const mx = (sx + tx) / 2;
                      const my = (sy + ty) / 2 - 60;
                      const path = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;
                      const isEditing = editingConnectionId === conn.id;
                      return (
                        <g key={conn.id}>
                          <path
                            d={path}
                            stroke="#3B82F6"
                            strokeWidth={2}
                            strokeDasharray="8 6"
                            fill="none"
                            style={{ cursor: "pointer", pointerEvents: "auto" }}
                            onClick={() => {
                              setEditingConnectionId(conn.id);
                              setEditingLabelDraft(conn.label || "");
                            }}
                          />
                          <foreignObject x={mx - 90} y={my - 10} width={180} height={60} style={{ pointerEvents: "none" }}>
                            <div className="flex justify-center pointer-events-auto">
                              {isEditing ? (
                                <Input
                                  autoFocus
                                  value={editingLabelDraft}
                                  onChange={(event) => setEditingLabelDraft(event.target.value)}
                                  onBlur={() => handleConnectionLabelSubmit(conn.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      handleConnectionLabelSubmit(conn.id);
                                    }
                                  }}
                                  className="h-9 w-64"
                                />
                              ) : (
                                <button
                                  className="px-3 py-1 text-xs bg-blue-200 text-blue-900 rounded-full shadow"
                                  onClick={() => {
                                    setEditingConnectionId(conn.id);
                                    setEditingLabelDraft(conn.label || "");
                                  }}
                                >
                                  <Pencil className="w-3 h-3 mr-1 inline" />
                                  {conn.label || "点击编辑"}
                                </button>
                              )}
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })}
                  </svg>

                  {/* 图片节点 */}
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`absolute group rounded-xl border-2 border-transparent hover:border-indigo-500 shadow-lg transition-all ${connectSourceId === img.id ? "border-dashed border-indigo-600" : ""}`}
                      style={{
                        left: img.bounds.position.x,
                        top: img.bounds.position.y,
                        width: img.bounds.size.width,
                        height: img.bounds.size.height,
                        zIndex: img.zIndex,
                        cursor: "grab",
                      }}
                      onPointerDown={(event) => {
                        event.preventDefault();
                        const canvasEl = canvasRef.current;
                        if (!canvasEl) {
                          return;
                        }
                        const rect = canvasEl.getBoundingClientRect();
                        const canvasPos = screenToCanvas(event.clientX - rect.left, event.clientY - rect.top);
                        dragOffset.current = {
                          offsetX: canvasPos.x - img.bounds.position.x,
                          offsetY: canvasPos.y - img.bounds.position.y,
                        };
                        setDraggingImageId(img.id);
                        setSelectedImageId(img.id);
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedImageId(img.id);
                      }}
                    >
                      <img 
                        src={img.url} 
                        alt={img.name || "board-image"} 
                        className="w-full h-full object-cover rounded-lg" 
                        draggable={false} 
                      />
                      
                      {/* 控制按钮 */}
                      <div className={`absolute top-2 right-2 flex gap-2 transition-opacity ${
                        (selectedImageId === img.id) || draggingImageId === img.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}>
                        <button
                          className="p-1.5 rounded-full bg-white/90 text-slate-700 shadow hover:bg-white hover:shadow-md transition-all"
                          onClick={(event) => {
                            event.stopPropagation();
                            beginConnection(img.id);
                          }}
                          title="创建连线"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-full bg-white/90 text-red-500 shadow hover:bg-red-50 hover:shadow-md transition-all"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteImage(img.id);
                          }}
                          title="删除图片"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* 图片标签 */}
                      <div className="absolute bottom-2 left-3 right-3 bg-white/90 rounded-full px-3 py-1 text-xs text-slate-600 shadow-sm flex items-center gap-2">
                        <ImagePlus className="w-3 h-3" />
                        {img.name || "未命名图片"}
                      </div>
                      
                      {/* 选中状态的控制点 */}
                      {selectedImageId === img.id && (
                        <>
                          {/* 四个角的控制点 */}
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full cursor-nw-resize shadow-sm"></div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full cursor-ne-resize shadow-sm"></div>
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full cursor-sw-resize shadow-sm"></div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full cursor-se-resize shadow-sm"></div>
                          
                          {/* 边中点的控制点 */}
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full cursor-n-resize shadow-sm"></div>
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full cursor-s-resize shadow-sm"></div>
                          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full cursor-w-resize shadow-sm"></div>
                          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-indigo-500 border-2 border-white rounded-full cursor-e-resize shadow-sm"></div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* 画布控制工具栏 */}
                <div className="absolute top-4 right-4 flex gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                  <Button variant="outline" size="sm" onClick={resetViewport} title="重置视图">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={fitToContent} title="适应内容">
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                  <div className="text-xs text-slate-600 px-2 py-1 bg-slate-100 rounded">
                    {Math.round(viewport.scale * 100)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="col-span-1 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">操作面板</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm text-slate-600">画布提示</span>
                  <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                    <li>拖动图片自动吸附网格，方便保持排版整齐。</li>
                    <li>点击图片右上角的链接按钮，再选中另一张图片即可创建虚线连线。</li>
                    <li>点击连线标签可快速编辑描述文本，用于指导 AI 生成。</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 工作台 - 连线与提示词管理 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">工作台（连线与提示词）</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {connections.length === 0 && (
                  <div className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3">
                    暂无连线。点击图片卡片右上角"链接"图标，再点击另一张图片可创建连线。
                  </div>
                )}
                {connections.map((conn) => {
                  const source = images.find(i => i.id === conn.sourceId);
                  const target = images.find(i => i.id === conn.targetId);
                  return (
                    <div key={conn.id} className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                      <div className="text-xs text-slate-600">
                        从 <span className="font-medium text-slate-800">{source?.name || '图片A'}</span>
                        到 <span className="font-medium text-slate-800">{target?.name || '图片B'}</span>
                      </div>
                      <Input
                        value={conn.label || ''}
                        placeholder="在这里输入提示词，例如：让人物穿上该裤子"
                        onChange={(e) => {
                          const value = e.target.value;
                          setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, label: value, updatedAt: nowIso() } : c));
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleGenerateForConnection(conn.id)} disabled={isGenerating}>
                          {isGenerating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-1" />}
                          生成
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImagePlus className="w-5 h-5 text-indigo-500" />
                  图片素材库
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* 示例图片素材 */}
                  <div className="group relative aspect-square bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-colors cursor-pointer">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 group-hover:text-indigo-600">
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-xs">上传图片</span>
                    </div>
                  </div>
                  <div className="group relative aspect-square bg-slate-100 rounded-lg border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium">示例素材</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  拖拽图片到画布中使用，支持 JPG、PNG 格式
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  功能操作区
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={resetViewport} className="text-xs">
                    重置视图
                  </Button>
                  <Button variant="outline" size="sm" onClick={fitToContent} className="text-xs">
                    适应内容
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetBoard} className="text-xs">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    清空画布
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving} className="text-xs">
                    {isSaving ? <LoadingSpinner className="w-3 h-3 mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                    保存草稿
                  </Button>
                </div>
                <Button size="sm" onClick={handleGenerate} disabled={isGenerating} className="w-full">
                  {isGenerating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  生成创意图片
                </Button>
                <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                  <div className="font-medium mb-1">画布状态</div>
                  <div>图片数量: {images.length}</div>
                  <div>连线数量: {connections.length}</div>
                  <div>缩放比例: {Math.round(viewport.scale * 100)}%</div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">生成结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                {generations.length === 0 && (
                  <div className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4">
                    暂无生成记录。完成画布后点击"生成图片"，结果将展示在这里。
                  </div>
                )}
                {generations.map((item) => (
                  <div key={item.preview_id} className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        {item.title || "创意合成"}
                      </div>
                      <Badge variant={item.status === "completed" ? "default" : item.status === "failed" ? "destructive" : "outline"}>
                        {item.status === "pending" && "排队中"}
                        {item.status === "processing" && "生成中"}
                        {item.status === "completed" && "已完成"}
                        {item.status === "failed" && "生成失败"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.prompt}</p>
                    {item.image_url && (
                      <div className="relative overflow-hidden rounded-lg border border-slate-200">
                        <img src={item.image_url} alt={item.title} className="w-full object-cover" />
                        <a
                          href={item.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs text-slate-700 shadow"
                        >
                          <Download className="w-3 h-3" />
                          下载
                        </a>
                      </div>
                    )}
                    {item.status === "failed" && item.error_message && (
                      <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {item.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {(error || statusMessage) && (
          <div className="space-y-2">
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">{error}</div>}
            {statusMessage && <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-2">{statusMessage}</div>}
          </div>
        )}
      </div>
    </MainLayout>
  );



  return (
    <MainLayout>
      <div className="flex flex-col gap-6 pb-24">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-500" />
            星辰创意画板
          </h1>
          <p className="text-slate-600 max-w-4xl leading-relaxed">
            自由拖拽画布中的图片、创建连线描述关系，AI 会依据当前布局生成新的合成图，原画布始终保持可编辑。
          </p>
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6">
          <Card className="col-span-1">
            <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-xl">创意画布</CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700">草稿名称</span>
                    <Input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="h-9 w-48" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700">创意备注</span>
                    <Input
                      value={boardNotes}
                      onChange={(event) => setBoardNotes(event.target.value)}
                      className="h-9 w-64"
                      placeholder="记录灵感或执行要点"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={resetBoard}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  清空画布
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
                  {isSaving ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-1" />}
                  保存草稿
                </Button>
                <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? <LoadingSpinner className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  上传图片（支持拖拽）
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={boardRef}
                className={`relative rounded-2xl border border-slate-200 overflow-hidden transition-shadow ${isDragActive ? "ring-4 ring-indigo-300 ring-offset-2" : ""}`}
                style={boardStyle}
              >
                {isLoading && (
                  <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                    <LoadingSpinner className="w-8 h-8 text-indigo-500" />
                  </div>
                )}
                <div
                  {...getRootProps({
                    className: "absolute inset-0 z-10",
                  })}
                >
                  <input {...getInputProps()} />
                  {isDragActive && (
                    <div className="absolute inset-0 bg-indigo-500/15 backdrop-blur-sm flex items-center justify-center text-indigo-700 font-medium">
                      松开鼠标即可添加图片
                    </div>
                  )}
                </div>

                {renderConnections()}

                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`absolute group rounded-xl border-2 border-transparent hover:border-indigo-500 shadow-lg transition-all ${connectSourceId === img.id ? "border-dashed border-indigo-600" : ""}`}
                    style={{
                      left: img.bounds.position.x,
                      top: img.bounds.position.y,
                      width: img.bounds.size.width,
                      height: img.bounds.size.height,
                      zIndex: img.zIndex,
                      cursor: "grab",
                    }}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      const canvasEl = canvasRef.current;
                      if (!canvasEl) {
                        return;
                      }
                      const rect = canvasEl.getBoundingClientRect();
                      dragOffset.current = {
                        offsetX: event.clientX - rect.left - canvasToScreen(img.bounds.position.x, img.bounds.position.y).x,
                        offsetY: event.clientY - rect.top - canvasToScreen(img.bounds.position.x, img.bounds.position.y).y,
                      };
                      setDraggingImageId(img.id);
                    }}
                  >
                    <img src={img.url} alt={img.name || "board-image"} className="w-full h-full object-cover rounded-lg" draggable={false} />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded-full bg-white/90 text-slate-700 shadow"
                        onClick={(event) => {
                          event.stopPropagation();
                          beginConnection(img.id);
                        }}
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-full bg-white/90 text-red-500 shadow"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteImage(img.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-3 right-3 bg-white/90 rounded-full px-3 py-1 text-xs text-slate-600 shadow-sm flex items-center gap-2">
                      <ImagePlus className="w-3 h-3" />
                      {img.name || "未命名图片"}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="col-span-1 flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">操作面板</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm text-slate-600">画布提示</span>
                  <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
                    <li>拖动图片自动吸附网格，方便保持排版整齐。</li>
                    <li>点击图片右上角的链接按钮，再选中另一张图片即可创建虚线连线。</li>
                    <li>点击连线标签可快速编辑描述文本，用于指导 AI 生成。</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">生成结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-y-auto max-h-[420px] pr-2">
                {generations.length === 0 && (
                  <div className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4">
                    暂无生成记录。完成画布后点击"生成图片"，结果将展示在这里。
                  </div>
                )}
                {generations.map((item) => (
                  <div key={item.preview_id} className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm space-y-2">
                    <div className="flex items-center justify涔嬮棿">
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        {item.title || "创意合成"}
                      </div>
                      <Badge variant={item.status === "completed" ? "default" : item.status === "failed" ? "destructive" : "outline"}>
                        {item.status === "pending" && "排队中"}
                        {item.status === "processing" && "生成中"}
                        {item.status === "completed" && "已完成"}
                        {item.status === "failed" && "生成失败"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.prompt}</p>
                    {item.image_url && (
                      <div className="relative overflow-hidden rounded-lg border border-slate-200">
                        <img src={item.image_url} alt={item.title} className="w-full object-cover" />
                        <a
                          href={item.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs text-slate-700 shadow"
                        >
                          <Download className="w-3 h-3" />
                          下载
                        </a>
                      </div>
                    )}
                    {item.status === "failed" && item.error_message && (
                      <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {item.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {(error || statusMessage) && (
          <div className="space-y-2">
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">{error}</div>}
            {statusMessage && <div className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-2">{statusMessage}</div>}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
