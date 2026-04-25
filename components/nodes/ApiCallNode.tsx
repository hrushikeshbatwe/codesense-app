"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const ApiCallNode = memo(function ApiCallNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 bg-red-50 min-w-[160px] max-w-[220px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-red-600 shadow-red-300 shadow-md" : "border-red-400"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-red-400" />
      <div className="flex items-center gap-2">
        <span className="text-red-500 text-base shrink-0">🟥</span>
        <span className="font-semibold text-sm text-gray-800 truncate">{data.label}</span>
      </div>
      <div className="text-xs text-red-400 mt-0.5 font-mono">API call</div>
      <Handle type="source" position={Position.Bottom} className="!bg-red-400" />
    </div>
  );
});
