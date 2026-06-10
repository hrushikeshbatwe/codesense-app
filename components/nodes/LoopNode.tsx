"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const LoopNode = memo(function LoopNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      style={{
        background: selected ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.07)",
        border: `1px solid ${selected ? "rgba(34,197,94,0.6)" : "rgba(34,197,94,0.3)"}`,
        borderRadius: "8px",
        padding: "8px 12px",
        minWidth: "150px",
        maxWidth: "300px",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute", top: "-9px", right: "-6px",
          background: "#052e16", color: "#4ade80",
          fontSize: "9px", fontWeight: 700, fontFamily: "var(--font-mono)",
          padding: "1px 5px", borderRadius: "4px",
          border: "1px solid rgba(34,197,94,0.3)",
        }}
      >
        L{data.lineStart}
      </div>
      <Handle type="target" position={Position.Top} style={{ background: "#22c55e", border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#4ade80", fontFamily: "var(--font-mono)", fontSize: "11px", flexShrink: 0 }}>loop</span>
        <span style={{ fontWeight: 600, fontSize: "13px", color: "#e2e8f0", wordBreak: "break-all" }}>
          {data.label}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: "#22c55e", border: "none" }} />
    </div>
  );
});
