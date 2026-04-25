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

// Monaco must be loaded client-side only
const CodeEditor = dynamic(
  () => import("@/components/CodeEditor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#0d1117] animate-pulse" /> }
);

// ─── Example snippets ─────────────────────────────────────────────────────────

// Examples moved to lib/examples.ts

// ─── Main page ────────────────────────────────────────────────────────────────

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
      } catch (err) {
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

  // Auto-analyze on first load; read shared URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("c");
    if (encoded) {
      const decoded = decodeCode(encoded);
      if (decoded) {
        setCode(decoded);
        setLanguage("typescript"); // Defaults to TS for shared
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
        if (!isAnalyzing) {
          runAnalysis(code, language);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, language, isAnalyzing, runAnalysis]);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background ambient light */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 shrink-0 flex items-center justify-between px-6 py-4 bg-slate-950/60 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
            CodeSense
          </span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-mono hidden sm:block">
            BETA
          </span>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Examples Dropdown */}
          <div className="relative flex items-center">
            <select
              value={activeExampleKey}
              onChange={(e) => handleExampleLoad(e.target.value)}
              className="appearance-none bg-slate-900 border border-white/10 text-slate-300 text-sm font-medium rounded-xl px-4 py-2 pr-10 hover:bg-slate-800 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer shadow-lg shadow-black/20"
            >
              {EXAMPLE_GROUPS.map((group) => (
                <optgroup key={group.groupLabel} label={group.groupLabel} className="bg-slate-900 text-indigo-400 font-semibold">
                  {group.items.map((ex) => (
                    <option key={ex.id} value={ex.id} className="text-slate-200 font-normal">
                      {ex.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block" />

          {/* Upload + Share */}
          <div className="flex items-center gap-2">
            <FileUpload
              onLoad={(text) => {
                setCode(text);
                setLanguage("typescript"); // Default imported files to TS/JS
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
              className="group flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300"
            >
              {shareCopied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0 relative z-10 p-4 gap-4">
        {/* Left: Code editor */}
        <div className="flex flex-col bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50">
          
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{language}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(editorRef.current?.getValue() ?? code);
                }}
                className="text-slate-500 hover:text-indigo-400 transition-colors"
                title="Copy Code"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setCode("");
                  editorRef.current?.setValue("");
                  setGraph(null);
                }}
                className="text-slate-500 hover:text-rose-400 transition-colors"
                title="Clear Code"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="shrink-0 px-4 py-3 bg-slate-900/80 border-t border-white/5 flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                onClick={handleAnalyzeClick}
                disabled={isAnalyzing}
                className="group relative px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] flex items-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2">
                  {isAnalyzing ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Analyze Flow <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/20 text-white/90 border border-white/20 hidden sm:inline shadow-sm">Ctrl+Enter</span>
                    </>
                  )}
                </span>
              </button>
              {parseError && (
                <span className="text-rose-400 text-xs font-medium bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 max-w-[300px] truncate">
                  {parseError}
                </span>
              )}
            </div>
            {graph && !parseError && (
              <span className="text-slate-400 text-xs font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-indigo-400">{graph.nodes.length}</span> nodes · <span className="text-indigo-400">{graph.edges.length}</span> edges
              </span>
            )}
          </div>
        </div>

        {/* Right: Flowchart canvas */}
        <div className="relative overflow-hidden bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
          
          {graph && graph.nodes.length > 0 ? (
            <>
              {/* Overlay controls for Graph */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl">
                <button
                  onClick={() => setShowImports((v) => !v)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${
                    showImports 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700"
                  }`}
                >
                  Imports
                </button>
                <button
                  onClick={() => setShowLoops((v) => !v)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${
                    showLoops 
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                      : "bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700"
                  }`}
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
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 select-none relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
              
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <span className="text-sm font-medium text-slate-300">Parsing Abstract Syntax Tree…</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 p-8 text-center animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl shadow-indigo-500/10">
                    <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-200 tracking-tight">Code Flow Visualization</h3>
                    <p className="text-sm text-slate-400 max-w-[280px] leading-relaxed">
                      Select an example, write some code, or paste your file and hit <span className="text-indigo-400 font-semibold">Analyze Flow</span> to see the magic.
                    </p>
                  </div>
                </div>
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
