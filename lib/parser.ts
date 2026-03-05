"use client";

import { parse } from "@babel/parser";
import type { File as BabelFile } from "@babel/types";

export interface ParseResult {
  ast: BabelFile | null;
  error: string | null;
}

export function parseCode(code: string): ParseResult {
  try {
    const ast = parse(code, {
      sourceType: "module",
      plugins: [
        "typescript",
        "jsx",
        "classProperties",
        "decorators-legacy",
        "dynamicImport",
        "optionalChaining",
        "nullishCoalescingOperator",
      ],
      errorRecovery: true,
    });
    return { ast, error: null };
  } catch (err) {
    return {
      ast: null,
      error: err instanceof Error ? err.message : "Parse error",
    };
  }
}
