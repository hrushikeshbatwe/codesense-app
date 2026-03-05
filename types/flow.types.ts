import type { Node, Edge } from "@xyflow/react";

export type NodeKind =
  | "function"
  | "component"
  | "conditional"
  | "loop"
  | "apiCall"
  | "return"
  | "import"
  | "variable";

export interface CodeNodeData extends Record<string, unknown> {
  label: string;
  kind: NodeKind;
  name?: string;
  params?: string[];
  lineStart: number;
  lineEnd: number;
  raw?: string;
  isAsync?: boolean;
}

export type CodeNode = Node<CodeNodeData>;

export interface CodeEdgeData extends Record<string, unknown> {
  label?: string;
}

export type CodeEdge = Edge<CodeEdgeData>;

export interface FlowGraph {
  nodes: CodeNode[];
  edges: CodeEdge[];
}
