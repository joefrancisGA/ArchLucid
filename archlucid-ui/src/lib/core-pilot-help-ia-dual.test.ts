import { describe, expect, it } from "vitest";

import {
  CORE_PILOT_HELP_FULL_REVIEW_PATH_HREF,
  CORE_PILOT_HELP_IA_DUAL_INBOUND_LABEL,
  CORE_PILOT_HELP_JOB_MATRIX,
  EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_HREF,
  EVIDENCE_ONLY_REVIEW_HELP_IA_DUAL_INBOUND_LABEL,
} from "@/lib/core-pilot-help-ia-dual";

describe("core-pilot help IA dual (TB-1683)", () => {
  it("declares distinct mutual cross-link labels for full review vs evidence-only fast path", () => {
    const currentRow = CORE_PILOT_HELP_JOB_MATRIX.find((row) => row.isCurrent === true);
    const evidenceOnlyRow = CORE_PILOT_HELP_JOB_MATRIX.find((row) => row.isCurrent !== true);

    expect(currentRow?.label).toContain("first architecture review");
    expect(evidenceOnlyRow?.label).toBe(EVIDENCE_ONLY_REVIEW_HELP_IA_DUAL_INBOUND_LABEL);
    expect(evidenceOnlyRow?.href).toBe(EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_HREF);
    expect(evidenceOnlyRow?.label).not.toBe(currentRow?.label);
    expect(CORE_PILOT_HELP_IA_DUAL_INBOUND_LABEL).not.toBe(EVIDENCE_ONLY_REVIEW_HELP_IA_DUAL_INBOUND_LABEL);
  });

  it("anchors full-review and evidence-only paths on the canonical COR help route", () => {
    expect(CORE_PILOT_HELP_FULL_REVIEW_PATH_HREF).toBe("/help/first-architecture-review#first-review-path");
    expect(EVIDENCE_ONLY_REVIEW_HELP_FAST_PATH_HREF).toBe(
      "/help/first-architecture-review#fast-path-evidence-only-review",
    );
  });
});
