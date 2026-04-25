"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const OutputNode = memo(function OutputNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      className={`relative px-4 py-2 rounded-lg border-2 bg-orange-50 min-w-[160px] max-w-[320px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-orange-500 shadow-orange-300 shadow-md" : "border-orange-300"
      }`}
    >
      <div className="absolute -top-2.5 -right-2.5 bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-orange-300">
        L{data.lineStart}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-orange-400" />
      <div className="flex items-center gap-2">
        <span className="text-orange-500 text-base shrink-0">🖨️</span>
        <span className="font-semibold text-sm text-gray-800 break-all">{data.label}</span>
      </div>
      <div className="text-xs text-orange-400 mt-0.5 font-mono">Output</div>
      <Handle type="source" position={Position.Bottom} className="!bg-orange-400" />
    </div>
  );
});
