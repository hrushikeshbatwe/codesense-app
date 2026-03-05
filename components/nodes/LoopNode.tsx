"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export function LoopNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 bg-green-50 min-w-[160px] max-w-[220px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-green-600 shadow-green-300 shadow-md" : "border-green-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-green-400" />
      <div className="flex items-center gap-2">
        <span className="text-green-600 text-base shrink-0">🔁</span>
        <span className="font-semibold text-sm text-gray-800 truncate">{data.label}</span>
      </div>
      <div className="text-xs text-green-500 mt-0.5 font-mono">loop</div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-400" />
    </div>
  );
}
