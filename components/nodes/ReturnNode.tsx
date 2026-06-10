"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const ReturnNode = memo(function ReturnNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      style={{
        background: selected ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.07)",
        border: `1px solid ${selected ? "rgba(16,185,129,0.6)" : "rgba(16,185,129,0.3)"}`,
        borderRadius: "8px",
        padding: "8px 12px",
        minWidth: "130px",
        maxWidth: "220px",
        cursor: "pointer",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#10b981", border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#34d399", fontFamily: "var(--font-mono)", fontSize: "11px", flexShrink: 0 }}>↩</span>
        <span style={{ fontWeight: 600, fontSize: "13px", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: "#10b981", border: "none" }} />
    </div>
  );
});
