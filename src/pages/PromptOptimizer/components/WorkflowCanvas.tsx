import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Graph, Shape } from '@antv/x6';
import { message } from 'antd';
import { getLegacyEnglishLabel, getWorkflowNodeMeta } from '../types';
import type { WorkflowNodeData, WorkflowNodeType, WorkflowSnapshot } from '../types';

export interface WorkflowCanvasHandle {
  addNode: (type: WorkflowNodeType) => void;
  deleteSelected: () => void;
  getSnapshot: () => WorkflowSnapshot | null;
  updateNodeData: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
}

interface WorkflowCanvasProps {
  activeNodeId: string | null;
  completedNodeIds: string[];
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
    case 'length_adjust':
      return { fill: '#F5F3FF', stroke: '#8B5CF6' };
    case 'style_adjust':
      return { fill: '#EFF6FF', stroke: '#3B82F6' };
    case 'interactive':
      return { fill: '#F0F9FF', stroke: '#0EA5E9' };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function createNodeData(type: WorkflowNodeType): WorkflowNodeData {
  const meta = getWorkflowNodeMeta(type);
  return {
    type,
    label: meta.label,
    description: meta.description,
    config:
      type === 'style_adjust'
        ? { styleMode: 'formal' }
        : type === 'length_adjust'
          ? { targetLength: 200 }
          : {},
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
  { activeNodeId, completedNodeIds, failedNodeId, onSelectNode }: WorkflowCanvasProps,
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const selectedCellIdRef = useRef<string | null>(null);
  const activeNodeIdRef = useRef<string | null>(null);
  const completedNodeIdsRef = useRef<string[]>([]);
  const failedNodeIdRef = useRef<string | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

  const baseNodeConfig = useMemo(
    () => ({
      width: 300,
      height: 90,
      markup: [
        { tagName: 'rect', selector: 'glow' },
        { tagName: 'rect', selector: 'body' },
        { tagName: 'rect', selector: 'wave' },
        { tagName: 'foreignObject', selector: 'statusIcon' },
        { tagName: 'text', selector: 'title' },
        { tagName: 'text', selector: 'desc' },
      ],
      attrs: {
        glow: {
          rx: 12,
          ry: 12,
          stroke: '#22C55E',
          strokeWidth: 10,
          fill: 'transparent',
          opacity: 0,
          class: 'optimizer-node-glow',
          pointerEvents: 'none',
        },
        body: {
          rx: 12,
          ry: 12,
          strokeWidth: 2,
          class: 'optimizer-node-body',
        },
        wave: {
          x: 0,
          y: 0,
          width: 300,
          height: 90,
          rx: 12,
          ry: 12,
          fill: 'rgba(34, 197, 94, 0.15)',
          opacity: 0,
          class: 'optimizer-node-wave',
          pointerEvents: 'none',
        },
        statusIcon: {
          x: 14,
          y: 14,
          width: 18,
          height: 18,
          html: '',
        },
        title: {
          x: -135,
          y: -30,
          fontSize: 14,
          fontWeight: 600,
          fill: '#111827',
          textAnchor: 'start',
          dominantBaseline: 'hanging',
          text: '',
        },
        desc: {
          x: -135,
          y: -10,
          fontSize: 12,
          fill: '#6B7280',
          textAnchor: 'start',
          dominantBaseline: 'hanging',
          text: '',
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

  const syncActiveStyle = (activeId: string | null, completedIds: string[], failedId: string | null = null) => {
    const graph = graphRef.current;
    if (!graph) return;

    const selectedId = selectedCellIdRef.current;

    graph.getNodes().forEach((node: any) => {
      const data = node.getData() as WorkflowNodeData;
      const style = getNodeStyle(data.type);
      const isActive = activeId === node.id;
      const isCompleted = completedIds.includes(node.id);
      const isFailed = failedId === node.id;
      const isSelected = selectedId === node.id;

      const meta = getWorkflowNodeMeta(data.type);
      const title = data.label || meta.label;
      let desc = data.description || meta.description;
      
      // 描述文字超出22字符时截断
      if (desc && desc.length > 22) {
        desc = desc.substring(0, 22) + '...';
      }

      const hasStatus = isActive || isFailed || isCompleted;
      const baseX = -135;
      const titleX = hasStatus ? baseX + 20 : baseX;
      const descX = hasStatus ? baseX + 20 : baseX;
      
      let statusIconHtml = '';
      if (isActive) {
        statusIconHtml = '<div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:#F59E0B;font-size:16px;"><svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/><path d="M512 140c-205.4 0-372 166.6-372 372s166.6 372 372 372 372-166.6 372-372-166.6-372-372-372zm0 672c-165.5 0-300-134.5-300-300s134.5-300 300-300 300 134.5 300 300-134.5 300-300 300z"/></svg></div>';
      } else if (isFailed) {
        statusIconHtml = '<div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:#EF4444;font-size:16px;"><svg viewBox="64 64 896 896" width="16" height="16" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 01-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"/></svg></div>';
      } else if (isCompleted) {
        statusIconHtml = '<div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:#22C55E;font-size:16px;"><svg viewBox="64 64 896 896" width="16" height="16" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"/></svg></div>';
      }

      const bodyClassNames = ['optimizer-node-body'];
      if (isActive) {
        bodyClassNames.push('optimizer-node--running', 'optimizer-node-body--running', 'optimizer-node-loader-ants');
      }
      if (isCompleted) {
        bodyClassNames.push('optimizer-node--completed', 'optimizer-node-body--completed');
      }
      if (isFailed) {
        bodyClassNames.push('optimizer-node--failed', 'optimizer-node-body--failed');
      }

      // 设置节点样式
      node.setAttrs({
        glow: {
          opacity: isActive ? 1 : 0,
        },
        body: {
          class: bodyClassNames.join(' '),
          fill: isFailed ? '#FEF2F2' : style.fill,
          stroke: isActive ? '#22C55E' : isFailed ? '#EF4444' : isSelected ? '#3B82F6' : style.stroke,
          strokeWidth: isActive || isFailed || isSelected ? 3 : 2,
        },
        wave: {
          opacity: isActive ? 1 : 0,
        },
        statusIcon: {
          html: statusIconHtml,
        },
        title: {
          x: titleX,
          text: title,
        },
        desc: {
          x: descX,
          text: desc,
        },
      });

      node.toFront();
    });

    // 活跃节点的入边应该显示动画（数据流向活跃节点）
    const activeIncoming = new Set<string>();
    if (activeId) {
      graph.getEdges().forEach((edge: any) => {
        const target = edge.getTargetCellId?.() || '';
        if (target === activeId) {
          activeIncoming.add(edge.id);
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
      const isActiveEdge = activeIncoming.has(edge.id);
      const isFailedEdge = failedOutgoing.has(edge.id);
      const isSelectedEdge = selectedId === edge.id;
      const lineClasses = ['optimizer-edge-line'];
      if (isActiveEdge) {
        lineClasses.push('optimizer-edge-line--active', 'marching-line');
      }
      
      // 设置边的样式
      edge.setAttrs({
        line: {
          stroke: isActiveEdge ? '#22C55E' : isFailedEdge ? '#EF4444' : isSelectedEdge ? '#3B82F6' : '#6B7280',
          strokeWidth: isActiveEdge || isFailedEdge || isSelectedEdge ? 3 : 2,
          strokeDasharray: isActiveEdge ? '8 4' : null,
          strokeDashoffset: isActiveEdge ? 0 : null,
          targetMarker: {
            name: 'block',
            width: 12,
            height: 8,
            fill: isActiveEdge ? '#22C55E' : isFailedEdge ? '#EF4444' : isSelectedEdge ? '#3B82F6' : '#6B7280',
          },
          class: lineClasses.join(' '),
        },
      });
    });
  };

  useEffect(() => {
    const hostElement = containerRef.current;
    if (!hostElement) return;

    hostElement.classList.add('optimizer-virtual-render');
    if (graphRef.current) {
      return () => {
        hostElement.classList.remove('optimizer-virtual-render');
      };
    }

    const graph = new Graph({
      container: hostElement,
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

      graph.getNodes().forEach((node: any) => {
        const prev = node.getData?.() as WorkflowNodeData | undefined;
        if (!prev) return;

        const meta = getWorkflowNodeMeta(prev.type);
        const legacyLabel = getLegacyEnglishLabel(prev.type);
        const shouldLocalizeLabel = legacyLabel ? prev.label === legacyLabel : false;

        const next: WorkflowNodeData = {
          ...prev,
          label: shouldLocalizeLabel ? meta.label : (prev.label || meta.label),
          description: prev.description || meta.description,
          config: prev.config || {},
        };
        node.setData(next);
      });

      safeSaveGraphJson(graph);
    }

    graph.on('node:click', (args: any) => {
      const node = args.node;
      if (!node) return;
      selectedCellIdRef.current = node.id;
      const data = node.getData() as WorkflowNodeData;
      onSelectNodeRef.current({ id: node.id, data });
      syncActiveStyle(activeNodeIdRef.current, completedNodeIds);
    });

    graph.on('edge:click', (args: any) => {
      const edge = args.edge;
      if (!edge) return;
      selectedCellIdRef.current = edge.id;
      onSelectNodeRef.current(null);
      syncActiveStyle(activeNodeIdRef.current, completedNodeIds);
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
        syncActiveStyle(activeNodeIdRef.current, completedNodeIds);
      }
    });

    graph.on('blank:click', () => {
      selectedCellIdRef.current = null;
      onSelectNodeRef.current(null);
      syncActiveStyle(activeNodeIdRef.current, completedNodeIds);
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

    syncActiveStyle(activeNodeIdRef.current, completedNodeIdsRef.current, failedNodeIdRef.current);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      graph.dispose();
      graphRef.current = null;
      hostElement.classList.remove('optimizer-virtual-render');
    };
  }, [baseNodeConfig]);

  useEffect(() => {
    activeNodeIdRef.current = activeNodeId;
    completedNodeIdsRef.current = completedNodeIds;
    failedNodeIdRef.current = failedNodeId ?? null;
    syncActiveStyle(activeNodeId, completedNodeIds, failedNodeId);
  }, [activeNodeId, completedNodeIds, failedNodeId]);

  useImperativeHandle(ref, () => ({
    addNode: (type: WorkflowNodeType) => {
      const graph = graphRef.current;
      if (!graph) return;

      const center = graph.getGraphArea().getCenter();
      const data = createNodeData(type);
      const style = getNodeStyle(type);
      const meta = getWorkflowNodeMeta(type);

      const node = graph.addNode({
        ...baseNodeConfig,
        id: `node-${Date.now()}-${type}`,
        x: center.x - (baseNodeConfig.width / 2),
        y: center.y - (baseNodeConfig.height / 2),
        data,
        attrs: {
          body: {
            ...baseNodeConfig.attrs.body,
            fill: style.fill,
            stroke: style.stroke,
          },
          statusIcon: {
            ...baseNodeConfig.attrs.statusIcon,
            html: '',
          },
          title: {
            ...baseNodeConfig.attrs.title,
            text: data.label || meta.label,
          },
          desc: {
            ...baseNodeConfig.attrs.desc,
            text: data.description || meta.description,
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
      const meta = getWorkflowNodeMeta(next.type);

      const isFailed = failedNodeId === nodeId;
      const isCompleted = completedNodeIds.includes(nodeId);
      const hasStatus = isActive || isFailed || isCompleted;
      const baseX = -135;
      const titleX = hasStatus ? baseX + 20 : baseX;
      const descX = hasStatus ? baseX + 20 : baseX;
      
      // 处理描述文字截断
      let desc = next.description || meta.description;
      if (desc && desc.length > 22) {
        desc = desc.substring(0, 22) + '...';
      }
      
      let statusIconHtml = '';
      if (isActive) {
        statusIconHtml = '<div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:#F59E0B;font-size:16px;"><svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/><path d="M512 140c-205.4 0-372 166.6-372 372s166.6 372 372 372 372-166.6 372-372-166.6-372-372-372zm0 672c-165.5 0-300-134.5-300-300s134.5-300 300-300 300 134.5 300 300-134.5 300-300 300z"/></svg></div>';
      } else if (isFailed) {
        statusIconHtml = '<div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:#EF4444;font-size:16px;"><svg viewBox="64 64 896 896" width="16" height="16" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 01-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"/></svg></div>';
      } else if (isCompleted) {
        statusIconHtml = '<div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;color:#22C55E;font-size:16px;"><svg viewBox="64 64 896 896" width="16" height="16" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"/></svg></div>';
      }

      node.setAttrs({
        body: {
          fill: style.fill,
          stroke: isActive ? '#22C55E' : style.stroke,
        },
        glow: {
          opacity: isActive ? 1 : 0,
        },
        wave: {
          opacity: isActive ? 1 : 0,
        },
        statusIcon: {
          html: statusIconHtml,
        },
        title: {
          x: titleX,
          text: next.label || meta.label,
        },
        desc: {
          x: descX,
          text: next.description || meta.description,
        },
      });

      safeSaveGraphJson(graph);
      onSelectNodeRef.current({ id: nodeId, data: next });
    },
  }));

  return <div ref={containerRef} className="optimizer-workflow-canvas" />;
});

export default WorkflowCanvas;
