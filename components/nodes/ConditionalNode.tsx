"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const ConditionalNode = memo(function ConditionalNode({ data, selected }: NodeProps<CodeNode>) {
  const isSwitch = data.label?.startsWith("switch");
  const keyword = isSwitch ? "sw" : "if";

  return (
    <div
      className={`relative px-4 py-2 rounded-lg border-2 bg-yellow-50 min-w-[160px] max-w-[320px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-yellow-600 shadow-yellow-300 shadow-md" : "border-yellow-400"
      }`}
    >
      <div className="absolute -top-2.5 -right-2.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-yellow-300">
        L{data.lineStart}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-yellow-400" />
      <div className="flex items-center gap-2">
        <span className="text-yellow-600 font-mono text-xs shrink-0">{keyword}</span>
        <span className="font-semibold text-sm text-gray-800 break-all">{data.label}</span>
      </div>
      {!isSwitch && (
        <div className="flex justify-between mt-1 text-xs text-gray-400 font-mono">
          <span>true ↙</span>
          <span>↘ false</span>
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-400" />
    </div>
  );
});
