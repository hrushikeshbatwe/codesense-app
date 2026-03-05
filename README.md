# CodeSense

> Paste any JavaScript, TypeScript, or React code — instantly see an interactive flowchart of what it does.

**Zero AI. Zero backend. Zero cost. Works in under 2 seconds.**

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React Flow](https://img.shields.io/badge/React%20Flow-v12-purple)
![License](https://img.shields.io/badge/license-MIT-green)

**Live Demo:** [https://c4d3s3ns3.netlify.app](https://c4d3s3ns3.netlify.app)

---

## Table of Contents

- [What is CodeSense?](#what-is-codesense)
- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Architecture Deep Dive](#architecture-deep-dive)
  - [Parsing Pipeline](#parsing-pipeline)
  - [AST Transformer](#ast-transformer)
  - [Dagre Layout Engine](#dagre-layout-engine)
  - [Node Types](#node-types)
  - [Cross-Component Wiring](#cross-component-wiring)
- [Supported Syntax](#supported-syntax)
- [Node Color Legend](#node-color-legend)
- [Key Design Decisions](#key-design-decisions)
- [Performance](#performance)
- [Known Limitations](#known-limitations)
- [Roadmap (V2)](#roadmap-v2)
- [Contributing](#contributing)
- [License](#license)

---

## What is CodeSense?

CodeSense is a **client-side code visualization tool** that turns source code into an interactive flowchart automatically. It targets:

- **Vibe coders** using Cursor, Copilot, or v0 who ship AI-generated code they don't fully understand
- **Junior developers** reading unfamiliar codebases
- **Code reviewers** who want a quick visual summary to share with their team
- **Learners** who think visually

Unlike other tools, CodeSense:

- Runs **entirely in the browser** — no server, no API, no account required
- Uses **static AST analysis** — not AI guesswork
- Renders in **under 2 seconds** for files up to 300 lines
- Supports **JS, JSX, TS, TSX** with a single unified parser configuration

---

## Features

### MVP (Shipped)

| Feature | Description |
|---|---|
| **Monaco Editor** | Full VS Code-style editor with syntax highlighting, TypeScript support, line numbers |
| **AST Parsing** | Parses JS/JSX/TS/TSX using `@babel/parser` entirely in the browser |
| **Interactive Flowchart** | React Flow canvas with pan, zoom, minimap |
| **Auto Layout** | Dagre graph layout algorithm — top-to-bottom hierarchy |
| **6 Node Types** | Function, Component, Conditional, Loop, API Call, Return, Import |
| **Node Click → Detail Panel** | Click any node to see type, name, parameters, line range |
| **Jump to Line** | "Jump to line" button scrolls Monaco and highlights the exact source range |
| **Toggle Visibility** | Show/hide import nodes and loop nodes independently |
| **3 Built-in Examples** | React Component, Utility Functions, Express Route |
| **Zero Backend** | Fully client-side — no server, no network requests during analysis |

### Coming in V2

- File upload (`.js`, `.ts`, `.jsx`, `.tsx`)
- Shareable URLs (code encoded in URL as base64)
- Export as PNG / SVG
- Multi-file component dependency graph
- VS Code extension

---

## How It Works

```
User pastes code
       │
       ▼
┌─────────────────┐
│  @babel/parser  │  Parses JS/TS/JSX/TSX → Abstract Syntax Tree (AST)
│   (browser)     │  errorRecovery: true — works even on incomplete code
└────────┬────────┘
         │  AST (Babel File node)
         ▼
┌─────────────────┐
│   Transformer   │  Manual recursive visitor walks every AST node
│  (lib/          │  Extracts: functions, conditionals, loops, API calls,
│  transformer.ts)│  imports, returns — and the edges between them
└────────┬────────┘
         │  FlowGraph { nodes[], edges[] }
         ▼
┌─────────────────┐
│  Dagre Layout   │  Computes x,y positions for each node
│  (lib/layout.ts)│  Direction: top-to-bottom (rankdir: TB)
└────────┬────────┘
         │  nodes with { position: { x, y } }
         ▼
┌─────────────────┐
│   React Flow    │  Renders the interactive graph
│  (@xyflow/react)│  Handles pan, zoom, minimap, node selection
└─────────────────┘
```

The entire pipeline is **synchronous and runs on the main thread**. A `setTimeout(0)` trick before parsing lets React repaint the "Analyzing…" state before the blocking work begins, giving the perception of async responsiveness.

---

## Tech Stack

| Package | Purpose |
|---|---|
| `next` 16 | Framework (App Router, Turbopack) |
| `react` 19 | UI |
| `typescript` 5 | Type safety |
| `tailwindcss` 4 | Styling |
| `@babel/parser` | Parse JS/TS/JSX/TSX into AST — works in the browser |
| `@babel/types` | TypeScript types for all Babel AST node shapes |
| `@xyflow/react` v12 | Interactive graph renderer (React Flow) |
| `dagre` | Directed graph auto-layout algorithm |
| `@monaco-editor/react` | VS Code editor component |

> **Why no `@babel/traverse`?**
> `@babel/traverse` calls `require('fs')` and other Node.js built-ins internally via CommonJS, which breaks in Turbopack/webpack browser builds. We implement a manual recursive AST visitor instead — simpler and more controllable for our extraction needs.

---

## Project Structure

```
codesense/
│
├── app/
│   ├── layout.tsx           # Root layout — metadata, fonts
│   ├── page.tsx             # Main page — state management, split panel UI
│   └── globals.css          # Tailwind + Monaco highlight decoration styles
│
├── components/
│   ├── CodeEditor.tsx       # Monaco with forwardRef (jumpToLine, highlightRange)
│   ├── FlowChart.tsx        # React Flow canvas + Dagre layout + filter logic
│   ├── NodePanel.tsx        # Slide-up detail panel on node click
│   └── nodes/
│       ├── FunctionNode.tsx     # 🟦 Blue  — functions and React components
│       ├── ConditionalNode.tsx  # 🟨 Yellow — if/else branches
│       ├── ApiCallNode.tsx      # 🟥 Red   — fetch() and axios calls
│       ├── LoopNode.tsx         # 🟩 Green — for/while/map/forEach loops
│       ├── ReturnNode.tsx       # Emerald  — return statements
│       └── ImportNode.tsx       # ⬜ Gray  — import declarations
│
├── lib/
│   ├── parser.ts            # @babel/parser wrapper → { ast, error }
│   ├── transformer.ts       # AST → FlowGraph { nodes[], edges[] }
│   └── layout.ts            # Dagre auto-layout → positions nodes
│
├── types/
│   └── flow.types.ts        # Shared types: CodeNode, CodeEdge, FlowGraph, NodeKind
│
├── next.config.ts           # turbopack: {} config
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/hrushikeshbatwe/codesense.git
cd codesense

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the React Component example loads and analyzes automatically.

### Build for Production

```bash
npm run build
npm start
```

### Type Check

```bash
npx tsc --noEmit
```

---

## Architecture Deep Dive

### Parsing Pipeline

**File: `lib/parser.ts`**

A thin wrapper around `@babel/parser`, configured with all relevant plugins enabled simultaneously so one call handles all four file types:

```ts
parse(code, {
  sourceType: "module",
  plugins: [
    "typescript",            // TypeScript type annotations
    "jsx",                   // JSX elements
    "classProperties",       // class field declarations
    "decorators-legacy",     // @decorator syntax
    "dynamicImport",         // import() expressions
    "optionalChaining",      // a?.b
    "nullishCoalescingOperator", // a ?? b
  ],
  errorRecovery: true,       // partial AST on syntax errors — no crash while typing
})
```

`errorRecovery: true` is critical for the live editing use case — the user may be mid-type, and we want the best possible flowchart rather than an error that wipes the canvas.

---

### AST Transformer

**File: `lib/transformer.ts`**

The core of CodeSense. Implements a **recursive descent visitor** — a pattern where each AST node type has a dedicated handler that:

1. Creates a flowchart node for itself
2. Wires a sequence edge from the previous node (`prevId`)
3. Recurses into its children, passing itself as the new `prevId`

#### The prevId Threading Pattern

```
processStatements([stmt1, stmt2, stmt3], parentId)
  │
  ├── processStatement(stmt1, parentId) → node1Id
  │     └── addEdge(parentId → node1Id)        ← sequence edge
  │
  ├── processStatement(stmt2, node1Id) → node2Id
  │     └── addEdge(node1Id → node2Id)          ← sequence edge
  │
  └── processStatement(stmt3, node2Id) → node3Id
        └── addEdge(node2Id → node3Id)          ← sequence edge
```

Each `processXxx` function returns the ID of the node it created, allowing the caller to chain the next statement's edge automatically.

#### AST → Flowchart Mapping

| Babel AST Node | Flowchart Kind | Detection |
|---|---|---|
| `FunctionDeclaration` | `function` | Direct |
| `ArrowFunctionExpression` | `function` or `component` | Component if body contains JSX |
| `FunctionExpression` | `function` or `component` | Component if body contains JSX |
| `IfStatement` | `conditional` | Direct |
| `ForStatement` / `WhileStatement` / `DoWhileStatement` | `loop` | Direct |
| `ForInStatement` / `ForOfStatement` | `loop` | Direct |
| `CallExpression` with `.map()/.forEach()/.filter()` etc. | `loop` | `callee.property.name` check |
| `CallExpression` with `fetch(...)` | `apiCall` | `callee.name === "fetch"` |
| `CallExpression` with `axios.*` | `apiCall` | `callee.object.name === "axios"` |
| `ImportDeclaration` | `import` | Direct |
| `ReturnStatement` | `return` | "return JSX" if argument contains JSX |
| `ExportDefaultDeclaration` | — | Unwraps inner declaration |

#### Conditional Edge Labeling

For `if/else`, the transformer processes each branch with `null` as the parent (suppressing auto-edges), then manually adds labeled edges:

```ts
const trueEntryId = processStatements(state, consequent.body, null);
if (trueEntryId) addEdge(state, ifNodeId, trueEntryId, "true");

const falseEntryId = processStatements(state, alternate.body, null);
if (falseEntryId) addEdge(state, ifNodeId, falseEntryId, "false");
```

This ensures the `"true"` and `"false"` labels appear on the branching edges without processing any statement twice (which would create duplicate node IDs).

#### Stable Node IDs

```ts
makeId("function", "fetchUser", 3) → "function-fetchUser-3"
```

IDs are derived from content, not a counter. Re-analyzing the same code produces identical IDs, so React Flow can smoothly animate position changes rather than destroying and re-creating the graph.

---

### Dagre Layout Engine

**File: `lib/layout.ts`**

[Dagre](https://github.com/dagrejs/dagre) computes `x, y` positions for nodes given their graph connections. CodeSense uses `TB` (top-to-bottom) layout.

#### Coordinate Translation

Dagre returns **center-based** coordinates. React Flow expects **top-left-based**:

```ts
position: {
  x: dagreNode.x - NODE_WIDTH / 2,
  y: dagreNode.y - NODE_HEIGHT / 2,
}
```

#### Why Fixed Dimensions

React Flow reports actual node sizes (`node.measured`) only after the first render. Using real dimensions requires a two-pass approach (render invisible → measure → layout → show). CodeSense instead uses fixed dimensions `220 × 64` that match the CSS `min-w` / height set on all node components. This is simpler, predictable, and avoids the timing issue entirely.

#### Layout Configuration

```ts
g.setGraph({
  rankdir: "TB",   // top-to-bottom
  ranksep: 80,     // vertical gap between ranks
  nodesep: 40,     // horizontal gap within a rank
  marginx: 40,
  marginy: 40,
});
```

---

### Node Types

**Files: `components/nodes/*.tsx`**

Each custom node follows the same pattern — a `div` with a `Handle` at the top (for incoming edges) and bottom (for outgoing edges):

```tsx
export function FunctionNode({ data, selected }: NodeProps<CodeNode>) {
  return (
    <div className={`... ${selected ? "ring-2 ring-blue-500" : ""}`}>
      <Handle type="target" position={Position.Top} />
      <span>{data.label}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Critical rule:** The `nodeTypes` registry must be defined **at module level**, outside any component. Defining it inside a component creates a new object reference on every render, causing React Flow to re-register all types and producing flickering:

```ts
// ✅ Correct — module level
const nodeTypes: NodeTypes = { function: FunctionNode, ... };

// ❌ Wrong — inside component
function FlowChart() {
  const nodeTypes = { function: FunctionNode }; // new ref every render
}
```

---

### Cross-Component Wiring

The hardest UX interaction: clicking a node in the **right panel** (React Flow) must scroll and highlight the source in the **left panel** (Monaco Editor). These are siblings — they share no parent except `page.tsx`.

**Solution: `forwardRef` + `useImperativeHandle`**

```
page.tsx
  │
  ├── editorRef = useRef<CodeEditorHandle>()
  │
  ├── <CodeEditor ref={editorRef} />
  │         exposes: jumpToLine(n), highlightRange(start, end), getValue()
  │
  └── <FlowChart onNodeClick={(node) => {
           editorRef.current?.highlightRange(node.data.lineStart, node.data.lineEnd)
       }} />
           └── <NodePanel>
                 "Jump to line" → editorRef.current?.jumpToLine(lineStart)
               </NodePanel>
```

Monaco decorations (the highlight) use `createDecorationsCollection` which replaces previous highlights atomically — clicking a second node never stacks highlights on top of the first.

---

## Supported Syntax

### Functions & Components

```ts
// Named function → 🟦 Function node
function greet(name: string) { ... }

// Arrow function → 🟦 Function node
const greet = (name: string) => { ... }

// Async function → 🟦 Function node with "async" badge
async function loadData() { ... }

// React component (uppercase name + returns JSX) → 🟦 Component node (⚛ icon)
export default function UserCard({ user }: Props) {
  return <div>{user.name}</div>;
}
```

### Conditionals

```ts
// if/else → 🟨 Conditional node with "true" and "false" edges
if (user.isAdmin) {
  showDashboard();
} else {
  redirectToLogin();
}
```

### Loops

```ts
for (const item of items) { ... }     // 🟩 Loop — "for…of"
while (queue.length > 0) { ... }      // 🟩 Loop — "while"
items.map(x => x * 2)                 // 🟩 Loop — ".map()"
items.filter(x => x > 0)             // 🟩 Loop — ".filter()"
items.forEach(x => console.log(x))   // 🟩 Loop — ".forEach()"
items.reduce((acc, x) => acc + x, 0) // 🟩 Loop — ".reduce()"
```

### API Calls

```ts
// fetch → 🟥 API Call node with animated edges
const res = await fetch("/api/users");
const res = await fetch(`/api/users/${id}`);

// axios → 🟥 API Call node with animated edges
const data = await axios.get("/api/users");
await axios.post("/api/data", payload);
await axios.delete(`/api/users/${id}`);
```

### Imports & Returns

```ts
// import → ⬜ Import node (hideable via toolbar)
import { useState, useEffect } from "react";
import axios from "axios";
import type { User } from "./types";

// return → Emerald Return node
return <UserCard user={user} />;  // → "return JSX"
return processedData;             // → "return"
```

---

## Node Color Legend

| Color | Node Type | Represents |
|---|---|---|
| 🟦 Blue | Function / Component | Named functions, arrow functions, React components |
| 🟨 Yellow | Conditional | `if / else if / else` branches |
| 🟩 Green | Loop | `for`, `while`, `do…while`, `.map()`, `.forEach()`, `.filter()`, `.reduce()` |
| 🟥 Red | API Call | `fetch()` and `axios.*` — animated edges indicate async data flow |
| 🟢 Emerald | Return | `return` statements; "return JSX" for component render output |
| ⬜ Gray | Import | `import` declarations; toggle off in the toolbar to reduce noise |

---

## Key Design Decisions

### 1. No @babel/traverse

`@babel/traverse` is the canonical Babel tool for AST walking, but it uses CommonJS `require()` internally to load Node.js built-ins (`fs`, `path`) at runtime. This fails in browser bundlers (webpack, Turbopack) with cryptic errors.

CodeSense implements a **manual recursive visitor** in `transformer.ts` (~350 lines). For extracting a fixed set of constructs, this is actually simpler and more predictable than the plugin-based visitor pattern of `@babel/traverse`.

### 2. Turbopack (Next.js 16 Default)

Next.js 16 ships with Turbopack as the default bundler. Since we bypass `@babel/traverse`, no Node.js polyfills (`fs: false`, `path: false`) are needed. The only required config is `turbopack: {}` to acknowledge the setup.

### 3. setTimeout(0) for Perceived Performance

```ts
setIsAnalyzing(true);
setTimeout(() => {      // yield to React → repaint "Analyzing…" first
  const result = parseCode(source);
  setGraph(transformAST(result.ast));
  setIsAnalyzing(false);
}, 0);
```

Without this, React batches the `setIsAnalyzing(true)` with the subsequent state updates and never shows the loading indicator. The 0ms timeout yields the main thread back to React for one repaint before the synchronous parse begins.

### 4. Stable Node IDs Prevent Flicker

Node IDs use `${kind}-${name}-${lineNumber}` instead of an incrementing counter. When the user edits code and re-analyzes, nodes that haven't changed keep the same ID — React Flow updates their positions with a smooth transition rather than destroying and re-creating the entire graph.

### 5. Fixed Dimensions for Dagre

React Flow only reports real node dimensions (`node.measured`) after the first DOM render. A two-pass layout (render hidden → measure → layout → show) adds complexity and latency. Fixed dimensions (220 × 64 px) matching the CSS constraints on all node components are accurate enough and eliminate the timing issue entirely.

### 6. ReactFlowProvider Wrapping Strategy

`useReactFlow()` (needed for programmatic `fitView()` after re-layout) must run inside a `ReactFlowProvider` context. The `<ReactFlow>` component provides this context to its *children*, not to the component rendering it. Solution: wrap `FlowChartInner` (which uses `useReactFlow`) inside `<ReactFlowProvider>` in the exported `FlowChart` component.

---

## Performance

| Step | Time (300-line file, ~50 nodes) |
|---|---|
| `@babel/parser` parse | ~15–30ms |
| Manual AST walk | ~5–10ms |
| Dagre layout | ~10–20ms |
| React Flow render | ~100–200ms |
| **Total** | **~130–260ms** |

For files over 1000 lines, moving the parse + transform steps into a **Web Worker** would prevent main thread blocking. This is planned for V2.

---

## Known Limitations

- **No `switch/case`** — switch statements are not extracted as conditional nodes
- **No `try/catch`** — error handling branches are not visualized
- **No ES6 classes** — class declarations and their methods are skipped
- **Nested call detection** — `CallExpression` nodes deeply nested in complex assignments may be missed
- **No TypeScript type display** — types are parsed but stripped; only runtime behavior is shown
- **Single file only** — multi-file import relationships are a V2 feature

---

## Roadmap (V2)

### F6 — File Upload
Drag-and-drop or click to upload `.js`, `.ts`, `.jsx`, `.tsx` files. Parse client-side using the browser File API. No upload to a server.

### F7 — Shareable URLs
Compress code with `lz-string` and encode into the URL hash. Anyone opening the link sees the identical flowchart with zero server involvement.

```
codesense.app/#code=eJyVUMFOwzAM...
```

### F8 — Export
- **PNG** via `html-to-image` for documentation and sharing
- **SVG** for lossless, scalable diagrams
- **Mermaid syntax** for embedding in GitHub READMEs and wikis

### F9 — Multi-File Component Tree
Analyze multiple pasted files and visualize how they import each other — a high-level dependency graph showing module boundaries and component hierarchies.

### F10 — VS Code Extension
Right-click any file → "Visualize in CodeSense" → opens a webview panel running the full CodeSense UI inside the editor, with the current file pre-loaded.

---

## Contributing

```bash
git clone https://github.com/hrushikeshbatwe/codesense.git
cd codesense
npm install
npm run dev
```

### Good First Issues

- Add `switch/case` support in `lib/transformer.ts` + a `SwitchNode` component
- Add `try/catch` support with branching edges (try → catch → finally)
- Add class method extraction for ES6 classes
- Write unit tests for the transformer using Babel fixture ASTs
- Implement the shareable URL feature (F7)

### Code Conventions

- All files use `"use client"` directive (fully browser-side)
- No `any` type unless casting through `unknown` first
- `nodeTypes` registry must always be at module level, never inside a component
- Node IDs must stay stable: `makeId(kind, name, lineNumber)` pattern

---

## License

MIT © [Hrushikesh Batwe](https://github.com/hrushikeshbatwe/codesense)

---

<div align="center">
  <sub>Built with Next.js · React Flow · Babel · Dagre</sub>
</div>
