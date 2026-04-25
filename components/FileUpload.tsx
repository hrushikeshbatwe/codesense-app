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
        className="text-xs px-2.5 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
      >
        ↑ Upload
      </button>
    </>
  );
}
