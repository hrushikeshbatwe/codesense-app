"use client";

import dagre from "dagre";
import type { CodeNode, CodeEdge } from "@/types/flow.types";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 64;
const RANK_SEP = 80;
const NODE_SEP = 40;

export function applyDagreLayout(
  nodes: CodeNode[],
  edges: CodeEdge[],
  direction: "TB" | "LR" = "TB"
): CodeNode[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: RANK_SEP,
    nodesep: NODE_SEP,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    // Only add edge if both nodes exist in the graph
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(g);

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;
    return {
      ...node,
      position: {
        // Dagre uses center coords; React Flow needs top-left
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      },
    };
  });
}
