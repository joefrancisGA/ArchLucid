import { describe, expect, it } from "vitest";

import {
  DROPPED_CLARIFICATION_EXTRACT_READABILITY_REASON,
  formatDroppedClarificationExtractsSummary,
  listDroppedClarificationExtracts,
} from "@/lib/dropped-clarification-extracts";

describe("listDroppedClarificationExtracts (P-11)", () => {
  it("lists candidates rejected by the readability gate", () => {
    const dropped = listDroppedClarificationExtracts({
      "l0.pillar.security": "Readable PCI scope sentence.",
      "l0.pillar.cloud-target": "Truncated mid thought...",
    });

    expect(dropped).toEqual([
      {
        questionKey: "l0.pillar.cloud-target",
        reason: DROPPED_CLARIFICATION_EXTRACT_READABILITY_REASON,
      },
    ]);
  });

  it("formats a summary for the clarifications step", () => {
    expect(
      formatDroppedClarificationExtractsSummary([
        { questionKey: "l0.pillar.security", reason: DROPPED_CLARIFICATION_EXTRACT_READABILITY_REASON },
      ]),
    ).toContain("1 clarification extract was dropped");
  });
});
