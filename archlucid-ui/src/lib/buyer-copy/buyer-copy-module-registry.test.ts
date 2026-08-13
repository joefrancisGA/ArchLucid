/**
 * Keeps `BUYER_COPY_MODULE_PATHS` in step with the modules actually on disk.
 *
 * Copy guards elsewhere scan these paths as text. When copy moves into a new module that nobody
 * registers, those guards keep passing while covering less — the failure mode this test removes.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { BUYER_COPY_MODULE_PATHS } from "./module-paths";

const MODULE_DIRECTORY = "src/lib/buyer-copy";

/** Barrel and tests hold no copy of their own, so guards have nothing to scan in them. */
const NON_SURFACE_MODULES = new Set<string>(["index.ts", "module-paths.ts"]);

function listSurfaceModuleFiles(): string[] {
  return readdirSync(join(process.cwd(), MODULE_DIRECTORY))
    .filter((entry) => entry.endsWith(".ts") && !entry.endsWith(".test.ts"))
    .filter((entry) => !NON_SURFACE_MODULES.has(entry))
    .map((entry) => `${MODULE_DIRECTORY}/${entry}`)
    .sort();
}

describe("buyer copy module registry", () => {
  it("registers every surface module on disk", () => {
    expect([...BUYER_COPY_MODULE_PATHS].sort()).toEqual(listSurfaceModuleFiles());
  });

  it("registers each path exactly once", () => {
    expect(new Set(BUYER_COPY_MODULE_PATHS).size).toBe(BUYER_COPY_MODULE_PATHS.length);
  });

  it("points at modules that actually declare copy", () => {
    const empty: string[] = [];

    for (const relativePath of BUYER_COPY_MODULE_PATHS) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      if (!/^export (?:const|function)\s/m.test(source)) {
        empty.push(relativePath);
      }
    }

    expect(empty).toEqual([]);
  });
});
