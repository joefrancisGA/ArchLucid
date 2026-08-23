import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE,
  ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER,
  ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR,
  ARCHITECTURE_DRAFT_REFINE_BEFORE_REVIEW_SENTENCE,
  architectureDraftDetailPageSubtitle,
} from "@/lib/architecture/architecture-draft-detail-page-copy";

describe("architecture-draft-detail-page-copy", () => {
  it("uses buyer subtitle only in polished shell", () => {
    expect(architectureDraftDetailPageSubtitle(true)).toBe(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER);
    expect(architectureDraftDetailPageSubtitle(false)).toBe(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR);
  });

  it("states drafting scope and draft-not-equal-review boundary once in each subtitle", () => {
    const scope = ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE.toLowerCase();

    expect(scope).toContain("drafting workspace");
    expect(scope).toContain("does not start a review");

    expect(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER.startsWith(ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE)).toBe(
      true,
    );
    expect(
      ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR.startsWith(ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE),
    ).toBe(true);
  });

  it("uses architecture-draft refine bridge on buyer subtitle", () => {
    expect(ARCHITECTURE_DRAFT_REFINE_BEFORE_REVIEW_SENTENCE).toBe(
      "Refine this architecture draft before starting a review.",
    );
    expect(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER).toContain(
      ARCHITECTURE_DRAFT_REFINE_BEFORE_REVIEW_SENTENCE,
    );
    expect(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER).not.toContain("saved brief on this device");
  });
});
