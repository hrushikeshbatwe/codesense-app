"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const OutputNode = memo(function OutputNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      style={{
        background: selected ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.07)",
        border: `1px solid ${selected ? "rgba(249,115,22,0.6)" : "rgba(249,115,22,0.3)"}`,
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
          background: "#3d1a00", color: "#fb923c",
          fontSize: "9px", fontWeight: 700, fontFamily: "var(--font-mono)",
          padding: "1px 5px", borderRadius: "4px",
          border: "1px solid rgba(249,115,22,0.3)",
        }}
      >
        L{data.lineStart}
      </div>
      <Handle type="target" position={Position.Top} style={{ background: "#f97316", border: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#fb923c", fontFamily: "var(--font-mono)", fontSize: "11px", flexShrink: 0 }}>out</span>
        <span style={{ fontWeight: 600, fontSize: "13px", color: "#e2e8f0", wordBreak: "break-all" }}>
          {data.label}
        </span>
      </div>
      <div style={{ fontSize: "10px", color: "#fb923c", marginTop: "2px", fontFamily: "var(--font-mono)" }}>Output</div>
      <Handle type="source" position={Position.Bottom} style={{ background: "#f97316", border: "none" }} />
    </div>
  );
});
