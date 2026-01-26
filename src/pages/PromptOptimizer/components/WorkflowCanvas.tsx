import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Graph, Shape } from '@antv/x6';
import { message } from 'antd';
import type { WorkflowNodeData, WorkflowNodeType, WorkflowSnapshot } from '../types';

export interface WorkflowCanvasHandle {
  addNode: (type: WorkflowNodeType) => void;
  deleteSelected: () => void;
  getSnapshot: () => WorkflowSnapshot | null;
  updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
}

interface WorkflowCanvasProps {
  activeNodeId: string | null;
  failedNodeId?: string | null;
  onSelectNode: (node: { id: string; data: WorkflowNodeData } | null) => void;
}

const STORAGE_KEY = 'optimizer_workflow_x6_graph';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (target.isContentEditable) return true;
  return false;
}

function getInvalidConnectionReason(graph: Graph, sourceId: string, targetId: string, edgeId?: string): string | null {
  if (!sourceId || !targetId) return '连接失败：连接信息不完整';
  if (sourceId === targetId) return '连接规则：禁止回环';

  const target = graph.getCellById(targetId) as any;
  const targetData = target?.getData?.() as WorkflowNodeData | undefined;
  if (isStartNode(targetData)) return '连接规则：Start 只能作为起点';

  const outCount = graph.getEdges().filter((e: any) => e.id !== edgeId && e.getSourceCellId?.() === sourceId).length;
  if (outCount >= 1) return '连接规则：每个节点最多 1 条出边（禁止分叉）';

  const inCount = graph.getEdges().filter((e: any) => e.id !== edgeId && e.getTargetCellId?.() === targetId).length;
  if (inCount >= 1) return '连接规则：每个节点最多 1 条入边';

  const wouldCycle = (() => {
    const visited = new Set<string>();
    const stack: string[] = [targetId];
    while (stack.length) {
      const cur = stack.pop()!;
      if (cur === sourceId) return true;
      if (visited.has(cur)) continue;
      visited.add(cur);
      graph.getEdges().forEach((e: any) => {
        if (e.id === edgeId) return;
        if (e.getSourceCellId?.() === cur) {
          const next = e.getTargetCellId?.();
          if (next) stack.push(next);
        }
      });
    }
    return false;
  })();
  if (wouldCycle) return '连接规则：禁止回环';

  return null;
}

function ensureStartNode(graph: Graph, baseNodeConfig: any) {
  const nodes = graph.getNodes() as any[];
  const hasStart = nodes.some((n) => (n.getData?.() as WorkflowNodeData | undefined)?.type === 'start');
  if (hasStart) return;

  if (nodes.length === 0) {
    graph.addNode({
      ...baseNodeConfig,
      id: `node-${Date.now()}-start`,
      x: 60,
      y: 80,
      data: createNodeData('start'),
    });
    return;
  }

  const nodeIds = nodes.map((n) => n.id);
  const indegree = new Map<string, number>();
  nodeIds.forEach((id) => indegree.set(id, 0));
  graph.getEdges().forEach((e: any) => {
    const t = e.getTargetCellId?.();
    if (t && indegree.has(t)) indegree.set(t, (indegree.get(t) ?? 0) + 1);
  });

  const roots = nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0);
  const target = (roots.length > 0 ? roots : nodes)
    .slice()
    .sort((a, b) => {
      const ax = a.getPosition?.().x ?? 0;
      const bx = b.getPosition?.().x ?? 0;
      return ax - bx;
    })[0];

  const pos = target.getPosition?.() ?? { x: 300, y: 80 };
  const start = graph.addNode({
    ...baseNodeConfig,
    id: `node-${Date.now()}-start`,
    x: Math.max(60, pos.x - 240),
    y: pos.y,
    data: createNodeData('start'),
  });

  graph.addEdge({ source: { cell: start.id, port: 'out' }, target: { cell: target.id, port: 'in' } });
}

function getDefaultLabel(type: WorkflowNodeType): string {
  switch (type) {
    case 'start':
      return 'Start';
    case 'architect':
      return 'Architect';
    case 'redteamer':
      return 'RedTeamer';
    case 'judge':
      return 'Judge';
    case 'adapter':
      return 'Adapter';
    case 'prompt_shorten':
      return '提示词精简';
    case 'prompt_expand':
      return '提示词扩充';
    case 'style_formal':
      return '风格调整（更正式）';
    case 'style_casual':
      return '风格调整（更口语）';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function getNodeStyle(type: WorkflowNodeType) {
  switch (type) {
    case 'start':
      return { fill: '#F3F4F6', stroke: '#111827' };
    case 'architect':
      return { fill: '#EEF2FF', stroke: '#6366F1' };
    case 'redteamer':
      return { fill: '#FEF2F2', stroke: '#EF4444' };
    case 'judge':
      return { fill: '#FFFBEB', stroke: '#F59E0B' };
    case 'adapter':
      return { fill: '#ECFDF5', stroke: '#10B981' };
    case 'prompt_shorten':
      return { fill: '#F5F3FF', stroke: '#8B5CF6' };
    case 'prompt_expand':
      return { fill: '#F0FDFA', stroke: '#14B8A6' };
    case 'style_formal':
      return { fill: '#EFF6FF', stroke: '#3B82F6' };
    case 'style_casual':
      return { fill: '#FDF2F8', stroke: '#EC4899' };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function createNodeData(type: WorkflowNodeType): WorkflowNodeData {
  return {
    type,
    label: getDefaultLabel(type),
    config: {},
  };
}

function isStartNode(data: WorkflowNodeData | null | undefined): boolean {
  return data?.type === 'start';
}

function toSnapshot(graph: Graph): WorkflowSnapshot {
  const nodes = graph.getNodes().map((n: { id: string; getData: () => unknown }) => {
    const data = n.getData() as WorkflowNodeData;
    return {
      id: n.id,
      data,
    };
  });

  const edges = graph.getEdges().map((e: { id: string; getSourceCellId: () => string | null; getTargetCellId: () => string | null }) => ({
    id: e.id,
    source: e.getSourceCellId() || '',
    target: e.getTargetCellId() || '',
  }));

  return { nodes, edges };
}

function safeLoadGraphJson(graph: Graph) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const json = JSON.parse(raw);
    graph.fromJSON(json);
    return true;
  } catch {
    return false;
  }
}

function safeSaveGraphJson(graph: Graph) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graph.toJSON()));
  } catch {
    // ignore
  }
}

const WorkflowCanvas = forwardRef<WorkflowCanvasHandle, WorkflowCanvasProps>(function WorkflowCanvas(
  { activeNodeId, failedNodeId, onSelectNode }: WorkflowCanvasProps,
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const selectedCellIdRef = useRef<string | null>(null);
  const activeNodeIdRef = useRef<string | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

  const baseNodeConfig = useMemo(
    () => ({
      width: 200,
      height: 56,
      attrs: {
        body: {
          rx: 12,
          ry: 12,
          strokeWidth: 2,
        },
        label: {
          fontSize: 14,
          fontWeight: 600,
          fill: '#111827',
        },
      },
      ports: {
        groups: {
          in: {
            position: 'left',
            attrs: {
              circle: {
                r: 6,
                magnet: true,
                stroke: '#9CA3AF',
                strokeWidth: 2,
                fill: '#FFFFFF',
              },
            },
          },
          out: {
            position: 'right',
            attrs: {
              circle: {
                r: 6,
                magnet: true,
                stroke: '#9CA3AF',
                strokeWidth: 2,
                fill: '#FFFFFF',
              },
            },
          },
        },
        items: [
          { id: 'in', group: 'in' },
          { id: 'out', group: 'out' },
        ],
      },
    }),
    []
  );

  const syncActiveStyle = (activeId: string | null, failedId: string | null = null) => {
    const graph = graphRef.current;
    if (!graph) return;

    const selectedId = selectedCellIdRef.current;

    graph.getNodes().forEach((node: any) => {
      const data = node.getData() as WorkflowNodeData;
      const style = getNodeStyle(data.type);
      const isActive = activeId === node.id;
      const isFailed = failedId === node.id;
      const isSelected = selectedId === node.id;
      node.setAttrs({
        body: {
          fill: isFailed ? '#FEF2F2' : style.fill,
          stroke: isActive ? '#22C55E' : isFailed ? '#EF4444' : isSelected ? '#3B82F6' : style.stroke,
          strokeWidth: isActive || isFailed || isSelected ? 3 : 2,
        },
        label: {
          text: data.label,
        },
      });

      if (isActive) {
        node.toFront();
      }
    });

    const activeOutgoing = new Set<string>();
    if (activeId) {
      graph.getEdges().forEach((edge: any) => {
        const src = edge.getSourceCellId?.() || '';
        if (src === activeId) {
          activeOutgoing.add(edge.id);
        }
      });
    }

    const failedOutgoing = new Set<string>();
    if (failedId) {
      graph.getEdges().forEach((edge: any) => {
        const src = edge.getSourceCellId?.() || '';
        if (src === failedId) {
          failedOutgoing.add(edge.id);
        }
      });
    }

    graph.getEdges().forEach((edge: any) => {
      const isActiveEdge = activeOutgoing.has(edge.id);
      const isFailedEdge = failedOutgoing.has(edge.id);
      const isSelectedEdge = selectedId === edge.id;
      edge.setAttrs({
        line: {
          class: isActiveEdge ? 'x6-edge-line--active' : '',
          stroke: isActiveEdge ? '#22C55E' : isFailedEdge ? '#EF4444' : isSelectedEdge ? '#3B82F6' : '#6B7280',
          strokeWidth: 2,
          targetMarker: {
            name: 'block',
            width: 12,
            height: 8,
          },
        },
      });
    });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    if (graphRef.current) return;

    const graph = new Graph({
      container: containerRef.current,
      background: { color: 'transparent' },
      grid: { size: 12, visible: true },
      autoResize: true,
      panning: true,
      selecting: {
        enabled: true,
        multiple: false,
        rubberband: false,
        showNodeSelectionBox: true,
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
        minScale: 0.5,
        maxScale: 1.5,
      },
      connecting: {
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowEdge: false,
        highlight: true,
        router: 'manhattan',
        connector: 'rounded',
        snap: { radius: 20 },
        validateConnection() {
          return true;
        },
        createEdge(): any {
          return new Shape.Edge({
            attrs: {
              line: {
                stroke: '#6B7280',
                strokeWidth: 2,
                targetMarker: {
                  name: 'block',
                  width: 12,
                  height: 8,
                },
              },
            },
          });
        },
      },
      history: { enabled: true },
      snapline: { enabled: true },
    } as any);

    graphRef.current = graph;

    const loaded = safeLoadGraphJson(graph);
    if (!loaded) {
      const s = graph.addNode({
        ...baseNodeConfig,
        id: `node-${Date.now()}-start`,
        x: 60,
        y: 80,
        data: createNodeData('start'),
      });
      const a = graph.addNode({
        ...baseNodeConfig,
        id: `node-${Date.now()}-architect`,
        x: 300,
        y: 80,
        data: createNodeData('architect'),
      });
      const r = graph.addNode({
        ...baseNodeConfig,
        id: `node-${Date.now()}-redteamer`,
        x: 540,
        y: 80,
        data: createNodeData('redteamer'),
      });
      const j = graph.addNode({
        ...baseNodeConfig,
        id: `node-${Date.now()}-judge`,
        x: 780,
        y: 80,
        data: createNodeData('judge'),
      });
      const ad = graph.addNode({
        ...baseNodeConfig,
        id: `node-${Date.now()}-adapter`,
        x: 1020,
        y: 80,
        data: createNodeData('adapter'),
      });

      graph.addEdge({ source: { cell: s.id, port: 'out' }, target: { cell: a.id, port: 'in' } });
      graph.addEdge({ source: { cell: a.id, port: 'out' }, target: { cell: r.id, port: 'in' } });
      graph.addEdge({ source: { cell: r.id, port: 'out' }, target: { cell: j.id, port: 'in' } });
      graph.addEdge({ source: { cell: j.id, port: 'out' }, target: { cell: ad.id, port: 'in' } });

      safeSaveGraphJson(graph);
    } else {
      ensureStartNode(graph, baseNodeConfig);
      safeSaveGraphJson(graph);
    }

    graph.on('node:click', (args: any) => {
      const node = args.node;
      if (!node) return;
      selectedCellIdRef.current = node.id;
      const data = node.getData() as WorkflowNodeData;
      onSelectNodeRef.current({ id: node.id, data });
      syncActiveStyle(activeNodeIdRef.current);
    });

    graph.on('edge:click', (args: any) => {
      const edge = args.edge;
      if (!edge) return;
      selectedCellIdRef.current = edge.id;
      onSelectNodeRef.current(null);
      syncActiveStyle(activeNodeIdRef.current);
    });

    graph.on('edge:connected', (args: any) => {
      const edge = args?.edge;
      if (!edge) return;
      const sourceId = edge.getSourceCellId?.() || '';
      const targetId = edge.getTargetCellId?.() || '';

      const reason = getInvalidConnectionReason(graph, sourceId, targetId, edge.id);
      if (reason) {
        message.warning(reason);
        graph.removeCell(edge);
        safeSaveGraphJson(graph);
        selectedCellIdRef.current = null;
        onSelectNodeRef.current(null);
        syncActiveStyle(activeNodeIdRef.current);
      }
    });

    graph.on('blank:click', () => {
      selectedCellIdRef.current = null;
      onSelectNodeRef.current(null);
      syncActiveStyle(activeNodeIdRef.current);
    });

    graph.on('cell:removed', () => {
      safeSaveGraphJson(graph);
      selectedCellIdRef.current = null;
      onSelectNodeRef.current(null);
    });

    graph.on('cell:added', () => {
      safeSaveGraphJson(graph);
    });

    graph.on('cell:change:*', () => {
      safeSaveGraphJson(graph);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      if (isTypingTarget(e.target)) return;
      const selectedId = selectedCellIdRef.current;
      if (!selectedId) return;
      const cell = graph.getCellById(selectedId);
      if (!cell) return;

      e.preventDefault();
      graph.removeCell(cell);
      safeSaveGraphJson(graph);
      selectedCellIdRef.current = null;
      onSelectNodeRef.current(null);
    };

    window.addEventListener('keydown', handleKeyDown);

    syncActiveStyle(null);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      graph.dispose();
      graphRef.current = null;
    };
  }, [baseNodeConfig]);

  useEffect(() => {
    activeNodeIdRef.current = activeNodeId;
    syncActiveStyle(activeNodeId, failedNodeId);
  }, [activeNodeId, failedNodeId]);

  useImperativeHandle(ref, () => ({
    addNode: (type: WorkflowNodeType) => {
      const graph = graphRef.current;
      if (!graph) return;

      const center = graph.getGraphArea().getCenter();
      const data = createNodeData(type);
      const style = getNodeStyle(type);

      const node = graph.addNode({
        ...baseNodeConfig,
        id: `node-${Date.now()}-${type}`,
        x: center.x - 100,
        y: center.y - 28,
        data,
        attrs: {
          body: {
            ...baseNodeConfig.attrs.body,
            fill: style.fill,
            stroke: style.stroke,
          },
          label: {
            ...baseNodeConfig.attrs.label,
            text: data.label,
          },
        },
      });

      selectedCellIdRef.current = node.id;
      onSelectNodeRef.current({ id: node.id, data });
      safeSaveGraphJson(graph);
    },
    deleteSelected: () => {
      const graph = graphRef.current;
      if (!graph) return;
      const selectedId = selectedCellIdRef.current;
      if (!selectedId) return;
      const cell = graph.getCellById(selectedId);
      if (!cell) return;
      graph.removeCell(cell);
      safeSaveGraphJson(graph);
      selectedCellIdRef.current = null;
      onSelectNodeRef.current(null);
    },
    getSnapshot: () => {
      const graph = graphRef.current;
      if (!graph) return null;
      return toSnapshot(graph);
    },
    updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => {
      const graph = graphRef.current;
      if (!graph) return;
      const node = graph.getCellById(nodeId);
      if (!node || !node.isNode()) return;

      const prev = node.getData() as WorkflowNodeData;
      const next: WorkflowNodeData = {
        ...prev,
        ...patch,
        config: { ...prev.config, ...(patch.config ?? {}) },
      };
      node.setData(next);

      const style = getNodeStyle(next.type);
      const isActive = activeNodeId === nodeId;

      node.setAttrs({
        body: {
          fill: style.fill,
          stroke: isActive ? '#22C55E' : style.stroke,
        },
        label: {
          text: next.label,
        },
      });

      safeSaveGraphJson(graph);
      onSelectNodeRef.current({ id: nodeId, data: next });
    },
  }));

  return <div ref={containerRef} className="optimizer-workflow-canvas" />;
});

export default WorkflowCanvas;
