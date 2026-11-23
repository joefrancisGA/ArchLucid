import { describe, expect, it } from "vitest";
import { RESOURCE_EXPLORER_RESOURCE_GROUP_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-resource-group-only-filter-empty-not-load-failure-copy";
import { RESOURCE_HUB_FINDINGS_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-findings-partial-capture-not-load-failure-copy";
import { COMPARE_INSUFFICIENT_FINALIZED_ONE_FINALIZED_SECOND_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/architecture/compare-insufficient-finalized-one-finalized-second-empty-not-load-failure-copy";
import { RESOURCE_EXPLORER_CATEGORY_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-category-only-filter-empty-not-load-failure-copy";

describe("score-lift round116 batch honesty", () => {
  it("explorer single filters, compare one finalized, hub findings partial", () => {
    expect(RESOURCE_EXPLORER_CATEGORY_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(RESOURCE_EXPLORER_RESOURCE_GROUP_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(COMPARE_INSUFFICIENT_FINALIZED_ONE_FINALIZED_SECOND_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_HUB_FINDINGS_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not");
  });
});
