import { describe, expect, it } from "vitest";

import {
  ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR_WITH_DRAFTS,
  architecturesNewPageSubtitle,
} from "@/lib/architectures-new-page-copy";

describe("architectures-new-page-copy", () => {
  it("uses buyer page subtitles only in polished shell", () => {
    expect(architecturesNewPageSubtitle(true, false)).toBe(ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER);
    expect(architecturesNewPageSubtitle(false, false)).toBe(ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR);
  });

  it("switches page subtitle when local drafts exist", () => {
    expect(architecturesNewPageSubtitle(true, true)).toBe(ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS);
    expect(architecturesNewPageSubtitle(false, true)).toBe(ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR_WITH_DRAFTS);
  });

  it("states drafting scope and draft-not-equal-review boundary once in each subtitle", () => {
    const scope = ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE.toLowerCase();

    expect(scope).toContain("drafting workspace");
    expect(scope).toContain("does not start a review");

    for (const subtitle of [
      ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER,
      ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS,
      ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR,
      ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR_WITH_DRAFTS,
    ]) {
      expect(subtitle.startsWith(ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE)).toBe(true);
    }
  });

  it("states account sync on create-path subtitles", () => {
    for (const subtitle of [
      ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER,
      ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER_WITH_DRAFTS,
      ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR,
      ARCHITECTURES_NEW_PAGE_SUBTITLE_OPERATOR_WITH_DRAFTS,
    ]) {
      expect(subtitle.toLowerCase()).toContain("sync");
      expect(subtitle).not.toContain("nothing syncs across browsers");
      expect(subtitle).not.toContain("on this device");
    }
  });
});
