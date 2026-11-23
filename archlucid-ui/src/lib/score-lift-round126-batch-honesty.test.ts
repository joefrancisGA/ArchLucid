import { describe, expect, it } from "vitest";
import { TERRAFORM_WORKBENCH_MAPPING_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/terraform-workbench-mapping-empty-not-load-failure-copy";
import { DIAGRAMS_EVIDENCE_FAMILY_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/diagrams-evidence-family-empty-not-load-failure-copy";

describe("score-lift round126 batch honesty", () => {
  it("terraform mapping empty and diagram family empty", () => {
    expect(TERRAFORM_WORKBENCH_MAPPING_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(DIAGRAMS_EVIDENCE_FAMILY_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
