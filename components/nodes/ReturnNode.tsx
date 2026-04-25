"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const ReturnNode = memo(function ReturnNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 bg-emerald-50 min-w-[140px] max-w-[220px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-emerald-600 shadow-emerald-300 shadow-md" : "border-emerald-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-400" />
      <div className="flex items-center gap-2">
        <span className="text-emerald-600 font-mono text-xs shrink-0">↩</span>
        <span className="font-semibold text-sm text-gray-800 truncate">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400" />
    </div>
  );
});
