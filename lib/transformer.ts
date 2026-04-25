"use client";

import type {
  File as BabelFile,
  Node as BabelNode,
  Statement,
  Expression,
  FunctionDeclaration,
  ArrowFunctionExpression,
  FunctionExpression,
  IfStatement,
  SwitchStatement,
  SwitchCase,
  TryStatement,
  ForStatement,
  WhileStatement,
  DoWhileStatement,
  ForInStatement,
  ForOfStatement,
  ImportDeclaration,
  ReturnStatement,
  ExpressionStatement,
  CallExpression,
  VariableDeclaration,
  BlockStatement,
  Identifier,
  MemberExpression,
  StringLiteral,
  NumericLiteral,
} from "@babel/types";
import type { CodeNode, CodeEdge, FlowGraph, NodeKind } from "@/types/flow.types";

// ─── ID generation ───────────────────────────────────────────────────────────

function makeId(kind: string, name: string, line: number): string {
  return `${kind}-${name.replace(/\W/g, "_")}-${line}`;
}

// ─── JSX detection ───────────────────────────────────────────────────────────

function containsJSX(node: BabelNode): boolean {
  if (!node || typeof node !== "object") return false;
  if (node.type === "JSXElement" || node.type === "JSXFragment") return true;
  for (const key of Object.keys(node)) {
    if (key === "type" || key === "start" || key === "end" || key === "loc") continue;
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      if (child.some((c) => c && typeof c === "object" && "type" in c && containsJSX(c as BabelNode))) return true;
    } else if (child && typeof child === "object" && "type" in child) {
      if (containsJSX(child as BabelNode)) return true;
    }
  }
  return false;
}

// ─── Parameter extraction ─────────────────────────────────────────────────────

function extractParams(params: BabelNode[]): string[] {
  return params.map((p) => {
    if (p.type === "Identifier") return (p as Identifier).name;
    if (p.type === "AssignmentPattern") {
      const left = (p as { left: BabelNode }).left;
      if (left.type === "Identifier") return `${(left as Identifier).name}?`;
    }
    if (p.type === "RestElement") {
      const arg = (p as { argument: BabelNode }).argument;
      if (arg.type === "Identifier") return `...${(arg as Identifier).name}`;
    }
    if (p.type === "ObjectPattern") return "{}";
    if (p.type === "ArrayPattern") return "[]";
    return "_";
  });
}

// ─── API call detection ───────────────────────────────────────────────────────

function isApiCall(node: CallExpression): boolean {
  const callee = node.callee;
  if (callee.type === "Identifier" && (callee as Identifier).name === "fetch") return true;
  if (callee.type === "MemberExpression") {
    const obj = (callee as MemberExpression).object;
    if (obj.type === "Identifier" && (obj as Identifier).name === "axios") return true;
    if (obj.type === "Identifier" && (obj as Identifier).name === "http") return true;
  }
  return false;
}

function getApiCallLabel(node: CallExpression): string {
  const callee = node.callee;
  if (callee.type === "Identifier") return (callee as Identifier).name;
  if (callee.type === "MemberExpression") {
    const obj = (callee as MemberExpression).object;
    const prop = (callee as MemberExpression).property;
    const objName = obj.type === "Identifier" ? (obj as Identifier).name : "?";
    const propName = prop.type === "Identifier" ? (prop as Identifier).name : "?";
    return `${objName}.${propName}`;
  }
  return "api";
}

// ─── Loop method detection ────────────────────────────────────────────────────

const LOOP_METHODS = new Set(["map", "forEach", "filter", "reduce", "find", "some", "every", "flatMap"]);

function isLoopMethodCall(node: CallExpression): string | null {
  const callee = node.callee;
  if (callee.type === "MemberExpression") {
    const prop = (callee as MemberExpression).property;
    if (prop.type === "Identifier" && LOOP_METHODS.has((prop as Identifier).name)) {
      return (prop as Identifier).name;
    }
  }
  return null;
}

// ─── Transformer state ────────────────────────────────────────────────────────

interface TransformState {
  nodes: CodeNode[];
  edges: CodeEdge[];
  functionRegistry: Map<string, string>; // name → nodeId
  sourceLines: string[];
}

function addNode(state: TransformState, node: CodeNode): void {
  state.nodes.push(node);
}

function addEdge(
  state: TransformState,
  source: string,
  target: string,
  label?: string,
  dashed?: boolean,
  animated?: boolean
): void {
  const id = `e-${source}->${target}${label ? `-${label}` : ""}`;
  // Avoid duplicates
  if (state.edges.some((e) => e.id === id)) return;
  state.edges.push({
    id,
    source,
    target,
    data: label ? { label } : {},
    label: label,
    type: "smoothstep",
    animated: animated ?? false,
    style: dashed ? { strokeDasharray: "5,5" } : undefined,
  });
}

function getLine(node: BabelNode): number {
  return node.loc?.start.line ?? 1;
}

function getEndLine(node: BabelNode): number {
  return node.loc?.end.line ?? getLine(node);
}

// ─── Statement list processing ────────────────────────────────────────────────
// Returns the entry node ID of the first statement in the list (for edge wiring)

function processStatements(
  state: TransformState,
  statements: Statement[],
  parentId: string | null
): string | null {
  let prevId: string | null = parentId;
  let firstId: string | null = null;

  for (const stmt of statements) {
    const id = processStatement(state, stmt, prevId);
    if (id) {
      if (!firstId) firstId = id;
      prevId = id;
    }
  }

  return firstId;
}

// ─── Single statement processing ─────────────────────────────────────────────

function processStatement(
  state: TransformState,
  stmt: Statement,
  prevId: string | null
): string | null {
  const line = getLine(stmt);
  const endLine = getEndLine(stmt);

  switch (stmt.type) {
    case "FunctionDeclaration": {
      return processFunctionDeclaration(state, stmt as FunctionDeclaration, prevId);
    }

    case "VariableDeclaration": {
      return processVariableDeclaration(state, stmt as VariableDeclaration, prevId);
    }

    case "ExpressionStatement": {
      return processExpressionStatement(state, stmt as ExpressionStatement, prevId);
    }

    case "IfStatement": {
      return processIfStatement(state, stmt as IfStatement, prevId);
    }

    case "ForStatement":
    case "WhileStatement":
    case "DoWhileStatement":
    case "ForInStatement":
    case "ForOfStatement": {
      return processLoopStatement(state, stmt as ForStatement | WhileStatement | DoWhileStatement | ForInStatement | ForOfStatement, prevId);
    }

    case "SwitchStatement": {
      return processSwitchStatement(state, stmt as SwitchStatement, prevId);
    }

    case "TryStatement": {
      return processTryStatement(state, stmt as TryStatement, prevId);
    }

    case "ImportDeclaration": {
      return processImportDeclaration(state, stmt as ImportDeclaration, prevId);
    }

    case "ReturnStatement": {
      return processReturnStatement(state, stmt as ReturnStatement, prevId);
    }

    case "BlockStatement": {
      const block = stmt as BlockStatement;
      const first = processStatements(state, block.body, prevId);
      return first;
    }

    case "ExportDefaultDeclaration":
    case "ExportNamedDeclaration": {
      const decl = (stmt as { declaration?: Statement | null }).declaration;
      if (decl && decl.type === "FunctionDeclaration") {
        return processFunctionDeclaration(state, decl as FunctionDeclaration, prevId);
      }
      if (decl && decl.type === "VariableDeclaration") {
        return processVariableDeclaration(state, decl as VariableDeclaration, prevId);
      }
      return null;
    }

    default:
      return null;
  }
}

// ─── Function declaration ─────────────────────────────────────────────────────

function processFunctionDeclaration(
  state: TransformState,
  node: FunctionDeclaration,
  prevId: string | null
): string {
  const name = node.id?.name ?? "anonymous";
  const isComponent = /^[A-Z]/.test(name) && containsJSX(node.body);
  const kind: NodeKind = isComponent ? "component" : "function";
  const id = makeId(kind, name, getLine(node));
  const params = extractParams(node.params as BabelNode[]);

  addNode(state, {
    id,
    type: kind,
    position: { x: 0, y: 0 },
    data: {
      label: name,
      kind,
      name,
      params,
      lineStart: getLine(node),
      lineEnd: getEndLine(node),
      isAsync: node.async,
    },
  });

  state.functionRegistry.set(name, id);

  if (prevId) addEdge(state, prevId, id);

  // Process the function body
  if (node.body.body.length > 0) {
    processStatements(state, node.body.body, id);
  }

  return id;
}

// ─── Arrow / function expression ──────────────────────────────────────────────

function processFunctionExpression(
  state: TransformState,
  name: string,
  node: ArrowFunctionExpression | FunctionExpression,
  prevId: string | null
): string {
  const isComponent = /^[A-Z]/.test(name) && containsJSX(node.body as BabelNode);
  const kind: NodeKind = isComponent ? "component" : "function";
  const id = makeId(kind, name, getLine(node));
  const params = extractParams(node.params as BabelNode[]);

  addNode(state, {
    id,
    type: kind,
    position: { x: 0, y: 0 },
    data: {
      label: name,
      kind,
      name,
      params,
      lineStart: getLine(node),
      lineEnd: getEndLine(node),
      isAsync: node.async,
    },
  });

  state.functionRegistry.set(name, id);

  if (prevId) addEdge(state, prevId, id);

  // Process body
  if (node.body.type === "BlockStatement") {
    processStatements(state, (node.body as BlockStatement).body, id);
  }

  return id;
}

// ─── Variable declaration ─────────────────────────────────────────────────────

function processVariableDeclaration(
  state: TransformState,
  node: VariableDeclaration,
  prevId: string | null
): string | null {
  let lastId: string | null = null;
  for (const declarator of node.declarations) {
    const init = declarator.init;
    if (
      init &&
      (init.type === "ArrowFunctionExpression" || init.type === "FunctionExpression")
    ) {
      const name =
        declarator.id.type === "Identifier" ? (declarator.id as Identifier).name : "fn";
      const id = processFunctionExpression(state, name, init as ArrowFunctionExpression | FunctionExpression, prevId);
      lastId = id;
      prevId = id;
    } else if (init && init.type === "CallExpression") {
      // Could be an inline api call assigned to var
      const callId = processCallExpression(state, init as CallExpression, prevId);
      if (callId) {
        lastId = callId;
        prevId = callId;
      }
    } else if (init && init.type === "StringLiteral") {
      const name = declarator.id.type === "Identifier" ? (declarator.id as Identifier).name : "var";
      const val = (init as StringLiteral).value;
      const id = makeId("variable", name, getLine(node));
      addNode(state, {
        id,
        type: "variable",
        position: { x: 0, y: 0 },
        data: {
          label: `${name} = "${val}"`,
          kind: "variable",
          lineStart: getLine(node),
          lineEnd: getEndLine(node),
        },
      });
      if (prevId) addEdge(state, prevId, id);
      lastId = id;
      prevId = id;
    } else if (init && init.type === "TemplateLiteral") {
      const name = declarator.id.type === "Identifier" ? (declarator.id as Identifier).name : "var";
      const id = makeId("variable", name, getLine(node));
      addNode(state, {
        id,
        type: "variable",
        position: { x: 0, y: 0 },
        data: {
          label: `${name} = \`...\``,
          kind: "variable",
          lineStart: getLine(node),
          lineEnd: getEndLine(node),
        },
      });
      if (prevId) addEdge(state, prevId, id);
      lastId = id;
      prevId = id;
    }
  }
  return lastId;
}

// ─── Expression statement ─────────────────────────────────────────────────────

function processExpressionStatement(
  state: TransformState,
  node: ExpressionStatement,
  prevId: string | null
): string | null {
  if (node.expression.type === "CallExpression") {
    return processCallExpression(state, node.expression as CallExpression, prevId);
  }
  return null;
}

// ─── Call expression ──────────────────────────────────────────────────────────

function processCallExpression(
  state: TransformState,
  node: CallExpression,
  prevId: string | null
): string | null {
  const line = getLine(node);

  // API call (fetch / axios)
  if (isApiCall(node)) {
    const label = getApiCallLabel(node);
    const id = makeId("apiCall", label, line);
    addNode(state, {
      id,
      type: "apiCall",
      position: { x: 0, y: 0 },
      data: {
        label,
        kind: "apiCall",
        lineStart: line,
        lineEnd: getEndLine(node),
      },
    });
    if (prevId) addEdge(state, prevId, id, undefined, false, true);
    return id;
  }

  // Console output
  if (
    node.callee.type === "MemberExpression" &&
    node.callee.object.type === "Identifier" &&
    node.callee.object.name === "console"
  ) {
    let msg = "console.log()";
    if (node.arguments.length > 0) {
      const arg = node.arguments[0];
      if (arg.type === "StringLiteral") {
        msg = `print("${arg.value}")`;
      } else if (arg.type === "Identifier") {
        msg = `print(${arg.name})`;
      } else {
        msg = `print(...)`;
      }
    }
    const id = makeId("output", "console", line);
    addNode(state, {
      id,
      type: "output",
      position: { x: 0, y: 0 },
      data: {
        label: msg,
        kind: "output",
        lineStart: line,
        lineEnd: getEndLine(node),
      },
    });
    if (prevId) addEdge(state, prevId, id);
    return id;
  }

  // Loop method (.map / .forEach etc.)
  const loopMethod = isLoopMethodCall(node);
  if (loopMethod) {
    const id = makeId("loop", loopMethod, line);
    addNode(state, {
      id,
      type: "loop",
      position: { x: 0, y: 0 },
      data: {
        label: `.${loopMethod}()`,
        kind: "loop",
        lineStart: line,
        lineEnd: getEndLine(node),
      },
    });
    if (prevId) addEdge(state, prevId, id);
    return id;
  }

  // Known function call — draw dashed call edge
  if (node.callee.type === "Identifier") {
    const calleeName = (node.callee as Identifier).name;
    const targetId = state.functionRegistry.get(calleeName);
    if (targetId && prevId) {
      addEdge(state, prevId, targetId, "call", true);
    }
  }

  return null;
}

// ─── If statement ─────────────────────────────────────────────────────────────

function processIfStatement(
  state: TransformState,
  node: IfStatement,
  prevId: string | null
): string {
  const line = getLine(node);
  const rawLine = state.sourceLines[line - 1] || "";
  const match = rawLine.match(/^\s*\}?\s*else\s+if\s*\((.*?)\)\s*\{?|^\s*if\s*\((.*?)\)\s*\{?/);
  const rawCond = match ? (match[1] || match[2] || "...") : "...";
  const condLabel = rawCond;
  
  const id = makeId("conditional", "if", line);

  addNode(state, {
    id,
    type: "conditional",
    position: { x: 0, y: 0 },
    data: {
      label: `if (${condLabel})`,
      kind: "conditional",
      lineStart: line,
      lineEnd: getEndLine(node),
    },
  });

  if (prevId) addEdge(state, prevId, id);

  // Consequent (true branch) — process with null parent so we control the labeled edge
  if (node.consequent.type === "BlockStatement") {
    const firstConseqId = processStatements(state, (node.consequent as BlockStatement).body, null);
    if (firstConseqId) addEdge(state, id, firstConseqId, "true");
  }

  // Alternate (false / else-if) — same pattern
  if (node.alternate) {
    const alt = node.alternate;
    if (alt.type === "BlockStatement") {
      const firstAltId = processStatements(state, (alt as BlockStatement).body, null);
      if (firstAltId) addEdge(state, id, firstAltId, "false");
    } else if (alt.type === "IfStatement") {
      const altId = processIfStatement(state, alt as IfStatement, null);
      addEdge(state, id, altId, "false");
    }
  }

  return id;
}

// ─── Loop statement ───────────────────────────────────────────────────────────

function processLoopStatement(
  state: TransformState,
  node: ForStatement | WhileStatement | DoWhileStatement | ForInStatement | ForOfStatement,
  prevId: string | null
): string {
  const line = getLine(node);
  let kindLabel =
    node.type === "ForStatement" ? "for"
    : node.type === "WhileStatement" ? "while"
    : node.type === "DoWhileStatement" ? "do…while"
    : node.type === "ForInStatement" ? "for…in"
    : "for…of";

  const rawLine = state.sourceLines[line - 1] || "";
  const match = rawLine.match(/^\s*(for|while)\s*\((.*?)\)\s*\{?/);
  if (match) {
    const cond = match[2].trim();
    kindLabel = `${kindLabel} (${cond})`;
  }

  const id = makeId("loop", kindLabel, line);

  addNode(state, {
    id,
    type: "loop",
    position: { x: 0, y: 0 },
    data: {
      label: kindLabel,
      kind: "loop",
      lineStart: line,
      lineEnd: getEndLine(node),
    },
  });

  if (prevId) addEdge(state, prevId, id);

  // Process body
  const body = (node as { body: Statement }).body;
  if (body && body.type === "BlockStatement") {
    const firstBody = processStatements(state, (body as BlockStatement).body, id);
    if (firstBody) addEdge(state, id, firstBody, "body");
  }

  return id;
}

// ─── Import declaration ───────────────────────────────────────────────────────

function processImportDeclaration(
  state: TransformState,
  node: ImportDeclaration,
  prevId: string | null
): string {
  const source = node.source.value;
  const specifiers = node.specifiers.map((s) => {
    if (s.type === "ImportDefaultSpecifier") return s.local.name;
    if (s.type === "ImportNamespaceSpecifier") return `* as ${s.local.name}`;
    return s.local.name;
  });
  const label = specifiers.length > 0
    ? `${specifiers.slice(0, 2).join(", ")}${specifiers.length > 2 ? "…" : ""} from "${source}"`
    : `"${source}"`;

  const id = makeId("import", source, getLine(node));

  addNode(state, {
    id,
    type: "import",
    position: { x: 0, y: 0 },
    data: {
      label,
      kind: "import",
      lineStart: getLine(node),
      lineEnd: getEndLine(node),
    },
  });

  if (prevId) addEdge(state, prevId, id);
  return id;
}

// ─── Return statement ─────────────────────────────────────────────────────────

function processReturnStatement(
  state: TransformState,
  node: ReturnStatement,
  prevId: string | null
): string {
  const line = getLine(node);
  const hasJSX = node.argument ? containsJSX(node.argument) : false;
  const label = hasJSX ? "return JSX" : "return";
  const id = makeId("return", label, line);

  addNode(state, {
    id,
    type: "return",
    position: { x: 0, y: 0 },
    data: {
      label,
      kind: "return",
      lineStart: line,
      lineEnd: getEndLine(node),
    },
  });

  if (prevId) addEdge(state, prevId, id);
  return id;
}

// ─── Expression label helper ──────────────────────────────────────────────────

function getExprLabel(expr: Expression): string {
  if (expr.type === "Identifier") return (expr as Identifier).name;
  if (expr.type === "MemberExpression") {
    const { object: obj, property: prop } = expr as MemberExpression;
    const o = obj.type === "Identifier" ? (obj as Identifier).name : "?";
    const p = prop.type === "Identifier" ? (prop as Identifier).name : "?";
    return `${o}.${p}`;
  }
  return "expr";
}

function getCaseLabel(test: Expression | null): string {
  if (!test) return "default";
  if (test.type === "StringLiteral") return `"${(test as StringLiteral).value}"`;
  if (test.type === "NumericLiteral") return String((test as NumericLiteral).value);
  if (test.type === "Identifier") return (test as Identifier).name;
  return "case";
}

// ─── Switch statement ─────────────────────────────────────────────────────────

function processSwitchStatement(
  state: TransformState,
  node: SwitchStatement,
  prevId: string | null
): string {
  const line = getLine(node);
  const discriminant = getExprLabel(node.discriminant as Expression);
  const id = makeId("conditional", `switch-${discriminant}`, line);

  addNode(state, {
    id,
    type: "conditional",
    position: { x: 0, y: 0 },
    data: {
      label: `switch (${discriminant})`,
      kind: "conditional",
      lineStart: line,
      lineEnd: getEndLine(node),
    },
  });

  if (prevId) addEdge(state, prevId, id);

  for (const c of node.cases as SwitchCase[]) {
    const caseLabel = getCaseLabel(c.test as Expression | null);
    const stmts = c.consequent as Statement[];
    // Strip trailing BreakStatement for cleaner graphs
    const body = stmts.filter((s) => s.type !== "BreakStatement");
    if (body.length > 0) {
      const firstId = processStatements(state, body, null);
      if (firstId) addEdge(state, id, firstId, caseLabel);
    }
  }

  return id;
}

// ─── Try/catch statement ──────────────────────────────────────────────────────

function processTryStatement(
  state: TransformState,
  node: TryStatement,
  prevId: string | null
): string {
  const line = getLine(node);
  const id = makeId("tryCatch", "try", line);

  addNode(state, {
    id,
    type: "tryCatch",
    position: { x: 0, y: 0 },
    data: {
      label: node.handler ? "try / catch" : "try / finally",
      kind: "tryCatch",
      lineStart: line,
      lineEnd: getEndLine(node),
    },
  });

  if (prevId) addEdge(state, prevId, id);

  // try block
  if (node.block.body.length > 0) {
    const firstTry = processStatements(state, node.block.body as Statement[], null);
    if (firstTry) addEdge(state, id, firstTry, "try");
  }

  // catch block
  if (node.handler) {
    const param = node.handler.param;
    const catchLabel =
      param && param.type === "Identifier"
        ? `catch (${(param as Identifier).name})`
        : "catch";
    const firstCatch = processStatements(state, node.handler.body.body as Statement[], null);
    if (firstCatch) addEdge(state, id, firstCatch, catchLabel);
  }

  // finally block — sequential node after try/catch
  if (node.finalizer && node.finalizer.body.length > 0) {
    const finallyLine = getLine(node.finalizer);
    const finallyId = makeId("loop", "finally", finallyLine);
    addNode(state, {
      id: finallyId,
      type: "loop",
      position: { x: 0, y: 0 },
      data: {
        label: "finally",
        kind: "loop",
        lineStart: finallyLine,
        lineEnd: getEndLine(node.finalizer),
      },
    });
    addEdge(state, id, finallyId, "finally");
    processStatements(state, node.finalizer.body as Statement[], finallyId);
  }

  return id;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function transformAST(ast: BabelFile, _source: string): FlowGraph {
  const state: TransformState = {
    nodes: [],
    edges: [],
    functionRegistry: new Map(),
    sourceLines: _source.split("\n"),
  };

  const body = ast.program.body as Statement[];
  processStatements(state, body, null);

  // Deduplicate edges
  const seen = new Set<string>();
  const uniqueEdges = state.edges.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  return { nodes: state.nodes, edges: uniqueEdges };
}
