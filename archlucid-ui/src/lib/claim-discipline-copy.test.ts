import { describe, expect, it } from "vitest";

import {
  NOT_SEALED_REVIEW_DILIGENCE_SOURCES_PACKAGE,
  buildSealedReviewDiligenceSourcesClaimDiscipline,
} from "@/lib/claim-discipline-copy";

describe("claim-discipline-copy", () => {
  it("builds canonical package negation sentences", () => {
    expect(
      buildSealedReviewDiligenceSourcesClaimDiscipline({
        surfaceDescription: "This guide explains personal preferences",
      }),
    ).toBe(
      `This guide explains personal preferences — it is ${NOT_SEALED_REVIEW_DILIGENCE_SOURCES_PACKAGE}.`,
    );
  });

  it("appends optional follow-up guidance", () => {
    expect(
      buildSealedReviewDiligenceSourcesClaimDiscipline({
        surfaceDescription: "Overview is a launcher",
        followUp: "Open Assurance status when you need trust cites.",
      }),
    ).toContain("Open Assurance status when you need trust cites.");
  });
});
