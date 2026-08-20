import { describe, expect, it } from "vitest";

import { projectReviewLifecycleForDisplay } from "@/lib/vocabulary/project-review-lifecycle-for-display";

describe("projectReviewLifecycleForDisplay (TB-2372)", () => {
  it("maps committed manifest status to Finalized", () => {
    const projection = projectReviewLifecycleForDisplay({ manifestStatus: "Committed" });

    expect(projection.manifestStatusLabel).toBe("Finalized");
    expect(projection.finalizeActionLabel).toBe("Finalize review");
    expect(projection.sealedArtifactLabel).toBe("Sealed review record");
  });

  it("passes through non-committed statuses", () => {
    expect(projectReviewLifecycleForDisplay({ manifestStatus: "Draft" }).manifestStatusLabel).toBe("Draft");
  });

  it("formats committed run counts without API verbs", () => {
    const projection = projectReviewLifecycleForDisplay({
      committedRunsInScope: 2,
      activeRunsInScope: 1,
    });

    expect(projection.committedRunsInScopeLabel).toBe("2 finalized · 1 active");
  });
});
