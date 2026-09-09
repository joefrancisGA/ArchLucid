import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  discoverBuyerPolishEvalChromeUsagePaths,
  findProductionDeskChromeEvalGrandfatherShrinkViolations,
  findProductionDeskChromeEvalGuardViolations,
  findProductionDeskChromeEvalMigratedSurfaceViolations,
} from "@/lib/production-desk-chrome-eval-guard";
import {
  PRODUCTION_DESK_CHROME_EVAL_ARCHITECTURE_REVIEWS_GRANDFATHER_BASELINE,
  PRODUCTION_DESK_CHROME_EVAL_GRANDFATHER_COUNT_BASELINE,
  PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS,
  isArchitectureOrReviewEvalGrandfatherPath,
} from "@/lib/production-desk-chrome-eval-inventory";
import { WORKING_SEAT_EVAL_LEAK_INVENTORY_DOC_PATH } from "@/lib/working-seat-eval-leak-inventory";

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
        source.includes("resolveProductionDeskChrome") ||
        source.includes("resolveProductionEvalChromeFromStorage");

      expect(inGrandfather || usesResolver).toBe(true);
    }
  });

  it("references the WS-04 shrink-only inventory doc for architecture-priority leaks", () => {
    expect(WORKING_SEAT_EVAL_LEAK_INVENTORY_DOC_PATH).toBe(
      "docs/architecture/WORKING_SEAT_EVAL_LEAK_INVENTORY.md",
    );
  });
});

describe("production-desk-chrome eval grandfather shrink ratchet (WS-08)", () => {
  it("keeps the grandfather inventory at or below the WS-08 baseline count", () => {
    expect(PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS.length).toBeLessThanOrEqual(
      PRODUCTION_DESK_CHROME_EVAL_GRANDFATHER_COUNT_BASELINE,
    );
    expect(findProductionDeskChromeEvalGrandfatherShrinkViolations()).toEqual([]);
  });

  it("freezes architecture and review grandfather rows to the WS-08 baseline set", () => {
    const architectureReviewsGrandfathered = PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS.filter(
      (relativePath) => isArchitectureOrReviewEvalGrandfatherPath(relativePath),
    );

    expect(architectureReviewsGrandfathered.sort()).toEqual(
      [...PRODUCTION_DESK_CHROME_EVAL_ARCHITECTURE_REVIEWS_GRANDFATHER_BASELINE].sort(),
    );
  });

  it("flags a new review-detail buyer-polish grandfather row", () => {
    const fakeReviewDetailPath =
      "app/(operator)/architecture/reviews/[reviewId]/_sections/FakeBuyerPolishSubtitle.tsx";
    const simulatedGrandfather = [...PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS, fakeReviewDetailPath];
    const architectureReviewsBaseline = new Set<string>(
      PRODUCTION_DESK_CHROME_EVAL_ARCHITECTURE_REVIEWS_GRANDFATHER_BASELINE,
    );

    const blocked = simulatedGrandfather.some(
      (relativePath) =>
        isArchitectureOrReviewEvalGrandfatherPath(relativePath) &&
        !architectureReviewsBaseline.has(relativePath),
    );

    expect(blocked).toBe(true);
    expect(findProductionDeskChromeEvalGrandfatherShrinkViolations()).toEqual([]);
  });

  it("blocks discovered buyer-polish on architecture paths outside grandfather and resolver", () => {
    const discovered = discoverBuyerPolishEvalChromeUsagePaths(UI_ROOT);
    const architectureReviewLeaks = discovered.filter((relativePath) =>
      isArchitectureOrReviewEvalGrandfatherPath(relativePath),
    );

    for (const relativePath of architectureReviewLeaks) {
      const source = readFileSync(join(UI_ROOT, "src", relativePath), "utf8");
      const usesResolver =
        source.includes("useProductionEvalChrome") ||
        source.includes("useProductionDeskChrome") ||
        source.includes("resolveProductionEvalChrome") ||
        source.includes("resolveProductionDeskChrome") ||
        source.includes("resolveProductionEvalChromeFromStorage");
      const inGrandfatherBaseline = (
        PRODUCTION_DESK_CHROME_EVAL_ARCHITECTURE_REVIEWS_GRANDFATHER_BASELINE as readonly string[]
      ).includes(relativePath);

      expect(usesResolver || inGrandfatherBaseline).toBe(true);
    }
  });
});
