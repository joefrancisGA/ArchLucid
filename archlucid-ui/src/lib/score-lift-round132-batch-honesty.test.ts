import { describe, expect, it } from "vitest";
import { TERRAFORM_WORKBENCH_MAPPING_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/terraform-workbench-mapping-empty-not-load-failure-copy";
import { DIAGRAMS_EVIDENCE_FAMILY_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/diagrams-evidence-family-empty-not-load-failure-copy";
import { RESOURCE_EXPLORER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-empty-not-failure-copy";

describe("score-lift round132 batch honesty", () => {
  it("terraform, diagrams family, resource explorer empty copy", () => {
    expect(TERRAFORM_WORKBENCH_MAPPING_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(DIAGRAMS_EVIDENCE_FAMILY_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_EXPLORER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("no load error");
  });
});
