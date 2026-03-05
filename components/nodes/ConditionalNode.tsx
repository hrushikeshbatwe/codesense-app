"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export function ConditionalNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 bg-yellow-50 min-w-[160px] max-w-[220px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-yellow-600 shadow-yellow-300 shadow-md" : "border-yellow-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-yellow-400" />
      <div className="flex items-center gap-2">
        <span className="text-yellow-600 font-mono text-xs shrink-0">if</span>
        <span className="font-semibold text-sm text-gray-800 truncate">{data.label}</span>
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400 font-mono">
        <span>true ↙</span>
        <span>↘ false</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-400" />
    </div>
  );
}
