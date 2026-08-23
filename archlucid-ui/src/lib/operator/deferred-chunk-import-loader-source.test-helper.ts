import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const operatorLibDir = dirname(fileURLToPath(import.meta.url));

/** Reads codegen import loaders for deferred-chunk import-graph drift guards. */
export function readDeferredChunkImportLoaderSource(): string {
  return readFileSync(join(operatorLibDir, "deferred-chunk-import-loaders.generated.ts"), "utf8");
}
