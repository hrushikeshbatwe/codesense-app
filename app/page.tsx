"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { CodeEditorHandle } from "@/components/CodeEditor";
import { FlowChart } from "@/components/FlowChart";
import { NodePanel } from "@/components/NodePanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FileUpload } from "@/components/FileUpload";
import { parseCode } from "@/lib/parser";
import { transformAST } from "@/lib/transformer";
import { generatePseudoGraph } from "@/lib/pseudoParser";
import { EXAMPLE_GROUPS, getExampleById } from "@/lib/examples";
import { encodeCode, decodeCode } from "@/lib/shareUrl";
import type { CodeNode, FlowGraph } from "@/types/flow.types";

const CodeEditor = dynamic(
  () => import("@/components/CodeEditor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#0c0c0c] animate-pulse" /> }
);

export default function Home() {
  const editorRef = useRef<CodeEditorHandle>(null);
  const [activeExampleKey, setActiveExampleKey] = useState("react");
  const [code, setCode] = useState(EXAMPLE_GROUPS[0].items[0].code);
  const [language, setLanguage] = useState(EXAMPLE_GROUPS[0].items[0].language);
  const [graph, setGraph] = useState<FlowGraph | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<CodeNode | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showImports, setShowImports] = useState(true);
  const [showLoops, setShowLoops] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  const runAnalysis = useCallback((source: string, lang: string) => {
    if (lang !== "typescript" && lang !== "javascript") {
      try {
        const flowGraph = generatePseudoGraph(source, lang);
        setGraph(flowGraph);
        setParseError(null);
      } catch {
        setGraph(null);
        setParseError("Could not generate graph for this language.");
      }
      return;
    }

    if (source.length > 500_000) {
      setParseError("File too large (max 500 KB). Please reduce the code size.");
      return;
    }
    setIsAnalyzing(true);
    setSelectedNode(null);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("c");
    if (encoded) {
      const decoded = decodeCode(encoded);
      if (decoded) {
        setCode(decoded);
        setLanguage("typescript");
        editorRef.current?.setValue(decoded);
        runAnalysis(decoded, "typescript");
        return;
      }
    }
    runAnalysis(EXAMPLE_GROUPS[0].items[0].code, "typescript");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyzeClick = useCallback(() => {
    runAnalysis(editorRef.current?.getValue() ?? code, language);
  }, [code, language, runAnalysis]);

  const handleNodeClick = useCallback((node: CodeNode) => {
    setSelectedNode(node);
    editorRef.current?.highlightRange(node.data.lineStart, node.data.lineEnd);
  }, []);

  const handleJumpToLine = useCallback((line: number) => {
    editorRef.current?.jumpToLine(line);
  }, []);

  const handleExampleLoad = useCallback((key: string) => {
    const example = getExampleById(key);
    if (!example) return;
    setActiveExampleKey(key);
    setCode(example.code);
    setLanguage(example.language);
    editorRef.current?.setValue(example.code);
    setSelectedNode(null);
    runAnalysis(example.code, example.language);
  }, [runAnalysis]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isAnalyzing) runAnalysis(code, language);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, language, isAnalyzing, runAnalysis]);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--background)", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
    >
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-border)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--accent)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
            CodeSense
          </span>
          <span
            className="px-1.5 py-0.5 text-[10px] font-mono font-medium tracking-widest hidden sm:block"
            style={{
              background: "var(--accent-dim)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent)",
              borderRadius: "4px",
            }}
          >
            BETA
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Examples select */}
          <div className="relative flex items-center">
            <select
              value={activeExampleKey}
              onChange={(e) => handleExampleLoad(e.target.value)}
              className="appearance-none text-sm font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none transition-colors cursor-pointer"
              style={{
                background: "var(--surface-raised)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              {EXAMPLE_GROUPS.map((group) => (
                <optgroup key={group.groupLabel} label={group.groupLabel} style={{ background: "#1a1a1a" }}>
                  {group.items.map((ex) => (
                    <option key={ex.id} value={ex.id} style={{ background: "#1a1a1a", color: "#e8e8e8" }}>
                      {ex.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="w-px h-5 hidden md:block" style={{ background: "var(--border)" }} />

          {/* Upload + Share */}
          <div className="flex items-center gap-2">
            <FileUpload
              onLoad={(text) => {
                setCode(text);
                setLanguage("typescript");
                editorRef.current?.setValue(text);
                runAnalysis(text, "typescript");
              }}
              onError={(msg) => setParseError(msg)}
            />
            <button
              onClick={() => {
                const current = editorRef.current?.getValue() ?? code;
                const url = `${window.location.origin}${window.location.pathname}?c=${encodeCode(current)}`;
                navigator.clipboard.writeText(url);
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: shareCopied ? "var(--accent-dim)" : "var(--surface-raised)",
                border: `1px solid ${shareCopied ? "var(--accent-border)" : "var(--border)"}`,
                color: shareCopied ? "var(--accent)" : "var(--muted)",
              }}
            >
              {shareCopied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main split panel */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0 p-3 gap-3">
        {/* Left: Code editor */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
          }}
        >
          {/* Editor title bar */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
            </div>
            <div className="flex items-center gap-4">
              <span
                className="text-[10px] font-mono font-medium tracking-widest uppercase"
                style={{ color: "var(--muted)" }}
              >
                {language}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(editorRef.current?.getValue() ?? code)}
                title="Copy Code"
                style={{ color: "var(--muted)" }}
                className="hover:opacity-100 opacity-60 transition-opacity"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setCode("");
                  editorRef.current?.setValue("");
                  setGraph(null);
                }}
                title="Clear Code"
                style={{ color: "var(--muted)" }}
                className="hover:opacity-100 opacity-60 transition-opacity"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <CodeEditor
              ref={editorRef}
              language={language}
              defaultValue={code}
              onChange={(val) => setCode(val ?? "")}
            />
          </div>

          {/* Analyze bar */}
          <div
            className="shrink-0 px-4 py-3 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={handleAnalyzeClick}
                disabled={isAnalyzing}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "var(--accent)",
                  color: "#0c0c0c",
                }}
              >
                {isAnalyzing ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Analyze
                    <span
                      className="ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded hidden sm:inline"
                      style={{ background: "rgba(0,0,0,0.15)", color: "#0c0c0c" }}
                    >
                      Ctrl+↵
                    </span>
                  </>
                )}
              </button>
              {parseError && (
                <span
                  className="text-xs font-medium px-3 py-1.5 rounded-lg max-w-[280px] truncate"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    color: "#f87171",
                  }}
                >
                  {parseError}
                </span>
              )}
            </div>
            {graph && !parseError && (
              <span
                className="text-xs font-mono px-2.5 py-1.5 rounded-md"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                }}
              >
                <span style={{ color: "var(--accent)" }}>{graph.nodes.length}</span>
                {" nodes · "}
                <span style={{ color: "var(--accent)" }}>{graph.edges.length}</span>
                {" edges"}
              </span>
            )}
          </div>
        </div>

        {/* Right: Flowchart canvas */}
        <div
          className="relative overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
          }}
        >
          {graph && graph.nodes.length > 0 ? (
            <>
              {/* Overlay controls */}
              <div
                className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 rounded-lg"
                style={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  onClick={() => setShowImports((v) => !v)}
                  className="text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-200"
                  style={
                    showImports
                      ? { background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }
                      : { background: "transparent", color: "var(--muted)", border: "1px solid transparent" }
                  }
                >
                  Imports
                </button>
                <button
                  onClick={() => setShowLoops((v) => !v)}
                  className="text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-200"
                  style={
                    showLoops
                      ? { background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)" }
                      : { background: "transparent", color: "var(--muted)", border: "1px solid transparent" }
                  }
                >
                  Loops
                </button>
              </div>

              <ErrorBoundary>
                <FlowChart
                  nodes={graph.nodes}
                  edges={graph.edges}
                  onNodeClick={handleNodeClick}
                  showImports={showImports}
                  showLoops={showLoops}
                />
              </ErrorBoundary>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-5 select-none">
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                  <div className="relative w-10 h-10">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ border: "2px solid var(--border)" }}
                    />
                    <div
                      className="absolute inset-0 rounded-full border-t-transparent animate-spin"
                      style={{ border: `2px solid var(--accent)`, borderTopColor: "transparent" }}
                    />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                    Parsing AST…
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 p-8 text-center animate-in fade-in duration-500">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background: "var(--surface-raised)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--accent)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                      Code Flow Visualization
                    </h3>
                    <p className="text-sm max-w-[260px] leading-relaxed" style={{ color: "var(--muted)" }}>
                      Select an example or paste your code, then hit{" "}
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>Analyze</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Node detail panel */}
      <NodePanel
        node={selectedNode}
        onJumpToLine={handleJumpToLine}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
