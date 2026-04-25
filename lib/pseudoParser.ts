import type { CodeNode, CodeEdge, FlowGraph, NodeKind } from "@/types/flow.types";

export function generatePseudoGraph(source: string, lang: string): FlowGraph {
  const nodes: CodeNode[] = [];
  const edges: CodeEdge[] = [];
  let prevId: string | null = null;
  const lines = source.split("\n");

  const addNode = (
    kind: NodeKind,
    label: string,
    lineNum: number,
    edgeLabel?: string,
    customSourceId?: string
  ) => {
    const id = `${kind}-${label.replace(/\W/g, "_")}-${lineNum}`;
    const node: CodeNode = {
      id,
      type: kind,
      position: { x: 0, y: 0 },
      data: {
        label,
        kind,
        lineStart: lineNum,
        lineEnd: lineNum,
      },
    };
    nodes.push(node);
    
    const sourceId = customSourceId || prevId;
    if (sourceId) {
      edges.push({
        id: `e-${sourceId}->${id}`,
        source: sourceId,
        target: id,
        type: "smoothstep",
        label: edgeLabel,
        animated: edgeLabel !== undefined || kind === "output" || kind === "loop",
        data: edgeLabel ? { label: edgeLabel } : {},
      });
    }
    prevId = id;
    return id;
  };

  if (lang === "html") {
    // Basic HTML parser
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/<html/i)) addNode("component", "<html>", i + 1);
      else if (line.match(/<head/i)) addNode("component", "<head>", i + 1);
      else if (line.match(/<body/i)) addNode("component", "<body>", i + 1);
      else if (line.match(/<script/i)) addNode("function", "<script>", i + 1);
      else if (line.match(/<style/i)) addNode("component", "<style>", i + 1);
    }
  } else if (lang === "cpp" || lang === "c" || lang === "java") {
    let lastIfId: string | null = null;
    let pendingEdgeLabel: string | undefined = undefined;
    let sourceForNext: string | undefined = undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Common across C++ and Java
      if (lang === "cpp" && line.match(/^\s*#include\s+/)) {
        addNode("import", line.trim(), i + 1, pendingEdgeLabel, sourceForNext);
        pendingEdgeLabel = undefined; sourceForNext = undefined;
      } else if (lang === "java" && line.match(/^\s*import\s+/)) {
        addNode("import", line.trim().replace(";", ""), i + 1, pendingEdgeLabel, sourceForNext);
        pendingEdgeLabel = undefined; sourceForNext = undefined;
      } else if (lang === "java" && line.match(/^\s*(public|private|protected)?\s*class\s+\w+/)) {
        const match = line.match(/class\s+(\w+)/);
        if (match) {
          addNode("component", "class " + match[1], i + 1, pendingEdgeLabel, sourceForNext);
          pendingEdgeLabel = undefined; sourceForNext = undefined;
        }
      } else if (line.match(/^\s*(int|void|float|double|char|public|private|protected|static)\s+.*?\w+\s*\(/)) {
        // Function / Method detection
        const match = line.match(/(\w+)\s*\(/);
        if (match && !["if", "for", "while", "catch", "switch"].includes(match[1])) {
          addNode("function", match[1] + "()", i + 1, pendingEdgeLabel, sourceForNext);
          pendingEdgeLabel = undefined; sourceForNext = undefined;
        }
      } else if (line.match(/^\s*(for|while)\s*\(/)) {
        const match = line.match(/^\s*(for|while)\s*\((.*?)\)/);
        if (match) {
          const type = match[1];
          const cond = match[2].trim();
          const lbl = `${type} (${cond})`;
          addNode("loop", lbl, i + 1, pendingEdgeLabel, sourceForNext);
          pendingEdgeLabel = undefined;
          sourceForNext = undefined;
        }
      } else if (line.match(/^\s*if\s*\(/)) {
        const match = line.match(/^\s*if\s*\((.*?)\)/);
        const cond = match ? match[1].trim() : "...";
        const lbl = `if (${cond})`;
        const id = addNode("conditional", lbl, i + 1, pendingEdgeLabel, sourceForNext);
        lastIfId = id;
        pendingEdgeLabel = "true";
        sourceForNext = id;
      } else if (line.match(/^\s*\}?\s*else\s*\{?/)) {
        if (lastIfId) {
          pendingEdgeLabel = "false";
          sourceForNext = lastIfId;
        }
      } else if (line.match(/^\s*(String|string|char\*|let|const|var)\s+\w+\s*=\s*"(.*?)"/)) {
        const match = line.match(/^\s*(?:String|string|char\*|let|const|var)\s+(\w+)\s*=\s*"(.*?)"/);
        if (match) {
          const varName = match[1];
          const varVal = match[2];
          addNode("variable", `${varName} = "${varVal}"`, i + 1, pendingEdgeLabel, sourceForNext);
          pendingEdgeLabel = undefined;
          sourceForNext = undefined;
        }
      } else if (line.match(/System\.out\.print/)) {
        const match = line.match(/System\.out\.println\((.*?)\)/);
        // Clean up the match to just show the content, stripping + and "
        const content = match ? match[1].replace(/["+]/g, '').trim() : "println()";
        const lbl = `print(${content})`;
        addNode("output", lbl, i + 1, pendingEdgeLabel, sourceForNext);
        pendingEdgeLabel = undefined;
        sourceForNext = undefined;
      } else if (line.match(/cout\s*<</)) {
        const match = line.match(/cout\s*<<\s*"(.*?)"/);
        const content = match ? `"${match[1]}"` : "cout";
        const lbl = `print(${content})`;
        addNode("output", lbl, i + 1, pendingEdgeLabel, sourceForNext);
        pendingEdgeLabel = undefined;
        sourceForNext = undefined;
      } else if (line.match(/^\s*return\b/)) {
        addNode("return", "return", i + 1, pendingEdgeLabel, sourceForNext);
        pendingEdgeLabel = undefined;
        sourceForNext = undefined;
      }
    }
  } else if (lang === "python") {
    let lastIfId: string | null = null;
    let pendingEdgeLabel: string | undefined = undefined;
    let sourceForNext: string | undefined = undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^\s*def\s+\w+\s*\(/)) {
        const match = line.match(/^\s*def\s+(\w+)\s*\(/);
        if (match) {
          addNode("function", match[1] + "()", i + 1, pendingEdgeLabel, sourceForNext);
          pendingEdgeLabel = undefined; sourceForNext = undefined;
        }
      } else if (line.match(/^\s*(for|while)\s+/)) {
        const match = line.match(/^\s*(for|while)\s+(.*?):/);
        if (match) {
          const type = match[1];
          const cond = match[2].trim();
          const lbl = `${type} (${cond})`;
          addNode("loop", lbl, i + 1, pendingEdgeLabel, sourceForNext);
          pendingEdgeLabel = undefined; sourceForNext = undefined;
        }
      } else if (line.match(/^\s*(if|elif)\s+/)) {
        const match = line.match(/^\s*(if|elif)\s+(.*?):/);
        const cond = match ? match[2].trim() : "...";
        const lbl = `${match ? match[1] : 'if'} (${cond})`;
        const id = addNode("conditional", lbl, i + 1, pendingEdgeLabel, sourceForNext);
        lastIfId = id;
        pendingEdgeLabel = "true";
        sourceForNext = id;
      } else if (line.match(/^\s*else:/)) {
        if (lastIfId) {
          pendingEdgeLabel = "false";
          sourceForNext = lastIfId;
        }
      } else if (line.match(/^\s*\w+\s*=\s*["']/)) {
        const match = line.match(/^\s*(\w+)\s*=\s*(["'].*?["'])/);
        if (match) {
          const varName = match[1];
          const varVal = match[2];
          addNode("variable", `${varName} = ${varVal}`, i + 1, pendingEdgeLabel, sourceForNext);
          pendingEdgeLabel = undefined; sourceForNext = undefined;
        }
      } else if (line.match(/print\s*\(/)) {
        const match = line.match(/print\s*\((.*?)\)/);
        const content = match ? match[1].replace(/["']/g, '').trim() : "";
        const lbl = `print(${content})`;
        addNode("output", lbl, i + 1, pendingEdgeLabel, sourceForNext);
        pendingEdgeLabel = undefined; sourceForNext = undefined;
      } else if (line.match(/^\s*return\b/)) {
        addNode("return", "return", i + 1, pendingEdgeLabel, sourceForNext);
        pendingEdgeLabel = undefined; sourceForNext = undefined;
      }
    }
  } else if (lang === "sql") {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^\s*CREATE\s+TABLE\s+\w+/i)) {
        const match = line.match(/^\s*CREATE\s+TABLE\s+(\w+)/i);
        if (match) addNode("component", `Table: ${match[1]}`, i + 1);
      } else if (line.match(/^\s*INSERT\s+INTO\s+\w+/i)) {
        const match = line.match(/^\s*INSERT\s+INTO\s+(\w+)/i);
        if (match) addNode("function", `Insert -> ${match[1]}`, i + 1);
      } else if (line.match(/^\s*SELECT\b/i)) {
        addNode("output", "SELECT Query", i + 1);
      } else if (line.match(/^\s*UPDATE\s+\w+/i)) {
        const match = line.match(/^\s*UPDATE\s+(\w+)/i);
        if (match) addNode("function", `Update -> ${match[1]}`, i + 1);
      } else if (line.match(/^\s*DELETE\s+FROM\s+\w+/i)) {
        const match = line.match(/^\s*DELETE\s+FROM\s+(\w+)/i);
        if (match) addNode("tryCatch", `Delete -> ${match[1]}`, i + 1);
      }
    }
  }

  if (nodes.length === 0) {
    addNode("function", "Source Code", 1);
  }

  return { nodes, edges };
}
