import { describe, expect, it } from "vitest";
import { RESOURCE_EXPLORER_WORK_QUEUE_TYPE_AND_NAME_PREFIX_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-work-queue-type-and-name-prefix-filter-empty-not-load-failure-copy";
import { RESOURCE_EXPLORER_WORK_QUEUE_TYPE_AND_RESOURCE_GROUP_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-work-queue-type-and-resource-group-filter-empty-not-load-failure-copy";
import { RESOURCE_EXPLORER_WORK_QUEUE_NAME_PREFIX_AND_RESOURCE_GROUP_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-work-queue-name-prefix-and-resource-group-filter-empty-not-load-failure-copy";
import { ATTACK_PATH_REPORT_DIAGRAM_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/remediation-factory/attack-path-report-diagram-filter-empty-not-load-failure-copy";

describe("score-lift round121 batch honesty", () => {
  it("explorer work-queue triples and attack-path diagram filter", () => {
    expect(RESOURCE_EXPLORER_WORK_QUEUE_TYPE_AND_NAME_PREFIX_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_EXPLORER_WORK_QUEUE_TYPE_AND_RESOURCE_GROUP_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_EXPLORER_WORK_QUEUE_NAME_PREFIX_AND_RESOURCE_GROUP_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(ATTACK_PATH_REPORT_DIAGRAM_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
