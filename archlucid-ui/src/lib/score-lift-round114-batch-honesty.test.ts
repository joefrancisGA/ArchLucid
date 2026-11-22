import { describe, expect, it } from "vitest";
import { RESOURCE_HUB_OVERVIEW_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-hub-overview-partial-capture-not-load-failure-copy";
import { GOLDEN_MANIFEST_SERVER_MARKDOWN_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE } from "@/lib/exports/golden-manifest-server-markdown-export-finalize-not-load-failure-copy";
import { RESOURCE_EXPLORER_CATEGORY_AND_NAME_PREFIX_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/infra-evidence/resource-explorer-category-and-name-prefix-combined-filter-empty-not-load-failure-copy";
import { DIGESTS_BROWSE_SUBSCRIPTION_LIST_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/digests/digests-browse-subscription-list-only-empty-not-load-failure-copy";

describe("score-lift round114 batch honesty", () => {
  it("hub overview partial, golden server, explorer combined, digests subscription", () => {
    expect(RESOURCE_HUB_OVERVIEW_PARTIAL_CAPTURE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(GOLDEN_MANIFEST_SERVER_MARKDOWN_EXPORT_FINALIZE_NOT_LOAD_FAILURE_LINE).toContain("not a failed");
    expect(RESOURCE_EXPLORER_CATEGORY_AND_NAME_PREFIX_COMBINED_FILTER_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
    expect(DIGESTS_BROWSE_SUBSCRIPTION_LIST_ONLY_EMPTY_NOT_LOAD_FAILURE_LINE).toContain("not");
  });
});
