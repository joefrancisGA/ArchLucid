import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  EVIDENCE_TRAIL_SEARCH,
  GLOBAL_FIND_PAGE_SEARCH,
} from "@/lib/search-surface-disambiguation";
import {
  GLOBAL_SEARCH_ARIA_LABEL,
  GLOBAL_SEARCH_PLACEHOLDER,
} from "@/lib/keyboard-shortcut-display";
import {
  SEARCH_PAGE_SUBTITLE,
  SEARCH_PAGE_TITLE,
  SEARCH_QUERY_FIELD_LABEL,
  SEARCH_QUERY_PLACEHOLDER,
} from "@/app/(operator)/insights/search-review-evidence/_sections/search-page-copy";

describe("search-surface-disambiguation (TB-2196)", () => {
  it("keeps global find-a-page copy distinct from evidence-trail search", () => {
    expect(GLOBAL_FIND_PAGE_SEARCH.placeholder).toBe(
      "Find pages, architectures, and reviews…",
    );
    expect(GLOBAL_FIND_PAGE_SEARCH.ariaLabel).toBe(
      "Find pages, architectures, and reviews",
    );
    expect(GLOBAL_FIND_PAGE_SEARCH.helper.toLowerCase()).toContain("evidence trail");
    expect(GLOBAL_FIND_PAGE_SEARCH.helper.toLowerCase()).toContain("ctrl+k");
    expect(GLOBAL_FIND_PAGE_SEARCH.helper.toLowerCase()).toContain("architecture");
    expect(GLOBAL_FIND_PAGE_SEARCH.ariaLabel.toLowerCase()).not.toContain("evidence");
    expect(GLOBAL_FIND_PAGE_SEARCH.placeholder.toLowerCase()).not.toBe("search archlucid");

    expect(EVIDENCE_TRAIL_SEARCH.title).toBe("Search review evidence");
    expect(EVIDENCE_TRAIL_SEARCH.shortNavLabel).toBe("Search evidence");
    expect(EVIDENCE_TRAIL_SEARCH.pageSubtitle.toLowerCase()).toContain("evidence trail");
    expect(EVIDENCE_TRAIL_SEARCH.queryPlaceholder.toLowerCase()).toContain("evidence trail");

    expect(GLOBAL_FIND_PAGE_SEARCH.placeholder).not.toBe(EVIDENCE_TRAIL_SEARCH.queryPlaceholder);
    expect(GLOBAL_FIND_PAGE_SEARCH.ariaLabel).not.toBe(EVIDENCE_TRAIL_SEARCH.title);
    expect(GLOBAL_FIND_PAGE_SEARCH.helper).not.toBe(EVIDENCE_TRAIL_SEARCH.pageSubtitle);
  });

  it("stays aligned with keyboard-shortcut-display and search-page-copy consumers", () => {
    expect(GLOBAL_SEARCH_ARIA_LABEL).toBe(GLOBAL_FIND_PAGE_SEARCH.ariaLabel);
    expect(GLOBAL_SEARCH_PLACEHOLDER).toBe(GLOBAL_FIND_PAGE_SEARCH.placeholder);
    expect(SEARCH_PAGE_TITLE).toBe(EVIDENCE_TRAIL_SEARCH.title);
    expect(SEARCH_PAGE_SUBTITLE).toBe(EVIDENCE_TRAIL_SEARCH.pageSubtitle);
    expect(SEARCH_QUERY_PLACEHOLDER).toBe(EVIDENCE_TRAIL_SEARCH.queryPlaceholder);
    expect(SEARCH_QUERY_FIELD_LABEL).toBe(EVIDENCE_TRAIL_SEARCH.queryFieldLabel);
  });

  it("keeps nav label parity with OPERATOR_NAV_LINK_LABELS.searchEvidence", () => {
    expect(OPERATOR_NAV_LINK_LABELS.searchEvidence).toBe(EVIDENCE_TRAIL_SEARCH.title);
  });
});