import { describe, expect, it } from "vitest";

import { fixtureOperatorDemoReviewRunDetail } from "./operator-demo-review-run";

import { toMockBuyerRunDetailSummary } from "./buyer-run-detail-summary";

describe("toMockBuyerRunDetailSummary", () => {
  it("strips agent results and snapshot subgraphs like RunDetailBuyerMapper", () => {
    const full = fixtureOperatorDemoReviewRunDetail();
    const buyer = toMockBuyerRunDetailSummary(full);

    expect(buyer.run.runId).toBe(full.run.runId);
    expect(buyer.run.goldenManifestId).toBe(full.run.goldenManifestId);
    expect(buyer.run.hasGoldenManifest).toBe(true);
    expect(buyer.executionFlavorBuyerSummary).toBe(full.executionFlavorBuyerSummary);
    expect(buyer.results).toBeUndefined();
    expect(buyer.contextSnapshot).toBeUndefined();
    expect(buyer.graphSnapshot).toBeUndefined();
    expect(buyer.findingsSnapshot).toBeUndefined();
    expect(buyer.goldenManifest).toBeUndefined();
    expect(buyer.artifactBundle).toBeUndefined();
    expect(buyer.decisionTrace).toBeUndefined();
  });
});
