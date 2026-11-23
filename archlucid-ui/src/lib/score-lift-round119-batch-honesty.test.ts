import { describe, expect, it } from "vitest";
import { RESOURCE_HUB_AUDIT_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-audit-partial-capture-not-load-failure-copy";
import { RESOURCE_HUB_TERRAFORM_NOT_MAPPED_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-terraform-not-mapped-partial-capture-not-load-failure-copy";
import { RESOURCE_EXPLORER_TYPE_PREFIX_AND_RESOURCE_GROUP_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-type-prefix-and-resource-group-filter-empty-not-load-failure-copy";
import { COMPARE_FINDING_LIFECYCLE_STATUS_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/compare/compare-finding-lifecycle-status-filter-empty-not-load-failure-copy";

describe("score-lift round119 batch honesty", () => {
  it("hub audit terraform, explorer triple, lifecycle status filter", () => {
    expect(RESOURCE_HUB_AUDIT_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_HUB_TERRAFORM_NOT_MAPPED_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_EXPLORER_TYPE_PREFIX_AND_RESOURCE_GROUP_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(COMPARE_FINDING_LIFECYCLE_STATUS_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
