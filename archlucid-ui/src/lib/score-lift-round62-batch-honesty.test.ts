import { describe, expect, it } from "vitest";

import { FIRST_REVIEW_PARTIAL_CAPTURE_BEFORE_START_LINE } from "@/lib/architecture/first-review-partial-capture-copy";
import { DECISION_REGISTER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/governance/decision-register-empty-partial-capture-copy";
import {
  DIAGRAM_RECONCILE_PARTIAL_CAPTURE_LINE,
  DRIFT_WORKBENCH_PARTIAL_CAPTURE_LINE,
} from "@/lib/infra-evidence/infra-evidence-workbench-partial-capture-copy";
import { TERRAFORM_ADVISORY_PLAN_OUTPUT_NOT_APPLY_LINE } from "@/lib/infra-evidence/terraform-advisory-plan-output-not-apply-copy";
import { PATH_INSPECT_PARTIAL_CAPTURE_LINE } from "@/lib/product-line/path-inspect-partial-capture-honesty-copy";
import { PILOT_SCORECARD_ANNUAL_WITHOUT_QUARTERLY_NON_SUMMING_LINE } from "@/lib/scorecard/pilot-scorecard-headline-band-roi-non-summing-copy";

describe("score-lift round62 batch honesty", () => {
  it("infra, register, scorecard, and first-review copy", () => {
    expect(DRIFT_WORKBENCH_PARTIAL_CAPTURE_LINE).toContain("snapshot");
    expect(DIAGRAM_RECONCILE_PARTIAL_CAPTURE_LINE).toContain("inventory");
    expect(TERRAFORM_ADVISORY_PLAN_OUTPUT_NOT_APPLY_LINE).toContain("terraform apply");
    expect(DECISION_REGISTER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("failed to load");
    expect(PATH_INSPECT_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(PILOT_SCORECARD_ANNUAL_WITHOUT_QUARTERLY_NON_SUMMING_LINE).toContain("quarters");
    expect(FIRST_REVIEW_PARTIAL_CAPTURE_BEFORE_START_LINE).toContain("Prerequisites");
  });
});