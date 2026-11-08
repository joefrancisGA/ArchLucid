import { describe, expect, it } from "vitest";

import {
  formatInfraEvidenceDiagramMetricsAnnouncement,
  isInfraEvidenceDiagramEdgeCountStored,
} from "./format-infra-evidence-diagram-metrics-announcement";

describe("formatInfraEvidenceDiagramMetricsAnnouncement", () => {
  it("announces omitted edge count without undefined", () => {
    const line = formatInfraEvidenceDiagramMetricsAnnouncement({
      nodeCount: 2,
      edgeCount: null,
      subgraphCount: 1,
    });

    expect(line).toContain("Edge count was not stored.");
    expect(line).not.toContain("undefined");
  });

  it("formats complete metrics", () => {
    expect(
      formatInfraEvidenceDiagramMetricsAnnouncement({ nodeCount: 1, edgeCount: 2, subgraphCount: 3 }),
    ).toBe("1 nodes and 2 edges across 3 subgraphs.");
  });
});

describe("isInfraEvidenceDiagramEdgeCountStored", () => {
  it("is false when metrics or edge count are omitted", () => {
    expect(isInfraEvidenceDiagramEdgeCountStored(null)).toBe(false);
    expect(isInfraEvidenceDiagramEdgeCountStored({ edgeCount: undefined })).toBe(false);
    expect(isInfraEvidenceDiagramEdgeCountStored({ edgeCount: 0 })).toBe(true);
  });
});
