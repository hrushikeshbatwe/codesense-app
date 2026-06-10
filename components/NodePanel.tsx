"use client";

import type { CodeNode, NodeKind } from "@/types/flow.types";

const KIND_LABELS: Record<NodeKind, string> = {
  function: "Function",
  component: "Component",
  conditional: "Conditional",
  loop: "Loop",
  apiCall: "API Call",
  return: "Return",
  import: "Import",
  variable: "Variable",
  tryCatch: "Try/Catch",
  output: "Output",
};

const KIND_STYLES: Record<NodeKind, { bg: string; color: string; border: string }> = {
  function:    { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  component:   { bg: "rgba(59,130,246,0.1)",  color: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  conditional: { bg: "rgba(234,179,8,0.1)",   color: "#facc15", border: "rgba(234,179,8,0.25)" },
  loop:        { bg: "rgba(34,197,94,0.1)",   color: "#4ade80", border: "rgba(34,197,94,0.25)" },
  apiCall:     { bg: "rgba(239,68,68,0.1)",   color: "#f87171", border: "rgba(239,68,68,0.25)" },
  return:      { bg: "rgba(16,185,129,0.1)",  color: "#34d399", border: "rgba(16,185,129,0.25)" },
  import:      { bg: "rgba(148,163,184,0.08)", color: "#94a3b8", border: "rgba(148,163,184,0.2)" },
  variable:    { bg: "rgba(148,163,184,0.08)", color: "#94a3b8", border: "rgba(148,163,184,0.2)" },
  tryCatch:    { bg: "rgba(249,115,22,0.1)",  color: "#fb923c", border: "rgba(249,115,22,0.25)" },
  output:      { bg: "rgba(249,115,22,0.1)",  color: "#fb923c", border: "rgba(249,115,22,0.25)" },
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
  const style = KIND_STYLES[kind] ?? KIND_STYLES.variable;

  return (
    <div
      className="shrink-0 flex items-center gap-4 px-5 py-3 animate-in slide-in-from-bottom-2 duration-200"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Kind badge */}
      <span
        className="shrink-0 text-[11px] font-semibold font-mono px-2.5 py-1 rounded-md"
        style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
      >
        {kindLabel}
      </span>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
          {isAsync && (
            <span className="font-mono text-xs mr-1.5" style={{ color: "var(--muted)" }}>
              async
            </span>
          )}
          {name ?? label}
        </div>
        {params && params.length > 0 && (
          <div className="text-xs font-mono mt-0.5" style={{ color: "var(--muted)" }}>
            ({params.join(", ")})
          </div>
        )}
        <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--muted)" }}>
          line {lineStart}{lineEnd !== lineStart ? `–${lineEnd}` : ""}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onJumpToLine(lineStart)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors duration-150"
          style={{
            background: "var(--accent-dim)",
            color: "var(--accent)",
            border: "1px solid var(--accent-border)",
          }}
        >
          Jump to line
        </button>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-150"
          style={{ color: "var(--muted)", background: "transparent" }}
          aria-label="Close panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
