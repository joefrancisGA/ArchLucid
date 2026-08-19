import { describe, expect, it } from "vitest";

import {
  DIGESTS_BROWSE_PAGE_SUBTITLE,
  DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER,
  DIGESTS_PAGE_SUBTITLE,
  DIGESTS_PAGE_SUBTITLE_BUYER,
  DIGESTS_PAGE_TITLE,
  DIGESTS_PRIVACY_NOTE,
  digestsBrowsePageSubtitle,
  digestsSchedulePageSubtitle,
} from "@/lib/digests-browse-copy";

describe("digests-browse-copy", () => {
  it("uses product-safe digests page naming", () => {
    expect(DIGESTS_PAGE_TITLE).toBe("Architecture digests");
    expect(DIGESTS_PRIVACY_NOTE).not.toMatch(/GET \/|proxy override|read-only API/i);
  });

  it("uses shorter buyer subtitles for browse and schedule tabs", () => {
    expect(digestsBrowsePageSubtitle(true)).toBe(DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER);
    expect(digestsBrowsePageSubtitle(false)).toBe(DIGESTS_BROWSE_PAGE_SUBTITLE);
    expect(digestsSchedulePageSubtitle(true)).toBe(DIGESTS_PAGE_SUBTITLE_BUYER);
    expect(digestsSchedulePageSubtitle(false)).toBe(DIGESTS_PAGE_SUBTITLE);
    expect(DIGESTS_BROWSE_PAGE_SUBTITLE_BUYER.length).toBeLessThan(DIGESTS_BROWSE_PAGE_SUBTITLE.length);
    expect(DIGESTS_PAGE_SUBTITLE_BUYER.length).toBeLessThan(DIGESTS_PAGE_SUBTITLE.length);
  });
});
