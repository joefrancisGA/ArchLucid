import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GUARDED_PATH_INVENTORIES } from "@/lib/inventory/guarded-path-inventories";
import {
  findMissingInventoryPaths,
  findStaleInventories,
  formatStaleInventories,
} from "@/lib/inventory/inventory-path-existence";

const UI_ROOT = process.cwd();

function existsUnderUiRoot(uiRootRelativePath: string): boolean {
  return existsSync(join(UI_ROOT, ...uiRootRelativePath.split("/")));
}

describe("guarded path inventories", () => {
  it("registers at least one inventory", () => {
    expect(GUARDED_PATH_INVENTORIES.length).toBeGreaterThan(0);
  });

  it.each(GUARDED_PATH_INVENTORIES.map((source) => [source.id, source] as const))(
    "%s points only at modules that exist",
    (_id, source) => {
      const missing = findMissingInventoryPaths(source, existsUnderUiRoot);

      expect(missing, `${source.id} in ${source.module} lists deleted or renamed modules`).toEqual(
        [],
      );
    },
  );

  it("reports every stale inventory in one message", () => {
    const stale = findStaleInventories(GUARDED_PATH_INVENTORIES, existsUnderUiRoot);

    expect(stale, formatStaleInventories(stale)).toEqual([]);
  });
});
