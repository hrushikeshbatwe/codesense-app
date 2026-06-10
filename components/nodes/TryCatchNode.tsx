"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const TryCatchNode = memo(function TryCatchNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      style={{
        background: selected ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.07)",
        border: `1px solid ${selected ? "rgba(249,115,22,0.6)" : "rgba(249,115,22,0.3)"}`,
        borderRadius: "8px",
        padding: "8px 12px",
        minWidth: "150px",
        maxWidth: "220px",
        cursor: "pointer",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#f97316", border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#fb923c", fontFamily: "var(--font-mono)", fontSize: "11px", flexShrink: 0 }}>try</span>
        <span style={{ fontWeight: 600, fontSize: "13px", color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {data.label}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
        <span>try ↙</span>
        <span>↘ catch</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: "#f97316", border: "none" }} />
    </div>
  );
});
