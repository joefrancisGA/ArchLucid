import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { generateDeferredChunkImportLoadersSource } from "./generate-deferred-chunk-import-loaders.mjs";

const UI_ROOT = process.cwd();
const GENERATED_PATH = join(
  UI_ROOT,
  "src",
  "lib",
  "operator",
  "deferred-chunk-import-loaders.generated.ts",
);

describe("deferred chunk import loaders codegen drift guard", () => {
  it("keeps generated loaders in sync with chunk manifests", () => {
    const onDisk = readFileSync(GENERATED_PATH, "utf8");
    const expected = generateDeferredChunkImportLoadersSource();

    expect(onDisk).toBe(expected);
  });
});
