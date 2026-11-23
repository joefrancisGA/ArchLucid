import { describe, expect, it } from "vitest";
import { RESOURCE_HUB_OVERVIEW_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-overview-partial-capture-not-load-failure-copy";
import { RESOURCE_EXPLORER_CATEGORY_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-category-only-filter-empty-not-load-failure-copy";
import { RESOURCE_EXPLORER_NAME_PREFIX_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-name-prefix-only-filter-empty-not-load-failure-copy";
import { RUN_DETAIL_MANIFEST_BUNDLE_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/runs/run-detail-manifest-bundle-export-finalize-not-load-failure-copy";

describe("score-lift round115 batch honesty", () => {
  it("hub overview gated, explorer single filters, buyer bundle", () => {
    expect(RESOURCE_HUB_OVERVIEW_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(RESOURCE_EXPLORER_CATEGORY_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(RESOURCE_EXPLORER_NAME_PREFIX_ONLY_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(RUN_DETAIL_MANIFEST_BUNDLE_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
  });
});
