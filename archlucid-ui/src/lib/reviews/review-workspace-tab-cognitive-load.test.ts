import { describe, expect, it } from "vitest";

import { resolveReviewWorkspaceTabCognitivePrimaryAction } from "@/lib/reviews/review-workspace-tab-cognitive-load-copy";

describe("resolveReviewWorkspaceTabCognitivePrimaryAction", () => {
  it("sends finalized lifecycle users to sponsor packet from overview", () => {
    const action = resolveReviewWorkspaceTabCognitivePrimaryAction({
      lifecycle: "finalized",
      activeTab: "overview",
      runId: "run-1",
      evidenceReferenceCountNotStored: false,
    });

    expect(action?.label).toBe("Open sponsor packet");
    expect(action?.href).toContain("run-1");
  });
});
