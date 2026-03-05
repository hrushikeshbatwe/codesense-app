"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type NodeTypes,
  BackgroundVariant,
} from "@xyflow/react";
import type { MouseEvent } from "react";
import "@xyflow/react/dist/style.css";
import { useEffect, useCallback } from "react";
import { applyDagreLayout } from "@/lib/layout";
import type { CodeNode, CodeEdge, NodeKind } from "@/types/flow.types";
import { FunctionNode } from "./nodes/FunctionNode";
import { ConditionalNode } from "./nodes/ConditionalNode";
import { ApiCallNode } from "./nodes/ApiCallNode";
import { LoopNode } from "./nodes/LoopNode";
import { ReturnNode } from "./nodes/ReturnNode";
import { ImportNode } from "./nodes/ImportNode";

// Must be defined OUTSIDE the component to avoid React Flow re-registration
const nodeTypes: NodeTypes = {
  function: FunctionNode as never,
  component: FunctionNode as never,
  conditional: ConditionalNode as never,
  apiCall: ApiCallNode as never,
  loop: LoopNode as never,
  return: ReturnNode as never,
  import: ImportNode as never,
};

const NODE_COLOR: Record<NodeKind, string> = {
  function: "#93c5fd",
  component: "#60a5fa",
  conditional: "#fcd34d",
  loop: "#86efac",
  apiCall: "#fca5a5",
  return: "#6ee7b7",
  import: "#d1d5db",
  variable: "#e5e7eb",
};

interface FlowChartProps {
  nodes: CodeNode[];
  edges: CodeEdge[];
  onNodeClick?: (node: CodeNode) => void;
  showImports?: boolean;
  showLoops?: boolean;
}

function FlowChartInner({
  nodes: rawNodes,
  edges: rawEdges,
  onNodeClick,
  showImports = true,
  showLoops = true,
}: FlowChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CodeNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CodeEdge>([]);
  const { fitView } = useReactFlow();

  useEffect(() => {
    let filtered = rawNodes;
    if (!showImports) filtered = filtered.filter((n) => n.data.kind !== "import");
    if (!showLoops) filtered = filtered.filter((n) => n.data.kind !== "loop");

    const visibleIds = new Set(filtered.map((n) => n.id));
    const filteredEdges = rawEdges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );

    const laid = applyDagreLayout(filtered, filteredEdges);
    setNodes(laid);
    setEdges(filteredEdges);

    // Fit view after layout is applied
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
  }, [rawNodes, rawEdges, showImports, showLoops, setNodes, setEdges, fitView]);

  const handleNodeClick = useCallback(
    (_: MouseEvent, node: CodeNode) => {
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
      <Controls />
      <MiniMap
        nodeColor={(node) => NODE_COLOR[(node as CodeNode).data?.kind as NodeKind] ?? "#e5e7eb"}
        maskColor="rgba(255,255,255,0.7)"
      />
    </ReactFlow>
  );
}

// Wrap in ReactFlowProvider so useReactFlow works inside FlowChartInner
import { ReactFlowProvider } from "@xyflow/react";

export function FlowChart(props: FlowChartProps) {
  return (
    <ReactFlowProvider>
      <FlowChartInner {...props} />
    </ReactFlowProvider>
  );
}
