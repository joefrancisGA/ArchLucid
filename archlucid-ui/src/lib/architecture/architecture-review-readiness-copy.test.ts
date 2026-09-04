import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
  emptyArchitectureDraftStructuredBrief,
  listUnconfirmedStructuredBriefFieldLabels,
} from "@/lib/architecture/architecture-draft-structured-brief";
import { formatArchitectureReviewReadinessMessage } from "@/lib/architecture/architecture-review-readiness-copy";

describe("architecture-review-readiness-copy", () => {
  it("names quality attribute gaps with a numeric-target example", () => {
    expect(formatArchitectureReviewReadinessMessage(["quality-attributes"])).toMatch(
      /quality attribute/i,
    );
  });

  it("joins multiple blockers into one readiness sentence", () => {
    expect(formatArchitectureReviewReadinessMessage(["system-name", "quality-attributes"])).toMatch(
      /system name.*quality attribute/i,
    );
  });

  it("names structured-brief placeholder fields when brief state is provided (LI-01)", () => {
    const brief = {
      ...emptyArchitectureDraftStructuredBrief(),
      confirmedConstraints: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL],
      confirmedAssumptions: [ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL],
      qualityAttribute: ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
    };

    expect(listUnconfirmedStructuredBriefFieldLabels(brief)).toEqual([
      "Constraints",
      "Assumptions",
      "Quality attributes",
    ]);

    const message = formatArchitectureReviewReadinessMessage(["structured-brief-placeholders"], brief);

    expect(message).toContain("constraints");
    expect(message).toContain("assumptions");
    expect(message).toContain("quality attributes");
    expect(message).toContain("Unknown — confirm before review");
  });
});
