import { describe, expect, it } from "vitest";

import {
  ARCHITECTURES_NEW_CLAIM_HEADING,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS,
  architecturesNewPageSubtitle,
} from "@/lib/architectures-new-page-copy";
import {
  ARCHITECTURE_CREATION_PAGE_SUBTITLE,
  ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS,
} from "@/lib/create-vs-review-intake-copy";

describe("architectures-new-page-copy", () => {
  it("uses buyer page subtitles only in polished shell", () => {
    expect(architecturesNewPageSubtitle(true, false)).toBe(ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER);
    expect(architecturesNewPageSubtitle(false, false)).toBe(ARCHITECTURE_CREATION_PAGE_SUBTITLE);
  });

  it("switches page subtitle when local drafts exist", () => {
    expect(architecturesNewPageSubtitle(true, true)).toBe(ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS);
    expect(architecturesNewPageSubtitle(false, true)).toBe(ARCHITECTURE_CREATION_PAGE_SUBTITLE_WITH_DRAFTS);
  });

  it("keeps claim heading drafting-first", () => {
    expect(ARCHITECTURES_NEW_CLAIM_HEADING.toLowerCase()).toContain("draft");
  });
});
