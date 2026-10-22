import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findButtonVisibleBoundaryViolations } from "@/lib/button-visible-boundary-source-patterns";

const REPO_ROOT = join(process.cwd());

/** CTO demo and tour overlay surfaces from TB-2171 — ghost migration landed in TB-2168. */
const CTO_DEMO_TOUR_BUTTON_PATHS = [
  "src/components/BuyerCtoDemoTourOverlay.tsx",
  "src/components/OnboardingTour.tsx",
  "src/components/cto-demo/CtoDemoHowItWorksTrigger.tsx",
  "src/components/cto-demo/CtoDemoSoftRestartButton.tsx",
  "src/components/tour/OptInTour.tsx",
  "src/components/tour/OptInTourLauncher.tsx",
] as const;

describe("CTO demo / tour button visible-boundary guard (TB-2171)", () => {
  it.each(CTO_DEMO_TOUR_BUTTON_PATHS)("does not emit ghost/link Button variants in %s", (relativePath) => {
    const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");
    const violations = findButtonVisibleBoundaryViolations(source);

    expect(violations, `${relativePath}: use outline per UI_DESIGN_SYSTEM.md § TB-2168`).toEqual([]);
  });
});
