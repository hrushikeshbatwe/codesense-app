"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const ImportNode = memo(function ImportNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      style={{
        background: selected ? "rgba(100,116,139,0.15)" : "rgba(100,116,139,0.07)",
        border: `1px solid ${selected ? "rgba(100,116,139,0.5)" : "rgba(100,116,139,0.25)"}`,
        borderRadius: "8px",
        padding: "6px 12px",
        minWidth: "150px",
        maxWidth: "220px",
        cursor: "pointer",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#64748b", border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "11px", flexShrink: 0 }}>imp</span>
        <span style={{ fontWeight: 500, fontSize: "12px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: "#64748b", border: "none" }} />
    </div>
  );
});
