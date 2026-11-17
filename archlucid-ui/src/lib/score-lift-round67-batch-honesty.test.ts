import { describe, expect, it } from "vitest";

import { REVIEWS_HUB_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/architecture/reviews-hub-empty-partial-capture-copy";
import { GOVERNANCE_APPROVAL_LINEAGE_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-approval-lineage-empty-partial-capture-copy";
import { AUDIT_EVIDENCE_CONTROL_LINEAGE_PARTIAL_CAPTURE_LINE } from "@/lib/governance/audit-evidence-control-lineage-partial-capture-copy";
import { GOVERNANCE_FINDINGS_RESULTS_PARTIAL_CAPTURE_LINE } from "@/lib/governance/governance-findings-results-partial-capture-copy";
import { SEARCH_REVIEW_EVIDENCE_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/insights/search-review-evidence-empty-partial-capture-copy";
import {
  RESOURCE_HUB_DRIFT_TAB_PARTIAL_CAPTURE_LINE,
  RESOURCE_HUB_REMEDIATION_TAB_PARTIAL_CAPTURE_LINE,
} from "@/lib/infra-evidence/resource-hub-tab-partial-capture-copy";
import { IMPACT_PREVIEW_PARTIAL_CAPTURE_NO_BASELINE_LINE } from "@/lib/impact-preview-partial-capture-no-baseline-copy";
import { REVIEW_SCORECARD_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/scorecard/review-scorecard-empty-partial-capture-copy";

describe("score-lift round67 batch honesty", () => {
  it("hub drift and remediation, search, reviews, findings, lineage, impact, scorecard", () => {
    expect(RESOURCE_HUB_DRIFT_TAB_PARTIAL_CAPTURE_LINE).toContain("Partial");
    expect(RESOURCE_HUB_REMEDIATION_TAB_PARTIAL_CAPTURE_LINE).toContain("Partial");
    expect(SEARCH_REVIEW_EVIDENCE_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(REVIEWS_HUB_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(GOVERNANCE_FINDINGS_RESULTS_PARTIAL_CAPTURE_LINE).toContain("Partial");
    expect(GOVERNANCE_APPROVAL_LINEAGE_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(AUDIT_EVIDENCE_CONTROL_LINEAGE_PARTIAL_CAPTURE_LINE).toContain("Partial");
    expect(IMPACT_PREVIEW_PARTIAL_CAPTURE_NO_BASELINE_LINE).toContain("gaps");
    expect(REVIEW_SCORECARD_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
  });
});