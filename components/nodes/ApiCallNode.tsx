"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const ApiCallNode = memo(function ApiCallNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      style={{
        background: selected ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.07)",
        border: `1px solid ${selected ? "rgba(239,68,68,0.6)" : "rgba(239,68,68,0.3)"}`,
        borderRadius: "8px",
        padding: "8px 12px",
        minWidth: "150px",
        maxWidth: "220px",
        cursor: "pointer",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#ef4444", border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#f87171", fontFamily: "var(--font-mono)", fontSize: "11px", flexShrink: 0 }}>api</span>
        <span style={{ fontWeight: 600, fontSize: "13px", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.label}
        </span>
      </div>
      <div style={{ fontSize: "10px", color: "#f87171", marginTop: "2px", fontFamily: "var(--font-mono)" }}>API call</div>
      <Handle type="source" position={Position.Bottom} style={{ background: "#ef4444", border: "none" }} />
    </div>
  );
});
