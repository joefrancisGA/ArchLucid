import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const RECOVERY_SOURCE_FILES = [
  "src/components/ReviewPackageLoadFailureView.tsx",
  "src/components/runs/RunsListAggregateErrorBoundary.tsx",
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

  it("keeps live recovery views free of showcase static demo imports", () => {
    for (const relativePath of RECOVERY_SOURCE_FILES) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      expect(source).not.toContain("SHOWCASE_STATIC_DEMO_RUN_ID");
      expect(source).not.toContain("SHOWCASE_STATIC_DEMO_MANIFEST_ID");
    }
  });

  it("gates RunsListAggregateErrorBoundary sample substitution on live shell context", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/runs/RunsListAggregateErrorBoundary.tsx"),
      "utf8",
    );

    expect(source).toContain("isLiveOperatorShellRecoveryContext");
    expect(source).toContain("tryStaticDemoRunSummariesPaged");
    expect(source).toMatch(
      /isLiveOperatorShellRecoveryContext\(\)\s*\?\s*null\s*:\s*tryStaticDemoRunSummariesPaged/,
    );
  });
});
