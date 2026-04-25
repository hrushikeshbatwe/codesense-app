import LZString from "lz-string";

export function encodeCode(code: string): string {
  return LZString.compressToEncodedURIComponent(code);
}

export function decodeCode(param: string): string | null {
  try {
    return LZString.decompressFromEncodedURIComponent(param) || null;
  } catch {
    return null;
  }
}
