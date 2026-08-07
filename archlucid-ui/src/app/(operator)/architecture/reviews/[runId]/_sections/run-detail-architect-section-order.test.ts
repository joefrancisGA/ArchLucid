import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER,
} from "./run-detail-architect-section-order";

const pageViewSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPageView.tsx"),
  "utf8",
);

const belowFoldSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailBelowFoldSections.tsx"),
  "utf8",
);

describe("run-detail-architect-section-order (TB-620)", () => {
  it("documents finalized architect section order", () => {
    expect(RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("findings")).toBeLessThan(
      RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("decision-delta"),
    );
    expect(RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("findings")).toBeLessThan(
      RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("below-fold"),
    );
    expect(RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("evidence-trust")).toBeLessThan(
      RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER.indexOf("below-fold"),
    );
  });

  it("places buyer findings before decision delta and below-fold pipeline sections", () => {
    const findingsIndex = pageViewSource.indexOf("<RunDetailExplanationDeferred");
    const decisionDeltaIndex = pageViewSource.indexOf("<RunDetailDecisionDeltaDeferred");
    const trustEvidenceIndex = pageViewSource.indexOf("<RunDetailTrustEvidenceCardSectionDeferred");
    const belowFoldIndex = pageViewSource.indexOf("<RunDetailBelowFoldSections");

    expect(findingsIndex).toBeGreaterThan(-1);
    expect(decisionDeltaIndex).toBeGreaterThan(findingsIndex);
    expect(trustEvidenceIndex).toBeGreaterThan(findingsIndex);
    expect(belowFoldIndex).toBeGreaterThan(findingsIndex);
    expect(belowFoldIndex).toBeGreaterThan(trustEvidenceIndex);
  });

  it("places operator findings before pipeline timeline in below-fold", () => {
    const findingsIndex = belowFoldSource.indexOf("<RunDetailExplanationDeferred");
    const pipelineIndex = belowFoldSource.indexOf("<RunDetailPipelineTimelineSection");

    expect(findingsIndex).toBeGreaterThan(-1);
    expect(pipelineIndex).toBeGreaterThan(-1);
    expect(findingsIndex).toBeLessThan(pipelineIndex);
  });
});
