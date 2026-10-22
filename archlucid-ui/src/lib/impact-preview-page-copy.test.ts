import { describe, expect, it } from "vitest";

import {
  IMPACT_PREVIEW_PAGE_SUBTITLE,
  IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER,
  IMPACT_PREVIEW_PAGE_TITLE,
  IMPACT_PREVIEW_SCOPE_WHAT_IT_IS,
  IMPACT_PREVIEW_SCOPE_WHAT_IT_IS_NOT,
  IMPACT_PREVIEW_TRUST_NOTICE,
  IMPACT_PREVIEW_HOW_IT_WORKS_SUMMARY,
  impactPreviewPageSubtitle,
} from "@/lib/impact-preview-page-copy";

describe("impact-preview-page-copy", () => {
  it("uses product-safe impact preview page naming", () => {
    expect(IMPACT_PREVIEW_PAGE_TITLE).toBe("Impact preview");
    expect(IMPACT_PREVIEW_TRUST_NOTICE).not.toMatch(/GET \/|proxy override|read-only API/i);
  });

  it("leads with what impact preview is, then the production disclaimer", () => {
    expect(IMPACT_PREVIEW_TRUST_NOTICE.startsWith(IMPACT_PREVIEW_SCOPE_WHAT_IT_IS)).toBe(true);
    expect(IMPACT_PREVIEW_TRUST_NOTICE).toContain(IMPACT_PREVIEW_SCOPE_WHAT_IT_IS_NOT);
    expect(IMPACT_PREVIEW_HOW_IT_WORKS_SUMMARY).toBe(IMPACT_PREVIEW_TRUST_NOTICE);
    expect(IMPACT_PREVIEW_SCOPE_WHAT_IT_IS_NOT).toMatch(/does not observe or test your production systems/i);
  });

  it("uses a shorter buyer subtitle", () => {
    expect(impactPreviewPageSubtitle(true)).toBe(IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER);
    expect(impactPreviewPageSubtitle(false)).toBe(IMPACT_PREVIEW_PAGE_SUBTITLE);
    expect(IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER.length).toBeLessThan(IMPACT_PREVIEW_PAGE_SUBTITLE.length);
  });
});
