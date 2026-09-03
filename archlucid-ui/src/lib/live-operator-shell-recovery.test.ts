import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const RECOVERY_SOURCE_FILES = [
  "src/hooks/use-first-review-guide-state.ts",
  "src/components/ReviewPackageLoadFailureView.tsx",
  "src/app/(operator)/architecture/reviews/[reviewId]/error.tsx",
];

describe("live operator shell recovery inventory", () => {
  it("gates showcase sample recovery behind live-shell checks", () => {
    const guideSource = readFileSync(join(process.cwd(), "src/hooks/use-first-review-guide-state.ts"), "utf8");

    expect(guideSource).toContain("isLiveOperatorShellRecoveryContext");
    expect(guideSource).toContain("resolveLoadingHeaderActions");
    expect(guideSource).toContain("resolveFirstReviewGuideHeaderActions");

    const failureSource = readFileSync(join(process.cwd(), "src/components/ReviewPackageLoadFailureView.tsx"), "utf8");

    expect(failureSource).not.toContain("SHOWCASE_STATIC_DEMO_RUN_ID");

    const runDetailErrorSource = readFileSync(
      join(process.cwd(), "src/app/(operator)/architecture/reviews/[reviewId]/error.tsx"),
      "utf8",
    );

    expect(runDetailErrorSource).toContain("isLiveOperatorShellRecoveryContext");
    expect(runDetailErrorSource).toContain("Review could not be loaded");
  });

  it("does not hardcode showcase ids in loading header defaults for live shells", () => {
    const guideSource = readFileSync(join(process.cwd(), "src/hooks/use-first-review-guide-state.ts"), "utf8");

    expect(guideSource).toMatch(
      /if \(isLiveOperatorShellRecoveryContext\(\)\) \{\s*return loadingHeaderActions;/,
    );
  });
});
