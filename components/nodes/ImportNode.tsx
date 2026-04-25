"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const ImportNode = memo(function ImportNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 bg-gray-50 min-w-[160px] max-w-[220px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-gray-500 shadow-gray-300 shadow-md" : "border-gray-300"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-mono text-xs shrink-0">⬜</span>
        <span className="font-semibold text-xs text-gray-600 truncate">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
});
