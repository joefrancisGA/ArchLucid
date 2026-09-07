import { describe, expect, it } from "vitest";

import {
  ARCHITECTURES_LIST_PATH,
  REVIEWS_LIST_PATH,
} from "@/lib/architecture/architecture-routes";
import {
  buildAskReviewQuestionsSources,
} from "@/lib/ask-review-questions-evidence-copy";
import { buildEvidenceGraphSources } from "@/lib/evidence-graph-evidence-copy";
import { buildGovernanceFindingsSources } from "@/lib/governance/governance-findings-evidence-copy";

describe("ask-review-questions-evidence-copy (SY-31)", () => {
  it("Working Ask related-links do not use the reviews hub as the parent object", () => {
    const sources = buildAskReviewQuestionsSources(true);
    const parent = sources[0];

    expect(parent?.href).toBe(ARCHITECTURES_LIST_PATH);
    expect(parent?.href).not.toBe(REVIEWS_LIST_PATH);
  });

  it("Guided Ask keeps architecture reviews parent on the hub", () => {
    const sources = buildAskReviewQuestionsSources(false);
    const parent = sources[0];

    expect(parent?.href).toBe(REVIEWS_LIST_PATH);
  });
});

describe("evidence-graph-evidence-copy (SY-31)", () => {
  it("Working graph related-links climb to the architecture portfolio", () => {
    const sources = buildEvidenceGraphSources(true);
    const parent = sources[0];

    expect(parent?.href).toBe(ARCHITECTURES_LIST_PATH);
    expect(parent?.href).not.toBe(REVIEWS_LIST_PATH);
  });
});

describe("governance-findings-evidence-copy (SY-31)", () => {
  it("Working findings related-links climb to the architecture portfolio", () => {
    const sources = buildGovernanceFindingsSources(true);
    const parent = sources[0];

    expect(parent?.href).toBe(ARCHITECTURES_LIST_PATH);
    expect(parent?.href).not.toBe(REVIEWS_LIST_PATH);
  });
});
