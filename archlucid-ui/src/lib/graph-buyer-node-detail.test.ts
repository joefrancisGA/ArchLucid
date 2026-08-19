import { describe, expect, it } from "vitest";

import {
  graphBuyerTrailMetadataLines,
  graphBuyerTrailRecordTypeLine,
  visibleBuyerTrailTechnicalAppendixLines,
} from "./graph-buyer-node-detail";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "./showcase-static-demo";
import type { GraphNodeVm } from "@/types/graph";

describe("graphBuyerTrailRecordTypeLine", () => {
  it("labels active sample hero finding with scenario-specific risk framing", () => {
    const node: GraphNodeVm = {
      id: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
      type: "Finding",
      label: "Sensitive data minimization risk",
      metadata: { referenced: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID },
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding: Sensitive data minimization",
      secondary: { label: "Risk area", value: "Privacy and data handling" },
    });
  });

  it("labels generic finding nodes as Finding", () => {
    const node: GraphNodeVm = {
      id: "finding-other",
      type: "Finding",
      label: "Other finding",
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding",
      secondary: null,
    });
  });
});

describe("graphBuyerTrailMetadataLines", () => {
  it("hides technical appendix for showcase finding linkage ids already summarized above", () => {
    const { summaryLines, technicalLines } = graphBuyerTrailMetadataLines({
      referenceId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    });

    expect(summaryLines.length).toBeGreaterThan(0);
    expect(technicalLines).toEqual([
      { label: "Reference ID", value: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID },
    ]);
    expect(visibleBuyerTrailTechnicalAppendixLines(technicalLines)).toEqual([]);
  });

  it("keeps technical appendix when extra metadata fields exist", () => {
    const technicalLines = [
      { label: "Reference ID", value: "finding-123" },
      { label: "sourceSystem", value: "ServiceNow" },
    ];

    expect(visibleBuyerTrailTechnicalAppendixLines(technicalLines)).toEqual([
      { label: "sourceSystem", value: "ServiceNow" },
    ]);
  });
});
