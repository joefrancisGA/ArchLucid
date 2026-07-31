import { describe, expect, it } from "vitest";

import {
  IMPACT_PREVIEW_PAGE_SUBTITLE,
  IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER,
  IMPACT_PREVIEW_PAGE_TITLE,
  IMPACT_PREVIEW_TRUST_NOTICE,
  impactPreviewPageSubtitle,
} from "@/lib/impact-preview-page-copy";

describe("impact-preview-page-copy", () => {
  it("uses product-safe impact preview page naming", () => {
    expect(IMPACT_PREVIEW_PAGE_TITLE).toBe("Impact preview");
    expect(IMPACT_PREVIEW_TRUST_NOTICE).not.toMatch(/GET \/|proxy override|read-only API/i);
  });

  it("uses a shorter buyer subtitle", () => {
    expect(impactPreviewPageSubtitle(true)).toBe(IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER);
    expect(impactPreviewPageSubtitle(false)).toBe(IMPACT_PREVIEW_PAGE_SUBTITLE);
    expect(IMPACT_PREVIEW_PAGE_SUBTITLE_BUYER.length).toBeLessThan(IMPACT_PREVIEW_PAGE_SUBTITLE.length);
  });
});
