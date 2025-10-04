"""Workflow execution engine for the creative board canvas."""

from __future__ import annotations

import asyncio
import logging
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple

from ai_types import (
    CanvasWorkflowDefinition,
    CreativeBoardSnapshot,
    CreativeBoardWorkflowRunOptions,
    LLMDirectiveResolution,
    WorkflowExecutionListItem,
    WorkflowExecutionState,
    WorkflowNodeDefinition,
    WorkflowNodeRunStatus,
    WorkflowNodeState,
    WorkflowNodeType,
    WorkflowRunStatus,
    WorkflowEdge,
    WorkflowPort,
    WorkflowNodeConfig,
)

logger = logging.getLogger(__name__)


class WorkflowValidationError(Exception):
    """Raised when a workflow definition fails validation."""


class WorkflowExecutionError(Exception):
    """Raised when the workflow execution cannot proceed."""


@dataclass
class OperationResult:
    """Normalized output returned by a workflow node."""

    node_id: str
    asset_url: Optional[str] = None
    prompt: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def materialize_metadata(self) -> Dict[str, Any]:
        data = dict(self.metadata)
        if self.prompt is not None:
            data.setdefault("prompt", self.prompt)
        if self.asset_url is not None:
            data.setdefault("asset_url", self.asset_url)
        return data


@dataclass
class WorkflowExecution:
    """In-memory representation of a workflow run."""

    workflow_id: str
    board_id: str
    snapshot: CreativeBoardSnapshot
    definition: CanvasWorkflowDefinition
    options: CreativeBoardWorkflowRunOptions
    state: WorkflowExecutionState
    owner_id: Optional[str] = None
    results: Dict[str, OperationResult] = field(default_factory=dict)
    final_prompt: Optional[str] = None
    task_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    node_lookup: Dict[str, WorkflowNodeDefinition] = field(default_factory=dict)
    edges_by_source: Dict[str, List[WorkflowEdge]] = field(default_factory=dict)
    edges_by_target: Dict[str, List[WorkflowEdge]] = field(default_factory=dict)
    topological_order: List[str] = field(default_factory=list)

    def rebuild_graph(self) -> None:
        """Synchronize cached structures after definition changes."""

        self.node_lookup = {node.id: node for node in self.definition.nodes}
        self.edges_by_source = {node_id: [] for node_id in self.node_lookup.keys()}
        self.edges_by_target = {node_id: [] for node_id in self.node_lookup.keys()}

        cleaned_edges: List[WorkflowEdge] = []
        for edge in self.definition.edges:
            if edge.source.node_id not in self.node_lookup or edge.target.node_id not in self.node_lookup:
                logger.debug("Dropping dangling edge %s", edge.id)
                continue
            self.edges_by_source.setdefault(edge.source.node_id, []).append(edge)
            self.edges_by_target.setdefault(edge.target.node_id, []).append(edge)
            cleaned_edges.append(edge)
        self.definition.edges = cleaned_edges

        for node in self.definition.nodes:
            inbound = [edge.source.node_id for edge in self.edges_by_target.get(node.id, [])]
            node.input_ids = inbound

        state_map = {ns.node_id: ns for ns in self.state.node_states}
        for node in self.definition.nodes:
            node_state = state_map.get(node.id)
            if not node_state:
                node_state = WorkflowNodeState(node_id=node.id)
                self.state.node_states.append(node_state)
            node_state.upstream_ids = [edge.source.node_id for edge in self.edges_by_target.get(node.id, [])]
        self.state.node_states = [ns for ns in self.state.node_states if ns.node_id in self.node_lookup]

        self.topological_order = _compute_topological_order(self.definition.nodes, self.edges_by_source)

    def snapshot_state(self) -> WorkflowExecutionState:
        """Return a deep copy of the current execution state."""

        return self.state.model_copy(deep=True)


def _compute_topological_order(
    nodes: Sequence[WorkflowNodeDefinition],
    edges_by_source: Dict[str, List[WorkflowEdge]],
) -> List[str]:
    """Return a valid topological ordering for the DAG."""

    in_degree: Dict[str, int] = {node.id: 0 for node in nodes}
    for source_id, edges in edges_by_source.items():
        for edge in edges:
            in_degree[edge.target.node_id] = in_degree.get(edge.target.node_id, 0) + 1
            in_degree.setdefault(edge.source.node_id, 0)

    queue = deque(node_id for node_id, degree in in_degree.items() if degree == 0)
    ordering: List[str] = []

    while queue:
        node_id = queue.popleft()
        ordering.append(node_id)
        for edge in edges_by_source.get(node_id, []):
            target_id = edge.target.node_id
            in_degree[target_id] -= 1
            if in_degree[target_id] == 0:
                queue.append(target_id)

    if len(ordering) != len(nodes):
        raise WorkflowValidationError("Workflow graph contains cycles or disconnected nodes")

    return ordering


def _unique_prompts(prompts: Iterable[str]) -> List[str]:
    seen: Set[str] = set()
    ordered: List[str] = []
    for prompt in prompts:
        if not prompt:
            continue
        normalized = prompt.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        ordered.append(normalized)
    return ordered


def _collect_downstream(execution: WorkflowExecution, node_ids: Set[str]) -> Set[str]:
    """Return node ids that are downstream from the provided set (inclusive)."""

    visited = set(node_ids)
    queue = deque(node_ids)
    while queue:
        current = queue.popleft()
        for edge in execution.edges_by_source.get(current, []):
            target_id = edge.target.node_id
            if target_id in visited:
                continue
            visited.add(target_id)
            queue.append(target_id)
    return visited


class WorkflowEngine:
    """High-level manager responsible for building and executing workflows."""

    def __init__(self) -> None:
        self._executions: Dict[str, WorkflowExecution] = {}
        self._lock = asyncio.Lock()

    async def start_workflow(
        self,
        board_id: str,
        snapshot: CreativeBoardSnapshot,
        *,
        options: Optional[CreativeBoardWorkflowRunOptions] = None,
        owner_id: Optional[str] = None,
    ) -> WorkflowExecution:
        definition = self._ensure_definition(snapshot)
        workflow_id = str(uuid.uuid4())
        state = WorkflowExecutionState(
            workflow_id=workflow_id,
            board_id=board_id,
            node_states=[],
            status=WorkflowRunStatus.NOT_STARTED,
            started_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            board_id=board_id,
            snapshot=snapshot,
            definition=definition,
            options=options or CreativeBoardWorkflowRunOptions(),
            state=state,
            owner_id=owner_id,
        )
        execution.rebuild_graph()

        async with self._lock:
            self._executions[workflow_id] = execution

        await self._run_execution(execution, None)
        return execution

    async def recompute_workflow(
        self,
        workflow_id: str,
        *,
        snapshot: Optional[CreativeBoardSnapshot] = None,
        options: Optional[CreativeBoardWorkflowRunOptions] = None,
        node_ids: Optional[List[str]] = None,
    ) -> WorkflowExecution:
        execution = self._executions.get(workflow_id)
        if not execution:
            raise WorkflowExecutionError(f"Unknown workflow_id: {workflow_id}")

        if snapshot is not None:
            execution.snapshot = snapshot
            execution.definition = snapshot.workflow or self._derive_workflow(snapshot)
        if options is not None:
            execution.options = options

        execution.state.status = WorkflowRunStatus.NOT_STARTED
        execution.state.error_message = None
        execution.state.started_at = datetime.utcnow()
        execution.state.finished_at = None
        execution.final_prompt = None

        execution.rebuild_graph()

        dirty = set(node_ids or execution.topological_order)
        dirty = _collect_downstream(execution, dirty)

        previous_results = dict(execution.results)
        execution.results = {node_id: res for node_id, res in previous_results.items() if node_id not in dirty}

        state_map = {ns.node_id: ns for ns in execution.state.node_states}
        for node_id, node_state in state_map.items():
            if node_id in dirty:
                node_state.status = WorkflowNodeRunStatus.IDLE
                node_state.started_at = None
                node_state.finished_at = None
                node_state.progress = 0.0
                node_state.output_asset = None
                node_state.output_metadata = {}
                node_state.error_message = None
                node_state.cached = False
            else:
                cached_result = execution.results.get(node_id)
                if cached_result:
                    node_state.status = WorkflowNodeRunStatus.COMPLETED
                    node_state.output_asset = cached_result.asset_url
                    node_state.output_metadata = cached_result.materialize_metadata()
                    node_state.cached = True

        await self._run_execution(execution, dirty)
        return execution

    def list_executions(
        self,
        *,
        board_id: Optional[str] = None,
        owner_id: Optional[str] = None,
    ) -> List[WorkflowExecutionListItem]:
        entries: List[WorkflowExecutionListItem] = []
        for execution in self._executions.values():
            if board_id and execution.board_id != board_id:
                continue
            if owner_id and execution.owner_id != owner_id:
                continue
            entries.append(
                WorkflowExecutionListItem(
                    workflow_id=execution.workflow_id,
                    board_id=execution.board_id,
                    status=execution.state.status,
                    created_at=execution.created_at,
                    updated_at=execution.updated_at,
                )
            )
        entries.sort(key=lambda item: item.updated_at, reverse=True)
        return entries

    def get_execution(self, workflow_id: str) -> WorkflowExecution:
        execution = self._executions.get(workflow_id)
        if not execution:
            raise WorkflowExecutionError(f"Unknown workflow_id: {workflow_id}")
        return execution

    def get_state(self, workflow_id: str) -> WorkflowExecutionState:
        return self.get_execution(workflow_id).snapshot_state()

    def attach_task(self, workflow_id: str, task_id: str) -> None:
        execution = self._executions.get(workflow_id)
        if not execution:
            return
        execution.task_id = task_id
        execution.updated_at = datetime.utcnow()

    def update_output_asset(self, workflow_id: str, asset_url: Optional[str]) -> None:
        execution = self._executions.get(workflow_id)
        if not execution:
            return
        output_ids = execution.definition.output_ids or []
        timestamp = datetime.utcnow()
        for node_id in output_ids:
            node_state = next((ns for ns in execution.state.node_states if ns.node_id == node_id), None)
            if not node_state:
                continue
            node_state.output_asset = asset_url
            metadata = dict(node_state.output_metadata or {})
            if asset_url:
                metadata["final_asset_url"] = asset_url
            node_state.output_metadata = metadata
            node_state.finished_at = node_state.finished_at or timestamp
        execution.updated_at = timestamp

    def _ensure_definition(self, snapshot: CreativeBoardSnapshot) -> CanvasWorkflowDefinition:
        if snapshot.workflow and snapshot.workflow.nodes:
            return snapshot.workflow
        return self._derive_workflow(snapshot)

    def _derive_workflow(self, snapshot: CreativeBoardSnapshot) -> CanvasWorkflowDefinition:
        nodes: List[WorkflowNodeDefinition] = []
        edges: List[WorkflowEdge] = []
        image_to_node: Dict[str, str] = {}

        for image in snapshot.images:
            node_id = f"image-{image.id}"
            config = WorkflowNodeConfig(
                prompt=image.description or image.caption or image.name,
                parameters={}
            )
            node = WorkflowNodeDefinition(
                id=node_id,
                type=WorkflowNodeType.INPUT_IMAGE,
                title=image.name or "Image",
                description=image.description,
                config=config,
                metadata={"image_id": image.id},
                created_at=image.created_at,
                updated_at=image.updated_at,
            )
            nodes.append(node)
            image_to_node[image.id] = node_id

        for connection in snapshot.connections:
            source_node_id = image_to_node.get(connection.source.image_id)
            target_node_id = image_to_node.get(connection.target.image_id)
            if not source_node_id or not target_node_id:
                continue
            label = None
            if connection.label and connection.label.text:
                label = connection.label.text.strip()
            edge = WorkflowEdge(
                id=connection.id,
                source=WorkflowPort(node_id=source_node_id, port=connection.source.anchor.value),
                target=WorkflowPort(node_id=target_node_id, port=connection.target.anchor.value),
                label=label or None,
                created_at=connection.created_at,
                updated_at=connection.updated_at,
            )
            edges.append(edge)
            if label:
                target_node = next((item for item in nodes if item.id == target_node_id), None)
                if target_node:
                    prompts = target_node.config.parameters.setdefault("prompts", [])
                    prompts.append(label)

        incoming: Dict[str, int] = {node.id: 0 for node in nodes}
        outgoing: Dict[str, int] = {node.id: 0 for node in nodes}
        for edge in edges:
            incoming[edge.target.node_id] = incoming.get(edge.target.node_id, 0) + 1
            outgoing[edge.source.node_id] = outgoing.get(edge.source.node_id, 0) + 1

        entry_ids = [node_id for node_id, degree in incoming.items() if degree == 0]
        output_node_id = "output"
        output_node = WorkflowNodeDefinition(
            id=output_node_id,
            type=WorkflowNodeType.OUTPUT,
            title="Final Output",
            config=WorkflowNodeConfig(),
            metadata={"auto": True},
        )
        nodes.append(output_node)

        for node_id, degree in outgoing.items():
            if degree == 0:
                edges.append(
                    WorkflowEdge(
                        id=f"auto-{node_id}-output",
                        source=WorkflowPort(node_id=node_id),
                        target=WorkflowPort(node_id=output_node_id),
                        label=None,
                    )
                )
        if not entry_ids:
            entry_ids = [node.id for node in nodes if node.id != output_node_id]

        definition = CanvasWorkflowDefinition(
            version="1.0",
            nodes=nodes,
            edges=edges,
            entry_ids=entry_ids,
            output_ids=[output_node_id],
            metadata={"auto_generated": True, "generated_at": datetime.utcnow().isoformat()},
        )
        return definition

    async def _run_execution(
        self,
        execution: WorkflowExecution,
        dirty_nodes: Optional[Set[str]],
    ) -> None:
        state_map = {ns.node_id: ns for ns in execution.state.node_states}
        execution.state.status = WorkflowRunStatus.RUNNING
        execution.state.updated_at = datetime.utcnow()

        for index, node_id in enumerate(execution.topological_order):
            node = execution.node_lookup[node_id]
            node_state = state_map[node_id]

            is_dirty = dirty_nodes is None or node_id in dirty_nodes
            cached_result = execution.results.get(node_id) if not is_dirty else None
            if cached_result:
                node_state.status = WorkflowNodeRunStatus.COMPLETED
                node_state.cached = True
                node_state.output_asset = cached_result.asset_url
                node_state.output_metadata = cached_result.materialize_metadata()
                node_state.finished_at = node_state.finished_at or datetime.utcnow()
                continue

            prerequisites = [edge.source.node_id for edge in execution.edges_by_target.get(node_id, [])]
            if any(state_map[dep].status != WorkflowNodeRunStatus.COMPLETED for dep in prerequisites):
                node_state.status = WorkflowNodeRunStatus.SKIPPED
                node_state.error_message = "Upstream node not completed"
                execution.state.status = WorkflowRunStatus.FAILED
                break

            node_state.status = WorkflowNodeRunStatus.RUNNING
            node_state.started_at = datetime.utcnow()
            node_state.cached = False
            execution.state.current_node_id = node_id
            execution.state.updated_at = datetime.utcnow()

            try:
                upstream_items: List[Tuple[WorkflowEdge, OperationResult]] = []
                for edge in execution.edges_by_target.get(node_id, []):
                    upstream_result = execution.results.get(edge.source.node_id)
                    if upstream_result:
                        upstream_items.append((edge, upstream_result))
                result = await self._evaluate_node(execution, node, upstream_items)
                execution.results[node_id] = result
                node_state.output_asset = result.asset_url
                node_state.output_metadata = result.materialize_metadata()
                node_state.status = WorkflowNodeRunStatus.COMPLETED
                node_state.finished_at = datetime.utcnow()
                execution.updated_at = datetime.utcnow()
            except Exception as exc:  # pylint: disable=broad-except
                logger.exception("Workflow node %s failed", node_id, exc_info=exc)
                node_state.status = WorkflowNodeRunStatus.FAILED
                node_state.error_message = str(exc)
                node_state.finished_at = datetime.utcnow()
                execution.state.status = WorkflowRunStatus.FAILED
                execution.state.error_message = str(exc)
                execution.state.current_node_id = node_id
                execution.state.updated_at = datetime.utcnow()
                # Mark remaining nodes as skipped
                for skipped_id in execution.topological_order[index + 1 :]:
                    skipped_state = state_map[skipped_id]
                    if skipped_state.status not in {
                        WorkflowNodeRunStatus.COMPLETED,
                        WorkflowNodeRunStatus.FAILED,
                    }:
                        skipped_state.status = WorkflowNodeRunStatus.SKIPPED
                        skipped_state.finished_at = datetime.utcnow()
                break

        execution.state.current_node_id = None
        execution.state.finished_at = datetime.utcnow()
        execution.state.updated_at = execution.state.finished_at

        if execution.state.status not in {WorkflowRunStatus.FAILED, WorkflowRunStatus.PARTIAL}:
            if any(ns.status == WorkflowNodeRunStatus.FAILED for ns in execution.state.node_states):
                execution.state.status = WorkflowRunStatus.FAILED
            elif any(ns.status == WorkflowNodeRunStatus.SKIPPED for ns in execution.state.node_states):
                execution.state.status = WorkflowRunStatus.PARTIAL
            else:
                execution.state.status = WorkflowRunStatus.COMPLETED

        execution.final_prompt = self._extract_final_prompt(execution)

    async def _evaluate_node(
        self,
        execution: WorkflowExecution,
        node: WorkflowNodeDefinition,
        upstream_items: Sequence[Tuple[WorkflowEdge, OperationResult]],
    ) -> OperationResult:
        prompts: List[str] = []
        assets: List[str] = []

        for edge, upstream in upstream_items:
            if upstream.prompt:
                prompts.append(upstream.prompt)
            if upstream.metadata.get("prompt"):
                prompts.append(str(upstream.metadata["prompt"]))
            if edge.label:
                resolution = self._resolve_directive(execution, edge, upstream)
                prompts.append(resolution.resolved_prompt)
            if upstream.asset_url:
                assets.append(upstream.asset_url)

        if node.config.prompt:
            prompts.append(node.config.prompt)
        for extra_prompt in node.config.parameters.get("prompts", []):
            prompts.append(extra_prompt)

        combined_prompts = _unique_prompts(prompts)
        combined_prompt = ", ".join(combined_prompts) if combined_prompts else None

        if node.type == WorkflowNodeType.INPUT_IMAGE:
            image_id = node.metadata.get("image_id") if node.metadata else None
            image = next((item for item in execution.snapshot.images if item.id == image_id), None)
            asset_url = image.url if image else None
            prompt_value = combined_prompt or (image.description if image else None) or node.title
            metadata = {
                "prompt": prompt_value,
                "image_id": image_id,
                "source": image.source.value if image else None,
            }
            return OperationResult(node_id=node.id, asset_url=asset_url, prompt=prompt_value, metadata=metadata)

        if node.type in {WorkflowNodeType.PROMPT, WorkflowNodeType.LLM_DIRECTIVE}:
            prompt_value = combined_prompt or node.config.prompt or ""
            metadata = {"prompt": prompt_value}
            return OperationResult(node_id=node.id, prompt=prompt_value, metadata=metadata)

        if node.type in {WorkflowNodeType.STYLE_TRANSFER, WorkflowNodeType.COMPOSITE, WorkflowNodeType.UPSCALE}:
            asset_url = assets[0] if assets else None
            prompt_value = combined_prompt or node.config.prompt or ""
            metadata = {
                "prompt": prompt_value,
                "inputs": [upstream.node_id for _, upstream in upstream_items],
            }
            return OperationResult(node_id=node.id, asset_url=asset_url, prompt=prompt_value, metadata=metadata)

        if node.type == WorkflowNodeType.OUTPUT:
            prompt_value = combined_prompt or node.config.prompt or ""
            metadata = {
                "prompt": prompt_value,
                "inputs": [upstream.node_id for _, upstream in upstream_items],
            }
            execution.final_prompt = prompt_value
            return OperationResult(node_id=node.id, prompt=prompt_value, metadata=metadata)

        # Default: fall back to last upstream result
        if upstream_items:
            edge, upstream = upstream_items[-1]
            prompt_value = combined_prompt or upstream.prompt
            metadata = dict(upstream.metadata)
            if prompt_value:
                metadata["prompt"] = prompt_value
            return OperationResult(node_id=node.id, asset_url=upstream.asset_url, prompt=prompt_value, metadata=metadata)

        prompt_value = combined_prompt or node.config.prompt or node.title
        return OperationResult(node_id=node.id, prompt=prompt_value, metadata={"prompt": prompt_value})

    def _resolve_directive(
        self,
        execution: WorkflowExecution,
        edge: WorkflowEdge,
        upstream: OperationResult,
    ) -> LLMDirectiveResolution:
        text = edge.label.strip() if edge.label else ""
        if not text:
            return LLMDirectiveResolution(
                connection_id=edge.id,
                original_text="",
                resolved_prompt="",
                parameters={},
                confidence=0.0,
            )

        resolved_text = text
        confidence = 0.35
        if execution.options.use_llm:
            # Placeholder: in future integrate with an actual LLM service
            resolved_text = text.replace("把", "将").strip()
            confidence = 0.75

        return LLMDirectiveResolution(
            connection_id=edge.id,
            original_text=text,
            resolved_prompt=resolved_text,
            suggested_node_type=WorkflowNodeType.CUSTOM,
            parameters={},
            confidence=confidence,
        )

    def _extract_final_prompt(self, execution: WorkflowExecution) -> Optional[str]:
        output_ids = execution.definition.output_ids or []
        for node_id in output_ids:
            result = execution.results.get(node_id)
            if result and (result.prompt or result.metadata.get("prompt")):
                return result.prompt or str(result.metadata.get("prompt"))
        prompts: List[str] = []
        for node_id in execution.topological_order:
            result = execution.results.get(node_id)
            if not result:
                continue
            if result.prompt:
                prompts.append(result.prompt)
            elif result.metadata.get("prompt"):
                prompts.append(str(result.metadata["prompt"]))
        ordered = _unique_prompts(prompts)
        return ", ".join(ordered) if ordered else None


workflow_engine = WorkflowEngine()
