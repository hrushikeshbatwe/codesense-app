"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const FunctionNode = memo(function FunctionNode({ data, selected }: NodeProps<CodeNode>) {
  const isComponent = data.kind === "component";
  return (
    <div
      style={{
        background: selected ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.07)",
        border: `1px solid ${selected ? "rgba(59,130,246,0.6)" : "rgba(59,130,246,0.3)"}`,
        borderRadius: "8px",
        padding: "8px 12px",
        minWidth: "160px",
        maxWidth: "300px",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute", top: "-9px", right: "-6px",
          background: "#1e3a5f", color: "#60a5fa",
          fontSize: "9px", fontWeight: 700, fontFamily: "var(--font-mono)",
          padding: "1px 5px", borderRadius: "4px",
          border: "1px solid rgba(59,130,246,0.3)",
        }}
      >
        L{data.lineStart}
      </div>
      <Handle type="target" position={Position.Top} style={{ background: "#3b82f6", border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#60a5fa", fontFamily: "var(--font-mono)", fontSize: "11px", flexShrink: 0 }}>
          {isComponent ? "⚛" : data.isAsync ? "async fn" : "fn"}
        </span>
        <span style={{ fontWeight: 600, fontSize: "13px", color: "#e2e8f0", wordBreak: "break-all" }}>
          {data.label}
        </span>
      </div>
      {data.params && data.params.length > 0 && (
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>
          ({data.params.join(", ")})
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: "#3b82f6", border: "none" }} />
    </div>
  );
});
