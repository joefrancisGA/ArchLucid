import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE,
  ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER,
  ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR,
  ARCHITECTURE_DRAFT_REFINE_OPTIONAL_BEFORE_REVIEW_SENTENCE,
  ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_SENTENCE,
  architectureDraftDetailPageSubtitle,
  resolveArchitectureDraftDetailPageSubtitleBuyer,
  resolveArchitectureDraftRefineGuidanceSentence,
} from "@/lib/architecture/architecture-draft-detail-page-copy";

describe("architecture-draft-detail-page-copy", () => {
  it("uses buyer subtitle only in polished shell", () => {
    expect(architectureDraftDetailPageSubtitle(true, false)).toBe(
      resolveArchitectureDraftDetailPageSubtitleBuyer(false),
    );
    expect(architectureDraftDetailPageSubtitle(false)).toBe(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR);
  });

  it("states drafting scope and draft-not-equal-review boundary once in each subtitle", () => {
    const scope = ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE.toLowerCase();

    expect(scope).toContain("drafting workspace");
    expect(scope).toContain("does not start a review");

    expect(
      resolveArchitectureDraftDetailPageSubtitleBuyer(false).startsWith(
        ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE,
      ),
    ).toBe(true);
    expect(
      ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_OPERATOR.startsWith(ARCHITECTURE_DRAFT_DETAIL_DRAFTING_SCOPE_SENTENCE),
    ).toBe(true);
  });

  it("distinguishes required vs optional refine guidance", () => {
    expect(resolveArchitectureDraftRefineGuidanceSentence(false)).toBe(
      ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_SENTENCE,
    );
    expect(resolveArchitectureDraftRefineGuidanceSentence(true)).toBe(
      ARCHITECTURE_DRAFT_REFINE_OPTIONAL_BEFORE_REVIEW_SENTENCE,
    );
    expect(ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_SENTENCE).toContain("Required before review");
    expect(ARCHITECTURE_DRAFT_REFINE_OPTIONAL_BEFORE_REVIEW_SENTENCE).toContain("Refining is optional");
  });

  it("uses readiness-aware refine bridge on buyer subtitle", () => {
    expect(resolveArchitectureDraftDetailPageSubtitleBuyer(false)).toContain(
      ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_SENTENCE,
    );
    expect(resolveArchitectureDraftDetailPageSubtitleBuyer(true)).toContain(
      ARCHITECTURE_DRAFT_REFINE_OPTIONAL_BEFORE_REVIEW_SENTENCE,
    );
    expect(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER).toContain(
      ARCHITECTURE_DRAFT_REFINE_REQUIRED_BEFORE_REVIEW_SENTENCE,
    );
    expect(ARCHITECTURE_DRAFT_DETAIL_PAGE_SUBTITLE_BUYER).not.toContain("saved brief on this device");
  });
});
