import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round144 wave C mounted contract", () => {
  it("compare finalize strip, hub blocker queue, workspace unified next step", () => {
    const compareForm = readUiSource(
      "app/(operator)/insights/compare-two-reviews/_sections/CompareForm.tsx",
    );
    expect(compareForm).toContain("CompareFinalizeDecisionNextStrip");

    const hub = readUiSource("app/(operator)/architecture/reviews/_sections/ReviewsHubReviewInventory.tsx");
    expect(hub).toContain("ReviewsHubDecisionBlockerQueueStrip");
    expect(hub).toContain("collectReviewsHubDecisionBlockers");

    const chrome = readUiSource(
      "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.tsx",
    );
    expect(chrome).toContain("ReviewWorkspaceLifecycleProgressStepper");
    expect(chrome).toContain("ReviewWorkspaceUnifiedSearchHonestyStrip");

    const tabShell = readUiSource("components/reviews/ReviewDetailWorkspaceTabShell.tsx");
    expect(tabShell).toContain("ReviewWorkspaceTabCognitiveNextStep");
  });
});
