"use client";

import { useRef } from "react";

interface FileUploadProps {
  onLoad: (text: string, filename: string) => void;
  onError: (msg: string) => void;
}

const ALLOWED_EXTS = new Set([".js", ".ts", ".jsx", ".tsx"]);
const MAX_BYTES = 500_000;

export function FileUpload({ onLoad, onError }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      onError(`Unsupported type "${ext}". Use .js, .ts, .jsx, or .tsx.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      onError(`File too large (${(file.size / 1024).toFixed(0)} KB). Max 500 KB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onLoad(reader.result as string, file.name);
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".js,.ts,.jsx,.tsx"
        className="sr-only"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-150"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          color: "var(--muted)",
        }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Upload
      </button>
    </>
  );
}
