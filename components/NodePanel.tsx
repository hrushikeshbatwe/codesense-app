"use client";

import type { CodeNode, NodeKind } from "@/types/flow.types";

const KIND_LABELS: Record<NodeKind, string> = {
  function: "Function",
  component: "React Component",
  conditional: "Conditional",
  loop: "Loop",
  apiCall: "API Call",
  return: "Return",
  import: "Import",
  variable: "Variable",
  tryCatch: "Try / Catch",
};

const KIND_COLORS: Record<NodeKind, string> = {
  function: "bg-blue-100 text-blue-700",
  component: "bg-blue-100 text-blue-700",
  conditional: "bg-yellow-100 text-yellow-700",
  loop: "bg-green-100 text-green-700",
  apiCall: "bg-red-100 text-red-700",
  return: "bg-emerald-100 text-emerald-700",
  import: "bg-gray-100 text-gray-700",
  variable: "bg-gray-100 text-gray-600",
  tryCatch: "bg-orange-100 text-orange-700",
};

interface NodePanelProps {
  node: CodeNode | null;
  onJumpToLine: (line: number) => void;
  onClose: () => void;
}

export function NodePanel({ node, onJumpToLine, onClose }: NodePanelProps) {
  if (!node) return null;

  const { kind, label, name, params, lineStart, lineEnd, isAsync } = node.data;
  const kindLabel = KIND_LABELS[kind] ?? kind;
  const kindColor = KIND_COLORS[kind] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="border-t border-gray-200 bg-white shadow-md px-4 py-3 flex items-start gap-4 animate-in slide-in-from-bottom-2 duration-200">
      {/* Kind badge */}
      <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${kindColor}`}>
        {kindLabel}
      </span>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-gray-900 truncate">
          {isAsync && <span className="text-gray-400 font-mono text-xs mr-1">async</span>}
          {name ?? label}
        </div>
        {params && params.length > 0 && (
          <div className="text-xs text-gray-500 font-mono mt-0.5">
            ({params.join(", ")})
          </div>
        )}
        <div className="text-xs text-gray-400 mt-0.5">
          Line {lineStart}{lineEnd !== lineStart ? `–${lineEnd}` : ""}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onJumpToLine(lineStart)}
          className="text-xs px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
        >
          Jump to line
        </button>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          aria-label="Close panel"
        >
          ×
        </button>
      </div>
    </div>
  );
}
