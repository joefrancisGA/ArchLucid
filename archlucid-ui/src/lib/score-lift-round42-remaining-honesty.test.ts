import { describe, expect, it } from "vitest";

import { ARCHITECTURE_COMPARE_SECOND_SEALED_REVIEW_LINE } from "@/lib/architecture/compare-second-sealed-review-honesty-copy";
import { REVIEW_SCORECARD_ROI_NON_SUMMING_NOTE } from "@/lib/review-scorecard-empty-state";
import { SECURENOW_PARTIAL_CAPTURE_RANKED_PATHS_LINE } from "@/lib/product-line/securenow-partial-capture-honesty-copy";
import { formatSecureNowCitationRejectionDetail } from "@/lib/product-line/securenow-citation-rejection-detail";
import {
  resolveSecureNowGovernanceFindingsEmptyStateCopy,
  SECURENOW_GOVERNANCE_FINDINGS_EVALUATED_EMPTY_TITLE,
} from "@/lib/product-line/securenow-governance-findings-copy";
import { secureNowDiagramPathFocusHiddenNodesLine } from "@/lib/product-line/securenow-diagram-path-focus-hidden-count-copy";
import { ARCH_REVIEW_EXPLANATION_CITATION_REJECTION_TAG } from "@/lib/reviews/review-explanation-citation-rejection-copy";

describe("score-lift round42 remaining honesty", () => {
  it("partial capture and diagram hidden-count copy", () => {
    expect(SECURENOW_PARTIAL_CAPTURE_RANKED_PATHS_LINE).toContain("Ranked paths may be incomplete");
    expect(secureNowDiagramPathFocusHiddenNodesLine(3)).toContain("3 subscription nodes hidden");
  });

  it("findings empty distinguishes collection from evaluated empty", () => {
    expect(resolveSecureNowGovernanceFindingsEmptyStateCopy({ captureEvaluatedEmpty: true }).title).toBe(
      SECURENOW_GOVERNANCE_FINDINGS_EVALUATED_EMPTY_TITLE,
    );
  });

  it("citation rejection detail names rejected ref", () => {
    expect(
      formatSecureNowCitationRejectionDetail("Model cited hop-99 which is not on this path.", ["evidence:hop-1"]),
    ).toContain("Rejected citation source");
  });

  it("scorecard and compare honesty lines", () => {
    expect(REVIEW_SCORECARD_ROI_NON_SUMMING_NOTE).toContain("do not sum");
    expect(ARCHITECTURE_COMPARE_SECOND_SEALED_REVIEW_LINE).toContain("second sealed review");
    expect(ARCH_REVIEW_EXPLANATION_CITATION_REJECTION_TAG).toContain("citation rejected");
  });
});