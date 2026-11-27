import { describe, expect, it } from "vitest";

import {
  resolveReviewCognitiveLoadPrimaryAction,
  REVIEW_COGNITIVE_LOAD_SPONSOR_PRIMARY_LABEL,
} from "@/lib/reviews/review-cognitive-load-copy";

describe("resolveReviewCognitiveLoadPrimaryAction", () => {
  it("opens the sponsor packet when the gate is clear", () => {
    const action = resolveReviewCognitiveLoadPrimaryAction({
      openGateReviewTab: null,
      openGateLabel: null,
      evidenceReferenceCountNotStored: false,
      openGateHref: null,
      sponsorPacketHref: "/architecture/reviews/run-1?tab=review-package",
    });

    expect(action).toEqual({
      label: REVIEW_COGNITIVE_LOAD_SPONSOR_PRIMARY_LABEL,
      href: "/architecture/reviews/run-1?tab=review-package",
    });
  });

  it("names the open gate when navigation is available", () => {
    const action = resolveReviewCognitiveLoadPrimaryAction({
      openGateReviewTab: "findings",
      openGateLabel: "Evidence gap",
      evidenceReferenceCountNotStored: false,
      openGateHref: "/architecture/reviews/run-2?tab=findings",
      sponsorPacketHref: null,
    });

    expect(action).toEqual({
      label: "Open gate: Evidence gap",
      href: "/architecture/reviews/run-2?tab=findings",
    });
  });
});
