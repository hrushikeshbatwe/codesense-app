"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { CodeEditorHandle } from "@/components/CodeEditor";
import { FlowChart } from "@/components/FlowChart";
import { NodePanel } from "@/components/NodePanel";
import { parseCode } from "@/lib/parser";
import { transformAST } from "@/lib/transformer";
import type { CodeNode, FlowGraph } from "@/types/flow.types";

// Monaco must be loaded client-side only
const CodeEditor = dynamic(
  () => import("@/components/CodeEditor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#1e1e1e] animate-pulse" /> }
);

// ─── Example snippets ─────────────────────────────────────────────────────────

const EXAMPLES: Record<string, { label: string; code: string }> = {
  react: {
    label: "React Component",
    code: `import { useState, useEffect } from "react";

async function fetchUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json();
}

export default function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
    </div>
  );
}`,
  },
  utility: {
    label: "Utility Functions",
    code: `import axios from "axios";

function processItems(items: string[]) {
  const cleaned = items
    .filter((item) => item.length > 0)
    .map((item) => item.trim().toLowerCase());
  return cleaned;
}

async function saveData(payload: object) {
  const response = await axios.post("/api/data", payload);
  return response.data;
}

function handleError(error: Error) {
  if (error.message.includes("network")) {
    console.error("Network error:", error);
  } else {
    console.error("Unknown error:", error);
  }
}

export function syncAll(items: string[]) {
  const processed = processItems(items);
  for (const item of processed) {
    saveData({ item });
  }
  return processed;
}`,
  },
  express: {
    label: "Express Route",
    code: `import express from "express";

const router = express.Router();

async function validateUser(id: string) {
  const res = await fetch(\`/internal/users/\${id}\`);
  if (!res.ok) {
    return null;
  }
  return res.json();
}

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await validateUser(id);

  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json(user);
});

export default router;`,
  },
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const editorRef = useRef<CodeEditorHandle>(null);
  const [code, setCode] = useState(EXAMPLES.react.code);
  const [graph, setGraph] = useState<FlowGraph | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<CodeNode | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showImports, setShowImports] = useState(true);
  const [showLoops, setShowLoops] = useState(true);

  const runAnalysis = useCallback((source: string) => {
    setIsAnalyzing(true);
    setSelectedNode(null);
    // setTimeout(0) lets React repaint before the synchronous parse blocks the thread
    setTimeout(() => {
      try {
        const { ast, error } = parseCode(source);
        if (error || !ast) {
          setParseError(error ?? "Unknown parse error");
          setGraph(null);
        } else {
          const flowGraph = transformAST(ast, source);
          setGraph(flowGraph);
          setParseError(null);
        }
      } finally {
        setIsAnalyzing(false);
      }
    }, 0);
  }, []);

  // Auto-analyze on first load
  useEffect(() => {
    runAnalysis(EXAMPLES.react.code);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyzeClick = useCallback(() => {
    runAnalysis(editorRef.current?.getValue() ?? code);
  }, [code, runAnalysis]);

  const handleNodeClick = useCallback((node: CodeNode) => {
    setSelectedNode(node);
    editorRef.current?.highlightRange(node.data.lineStart, node.data.lineEnd);
  }, []);

  const handleJumpToLine = useCallback((line: number) => {
    editorRef.current?.jumpToLine(line);
  }, []);

  const handleExampleLoad = useCallback((key: string) => {
    const example = EXAMPLES[key];
    if (!example) return;
    setCode(example.code);
    setSelectedNode(null);
    runAnalysis(example.code);
  }, [runAnalysis]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900 tracking-tight">CodeSense</span>
          <span className="text-xs text-gray-400 font-mono hidden sm:block">
            code → flowchart
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Examples */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 mr-1 hidden sm:block">Examples:</span>
            {Object.entries(EXAMPLES).map(([key, ex]) => (
              <button
                key={key}
                onClick={() => handleExampleLoad(key)}
                className="text-xs px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Toggle controls */}
          <div className="flex items-center gap-1 border-l pl-2 ml-1">
            <button
              onClick={() => setShowImports((v) => !v)}
              className={`text-xs px-2 py-1.5 rounded-md transition-colors ${
                showImports ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
              }`}
            >
              ⬜ imports
            </button>
            <button
              onClick={() => setShowLoops((v) => !v)}
              className={`text-xs px-2 py-1.5 rounded-md transition-colors ${
                showLoops ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
              }`}
            >
              🔁 loops
            </button>
          </div>
        </div>
      </header>

      {/* Main split panel */}
      <main className="flex-1 grid grid-cols-2 overflow-hidden min-h-0">
        {/* Left: Code editor */}
        <div className="flex flex-col border-r border-gray-200 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              ref={editorRef}
              defaultValue={code}
              onChange={(val) => setCode(val ?? "")}
            />
          </div>

          {/* Analyze bar */}
          <div className="shrink-0 px-3 py-2 bg-[#1e1e1e] border-t border-gray-700 flex items-center gap-3">
            <button
              onClick={handleAnalyzeClick}
              disabled={isAnalyzing}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                "Analyze →"
              )}
            </button>
            {parseError && (
              <span className="text-red-400 text-xs font-mono truncate max-w-[280px]">
                {parseError}
              </span>
            )}
            {graph && !parseError && (
              <span className="text-gray-500 text-xs">
                {graph.nodes.length} nodes · {graph.edges.length} edges
              </span>
            )}
          </div>
        </div>

        {/* Right: Flowchart canvas */}
        <div className="relative overflow-hidden bg-white">
          {graph && graph.nodes.length > 0 ? (
            <FlowChart
              nodes={graph.nodes}
              edges={graph.edges}
              onNodeClick={handleNodeClick}
              showImports={showImports}
              showLoops={showLoops}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 select-none">
              {isAnalyzing ? (
                <>
                  <div className="w-8 h-8 border-[3px] border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm">Parsing your code…</span>
                </>
              ) : (
                <>
                  <div className="text-5xl">🗺️</div>
                  <div className="text-sm text-center max-w-[200px] leading-relaxed">
                    Paste your code and click{" "}
                    <span className="font-mono bg-gray-100 px-1 rounded text-gray-600">
                      Analyze →
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Node detail panel (slides up from bottom) */}
      <NodePanel
        node={selectedNode}
        onJumpToLine={handleJumpToLine}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
