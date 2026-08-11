import { describe, expect, it } from "vitest";

import {
  CROSS_REVIEW_FINDING_CORRELATION_LABEL,
  FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_LINES,
  ITSM_TICKET_LINKAGE_DUPLICATE_BLOCKED,
  ITSM_TICKET_LINKAGE_LABEL,
  ROI_PORTFOLIO_FINDING_DEDUP_LABEL,
} from "@/lib/vocabulary/finding-correlation-vocabulary";

describe("finding-correlation-vocabulary", () => {
  it("defines three distinct correlation senses", () => {
    const labels = FINDING_CORRELATION_VOCABULARY_DISAMBIGUATION_LINES.map((line) => line.label);

    expect(labels).toEqual([
      CROSS_REVIEW_FINDING_CORRELATION_LABEL,
      ITSM_TICKET_LINKAGE_LABEL,
      ROI_PORTFOLIO_FINDING_DEDUP_LABEL,
    ]);
    expect(new Set(labels).size).toBe(3);
  });

  it("uses ITSM ticket linkage wording for duplicate-create guard", () => {
    expect(ITSM_TICKET_LINKAGE_DUPLICATE_BLOCKED).toContain("ITSM ticket linkage");
    expect(ITSM_TICKET_LINKAGE_DUPLICATE_BLOCKED).not.toMatch(/\bcorrelation already exists\b/i);
  });
});
