import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  discoverBuyerPolishEvalChromeUsagePaths,
  findProductionDeskChromeEvalGuardViolations,
  findProductionDeskChromeEvalMigratedSurfaceViolations,
} from "@/lib/production-desk-chrome-eval-guard";
import { PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS } from "@/lib/production-desk-chrome-eval-inventory";

const UI_ROOT = process.cwd();

describe("production-desk-chrome eval guard (WA-01)", () => {
  it("keeps migrated high-traffic surfaces on the production-desk resolver", () => {
    expect(findProductionDeskChromeEvalMigratedSurfaceViolations(UI_ROOT)).toEqual([]);
  });

  it("blocks new buyer-polish eval chrome outside the grandfather inventory", () => {
    expect(findProductionDeskChromeEvalGuardViolations(UI_ROOT)).toEqual([]);
  });

  it("documents the current grandfather footprint for migration planning", () => {
    const discovered = discoverBuyerPolishEvalChromeUsagePaths(UI_ROOT);
    const grandfathered = new Set(PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS);

    for (const relativePath of discovered) {
      const inGrandfather = grandfathered.has(relativePath);
      const source = readFileSync(join(UI_ROOT, "src", relativePath), "utf8");
      const usesResolver =
        source.includes("useProductionEvalChrome") ||
        source.includes("useProductionDeskChrome") ||
        source.includes("resolveProductionEvalChrome") ||
        source.includes("resolveProductionDeskChrome");

      expect(inGrandfather || usesResolver).toBe(true);
    }
  });
});
