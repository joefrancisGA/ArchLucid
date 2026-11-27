import { describe, expect, it } from "vitest";

import { resolveReviewWorkspaceTabCognitivePrimaryAction } from "@/lib/reviews/review-workspace-tab-cognitive-load-copy";
import {
  REVIEW_COGNITIVE_LOAD_NEXT_ACTION_EVIDENCE,
  resolveReviewCognitiveLoadNextAction,
} from "@/lib/reviews/review-cognitive-load-copy";

describe("resolveReviewWorkspaceTabCognitivePrimaryAction", () => {
  it("steers next-action copy when evidence reference counts were not stored", () => {
    expect(
      resolveReviewCognitiveLoadNextAction({
        openGateReviewTab: "findings",
        openGateLabel: "Findings",
        evidenceReferenceCountNotStored: true,
      }),
    ).toBe(REVIEW_COGNITIVE_LOAD_NEXT_ACTION_EVIDENCE);
  });

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
