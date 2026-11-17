import { describe, expect, it } from "vitest";

import { INFRASTRUCTURE_ASK_INSUFFICIENT_EVIDENCE_HONESTY_LINE } from "@/lib/infra-evidence/infrastructure-ask-insufficient-evidence-honesty-copy";
import { REMEDIATION_WORKBENCH_WORKFLOW_HONESTY_LINE } from "@/lib/infra-evidence/remediation-workbench-workflow-honesty-copy";
import { SECURENOW_INVESTIGATION_EFFORT_OPERATOR_ROI_DISCIPLINE_LINE } from "@/lib/product-line/securenow-investigation-effort-operator-roi-discipline-copy";
import { SECURENOW_SELF_SERVICE_RANK_STORED_PATH_LINE } from "@/lib/product-line/securenow-self-service-rank-stored-path-copy";

describe("score-lift round49 batch honesty", () => {
  it("remediation and Ask discipline", () => {
    expect(REMEDIATION_WORKBENCH_WORKFLOW_HONESTY_LINE).toContain("Azure");
    expect(INFRASTRUCTURE_ASK_INSUFFICIENT_EVIDENCE_HONESTY_LINE).toContain("insufficient");
  });

  it("SecureNow effort ROI and self-service path rank", () => {
    expect(SECURENOW_INVESTIGATION_EFFORT_OPERATOR_ROI_DISCIPLINE_LINE).toContain("customer");
    expect(SECURENOW_SELF_SERVICE_RANK_STORED_PATH_LINE).toContain("stored");
  });
});