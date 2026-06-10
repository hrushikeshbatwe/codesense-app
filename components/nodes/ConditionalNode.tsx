"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const ConditionalNode = memo(function ConditionalNode({ data, selected }: NodeProps<CodeNode>) {
  const isSwitch = data.label?.startsWith("switch");
  const keyword = isSwitch ? "sw" : "if";

  return (
    <div
      style={{
        background: selected ? "rgba(234,179,8,0.15)" : "rgba(234,179,8,0.07)",
        border: `1px solid ${selected ? "rgba(234,179,8,0.6)" : "rgba(234,179,8,0.3)"}`,
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
          background: "#3d3000", color: "#facc15",
          fontSize: "9px", fontWeight: 700, fontFamily: "var(--font-mono)",
          padding: "1px 5px", borderRadius: "4px",
          border: "1px solid rgba(234,179,8,0.3)",
        }}
      >
        L{data.lineStart}
      </div>
      <Handle type="target" position={Position.Top} style={{ background: "#eab308", border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#facc15", fontFamily: "var(--font-mono)", fontSize: "11px", flexShrink: 0 }}>
          {keyword}
        </span>
        <span style={{ fontWeight: 600, fontSize: "13px", color: "#e2e8f0", wordBreak: "break-all" }}>
          {data.label}
        </span>
      </div>
      {!isSwitch && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
          <span>true ↙</span>
          <span>↘ false</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: "#eab308", border: "none" }} />
    </div>
  );
});
