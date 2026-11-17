import { describe, expect, it } from "vitest";

import { ARCHITECTURE_COMPARE_SECOND_SEALED_REVIEW_LINE } from "@/lib/architecture/compare-second-sealed-review-honesty-copy";
import { REMEDIATION_WORKBENCH_EXECUTE_ADVISORY_HONESTY_LINE } from "@/lib/infra-evidence/remediation-workbench-execute-advisory-honesty-copy";
import { ITSM_OUTBOUND_CREATE_SUBMIT_DISCIPLINE_LINE } from "@/lib/itsm/itsm-outbound-create-submit-honesty-copy";
import { formatRemediationFactoryAttackPathOverflowLine } from "@/lib/remediation-factory/remediation-factory-attack-path-overflow-honesty-copy";

describe("score-lift round50 batch honesty", () => {
  it("remediation execute and compare second-seal discipline", () => {
    expect(REMEDIATION_WORKBENCH_EXECUTE_ADVISORY_HONESTY_LINE).toContain("advisory");
    expect(ARCHITECTURE_COMPARE_SECOND_SEALED_REVIEW_LINE).toContain("sealed");
  });

  it("attack path overflow and ITSM submit discipline", () => {
    expect(formatRemediationFactoryAttackPathOverflowLine(3)).toContain("3 more");
    expect(ITSM_OUTBOUND_CREATE_SUBMIT_DISCIPLINE_LINE).toContain("confirm");
  });
});