"use client";

import Editor, { type Monaco, type OnMount, type OnChange } from "@monaco-editor/react";
import { forwardRef, useImperativeHandle, useRef } from "react";
import type * as MonacoEditor from "monaco-editor";

export interface CodeEditorHandle {
  jumpToLine: (lineNumber: number) => void;
  highlightRange: (startLine: number, endLine: number) => void;
  getValue: () => string;
}

interface CodeEditorProps {
  defaultValue?: string;
  onChange?: OnChange;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor({ defaultValue, onChange }, ref) {
    const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const decorationsRef = useRef<MonacoEditor.editor.IEditorDecorationsCollection | null>(null);

    const handleMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
    };

    useImperativeHandle(ref, () => ({
      jumpToLine(lineNumber: number) {
        const editor = editorRef.current;
        if (!editor) return;
        editor.revealLineInCenter(lineNumber);
        editor.setPosition({ lineNumber, column: 1 });
        editor.focus();
      },

      highlightRange(startLine: number, endLine: number) {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;

        decorationsRef.current?.clear();
        decorationsRef.current = editor.createDecorationsCollection([
          {
            range: new monaco.Range(startLine, 1, endLine, Number.MAX_SAFE_INTEGER),
            options: {
              isWholeLine: true,
              className: "monaco-highlighted-line",
              linesDecorationsClassName: "monaco-highlighted-gutter",
            },
          },
        ]);
      },

      getValue() {
        return editorRef.current?.getValue() ?? "";
      },
    }));

    return (
      <div className="h-full w-full">
        <Editor
          defaultLanguage="typescript"
          defaultValue={defaultValue}
          onMount={handleMount}
          onChange={onChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            padding: { top: 12 },
          }}
        />
      </div>
    );
  }
);
