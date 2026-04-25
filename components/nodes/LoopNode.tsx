"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const LoopNode = memo(function LoopNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      className={`relative px-4 py-2 rounded-lg border-2 bg-green-50 min-w-[160px] max-w-[320px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-green-600 shadow-green-300 shadow-md" : "border-green-400"
      }`}
    >
      <div className="absolute -top-2.5 -right-2.5 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-green-300">
        L{data.lineStart}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-green-400" />
      <div className="flex items-center gap-2">
        <span className="text-green-600 text-base shrink-0">🔁</span>
        <span className="font-semibold text-sm text-gray-800 break-all">{data.label}</span>
      </div>
      <div className="text-xs text-green-500 mt-0.5 font-mono">loop</div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-400" />
    </div>
  );
});
