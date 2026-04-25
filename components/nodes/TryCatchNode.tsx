"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const TryCatchNode = memo(function TryCatchNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 bg-orange-50 min-w-[160px] max-w-[220px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-orange-600 shadow-orange-300 shadow-md" : "border-orange-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-orange-400" />
      <div className="flex items-center gap-2">
        <span className="text-orange-600 font-mono text-xs shrink-0">try</span>
        <span className="font-semibold text-sm text-gray-800 truncate">{data.label}</span>
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-400 font-mono">
        <span>try ↙</span>
        <span>↘ catch</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-400" />
    </div>
  );
});
