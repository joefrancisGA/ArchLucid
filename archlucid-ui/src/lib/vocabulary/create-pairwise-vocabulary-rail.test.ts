import { describe, expect, it } from "vitest";

import {
  createPairwiseVocabularyRail,
  resolvePairwiseVocabularyPeerLink,
} from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

describe("createPairwiseVocabularyRail (TB-2365)", () => {
  it("builds reviewTab-only peer links", () => {
    const model = createPairwiseVocabularyRail({
      runId: "run-1",
      currentTab: "overview",
      currentTabId: "overview",
      peerTabId: "architecture",
      currentSurfaceId: "overview",
      peerSurfaceId: "diagram",
      copy: {
        heading: "Overview and Diagram serve different purposes",
        whyTwo: "Overview is the structured brief; Diagram is an illustrative sketch.",
        compactLine: "Overview is the structured brief; Diagram is an illustrative sketch.",
        currentLabel: "Overview",
        peerLabel: "Diagram",
        currentWhenToUse: "Read the structured brief summary.",
        peerWhenToUse: "View the illustrative architecture sketch.",
      },
    });

    expect(model.currentLink.href).toContain("reviewTab=overview");
    expect(model.peerLink.href).toContain("reviewTab=architecture");
    expect(resolvePairwiseVocabularyPeerLink("overview", model).id).toBe("diagram");
  });
});
