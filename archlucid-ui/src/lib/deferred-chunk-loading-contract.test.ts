import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { DEFERRED_CHUNK_LOADING_SURFACE_CLASS } from "@/components/ui/deferred-chunk-loading";
import { HAND_ROLLED_DEFERRED_CHUNK_LOADING_BASELINE_PATHS } from "@/lib/operator/deferred-chunk-loading-baseline";

const SRC_ROOT = join(process.cwd(), "src");

const HAND_ROLLED_DEFERRED_CHUNK_LOADING_BASELINE: ReadonlySet<string> = new Set(
  HAND_ROLLED_DEFERRED_CHUNK_LOADING_BASELINE_PATHS,
);

const DEFERRED_CHUNK_FILE_SUFFIX = "deferred-chunks.tsx";

/**
 * Canonical pulse surface duplicated inline before TB-2391 consolidation.
 * Marketing footer uses border-t/bg-neutral-50 and is intentionally out of scope.
 */
const HAND_ROLLED_DEFERRED_CHUNK_LOADING_PATTERN = new RegExp(
  DEFERRED_CHUNK_LOADING_SURFACE_CLASS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
);

function collectDeferredChunkFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectDeferredChunkFiles(absolute));
      continue;
    }

    if (absolute.endsWith(DEFERRED_CHUNK_FILE_SUFFIX) && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

function usesHandRolledDeferredChunkLoading(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");

  if (source.includes("DeferredChunkLoading")) {
    return false;
  }

  return HAND_ROLLED_DEFERRED_CHUNK_LOADING_PATTERN.test(source);
}

describe("deferred chunk loading (TB-2391)", () => {
  it("keeps hand-rolled deferred chunk placeholders inside the frozen baseline", () => {
    const offenders = collectDeferredChunkFiles(SRC_ROOT)
      .filter(usesHandRolledDeferredChunkLoading)
      .map(toPosixRelativePath)
      .filter((path) => !HAND_ROLLED_DEFERRED_CHUNK_LOADING_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that already use DeferredChunkLoading", () => {
    const stale = [...HAND_ROLLED_DEFERRED_CHUNK_LOADING_BASELINE]
      .filter((path) => !usesHandRolledDeferredChunkLoading(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
