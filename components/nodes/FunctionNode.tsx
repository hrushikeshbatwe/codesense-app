"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CodeNode } from "@/types/flow.types";

export const FunctionNode = memo(function FunctionNode({ data, selected }: NodeProps<CodeNode>) {
  const isComponent = data.kind === "component";
  return (
    <div
      className={`relative px-4 py-2 rounded-lg border-2 bg-blue-50 min-w-[180px] max-w-[320px] shadow-sm cursor-pointer transition-shadow ${
        selected ? "border-blue-600 shadow-blue-300 shadow-md" : "border-blue-400"
      }`}
    >
      <div className="absolute -top-2.5 -right-2.5 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm border border-blue-300">
        L{data.lineStart}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div className="flex items-center gap-2">
        <span className="text-blue-600 font-mono text-xs shrink-0">
          {isComponent ? "⚛" : data.isAsync ? "async fn" : "fn"}
        </span>
        <span className="font-semibold text-sm text-gray-800 break-all">{data.label}</span>
      </div>
      {data.params && data.params.length > 0 && (
        <div className="text-xs text-gray-500 mt-0.5 font-mono break-all">
          ({data.params.join(", ")})
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
    </div>
  );
});
