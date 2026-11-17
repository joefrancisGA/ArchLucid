import { describe, expect, it } from "vitest";

import { DIAGRAMS_WORKBENCH_PARTIAL_CAPTURE_LINE, TERRAFORM_WORKBENCH_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/infra-evidence-workbench-partial-capture-copy";
import { RESOURCE_EXPLORER_EMPTY_PARTIAL_CAPTURE_LINE } from "@/lib/infra-evidence/resource-explorer-empty-partial-capture-copy";
import { POLICY_PACK_DETAIL_PARTIAL_ASSIGNMENT_LINE } from "@/lib/policy/policy-pack-detail-partial-assignment-copy";
import { REMEDIATION_FACTORY_ATTACK_PATH_UNEVALUATED_ONLY_PARTIAL_LINE } from "@/lib/remediation-factory/remediation-factory-attack-path-unevaluated-only-partial-copy";
import { SPONSOR_COMPLIANCE_DRIFT_PARTIAL_WINDOW_LINE } from "@/lib/sponsor/sponsor-compliance-drift-partial-window-copy";
import { INFRASTRUCTURE_ASK_PARTIAL_CAPTURE_HONESTY_LINE } from "@/lib/infra-evidence/infrastructure-ask-partial-capture-honesty-copy";

describe("score-lift round65 batch honesty", () => {
  it("drawer, explorer, policy, attack path, sponsor drift, diagrams, and terraform copy", () => {
    expect(INFRASTRUCTURE_ASK_PARTIAL_CAPTURE_HONESTY_LINE).toContain("gaps");
    expect(RESOURCE_EXPLORER_EMPTY_PARTIAL_CAPTURE_LINE).toContain("gaps");
    expect(POLICY_PACK_DETAIL_PARTIAL_ASSIGNMENT_LINE).toContain("Partial");
    expect(REMEDIATION_FACTORY_ATTACK_PATH_UNEVALUATED_ONLY_PARTIAL_LINE).toContain("unevaluated");
    expect(SPONSOR_COMPLIANCE_DRIFT_PARTIAL_WINDOW_LINE).toContain("Partial");
    expect(DIAGRAMS_WORKBENCH_PARTIAL_CAPTURE_LINE).toContain("snapshot");
    expect(TERRAFORM_WORKBENCH_PARTIAL_CAPTURE_LINE).toContain("snapshot");
  });
});