import { describe, expect, it } from "vitest";

import { REVIEW_DETAIL_HEADER_SECTION_SEARCH_EMPTY_NO_NAV_LINE } from "@/lib/reviews/review-detail-header-section-search-empty-copy";
import { REVIEW_WORKSPACE_PACKAGE_SEARCH_SCOPE_CHIP_HELPER } from "@/lib/reviews/review-workspace-package-search-scope-chip-copy";
import { REVIEW_WORKSPACE_UNIFIED_SEARCH_HELPER } from "@/lib/reviews/review-workspace-unified-search-honesty-copy";

describe("score lift round147 wave F honesty", () => {
  it("does not imply section jump works without on-page nav or that scope is decorative", () => {
    expect(REVIEW_DETAIL_HEADER_SECTION_SEARCH_EMPTY_NO_NAV_LINE).toContain("no on-page section list");
    expect(REVIEW_WORKSPACE_PACKAGE_SEARCH_SCOPE_CHIP_HELPER).toContain("top search bar");
    expect(REVIEW_WORKSPACE_UNIFIED_SEARCH_HELPER).toContain("does not replace findings search");
  });
});
