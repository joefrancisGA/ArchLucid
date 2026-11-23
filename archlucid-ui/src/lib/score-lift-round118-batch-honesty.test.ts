import { describe, expect, it } from "vitest";
import { RESOURCE_HUB_REMEDIATION_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-remediation-partial-capture-not-load-failure-copy";
import { RESOURCE_EXPLORER_TYPE_AND_RESOURCE_GROUP_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-type-and-resource-group-combined-filter-empty-not-load-failure-copy";
import { RESOURCE_EXPLORER_NAME_PREFIX_AND_RESOURCE_GROUP_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-name-prefix-and-resource-group-combined-filter-empty-not-load-failure-copy";
import { RESOURCE_EXPLORER_WORK_QUEUE_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-work-queue-only-filter-empty-not-load-failure-copy";

describe("score-lift round118 batch honesty", () => {
  it("remediation partial and explorer combined or queue empties", () => {
    expect(RESOURCE_HUB_REMEDIATION_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_EXPLORER_TYPE_AND_RESOURCE_GROUP_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(RESOURCE_EXPLORER_NAME_PREFIX_AND_RESOURCE_GROUP_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(RESOURCE_EXPLORER_WORK_QUEUE_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
  });
});
