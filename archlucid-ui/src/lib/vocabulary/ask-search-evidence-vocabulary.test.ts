import { describe, expect, it } from "vitest";

import {
  ASK_SEARCH_EVIDENCE_ASK_LINK,
  ASK_SEARCH_EVIDENCE_COMPACT_LINE,
  ASK_SEARCH_EVIDENCE_HEADING,
  ASK_SEARCH_EVIDENCE_SEARCH_LINK,
  ASK_SEARCH_EVIDENCE_WHY_TWO,
  buildAskSearchEvidenceVocabulary,
  resolveAskSearchEvidencePeerLink,
} from "@/lib/vocabulary/ask-search-evidence-vocabulary";
import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

describe("ask-search-evidence-vocabulary (TB-2231)", () => {
  it("explains why Ask and Search exist and deep-links both", () => {
    const model = buildAskSearchEvidenceVocabulary();

    expect(model.heading).toBe(ASK_SEARCH_EVIDENCE_HEADING);
    expect(model.whyTwo).toBe(ASK_SEARCH_EVIDENCE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("signed review record");
    expect(model.whyTwo.toLowerCase()).toContain("architecture package");
    expect(model.whyTwo.toLowerCase()).toContain("evidence trail");
    expect(model.whyTwo.toLowerCase()).not.toContain("find a page");
    expect(model.compactLine).toBe(ASK_SEARCH_EVIDENCE_COMPACT_LINE);

    expect(model.askLink).toEqual(ASK_SEARCH_EVIDENCE_ASK_LINK);
    expect(model.askLink.href).toBe(ASK_REVIEW_QUESTIONS_PATH);
    expect(model.askLink.href).toBe("/insights/ask-review-questions");

    expect(model.searchLink).toEqual(ASK_SEARCH_EVIDENCE_SEARCH_LINK);
    expect(model.searchLink.href).toBe(SEARCH_REVIEW_EVIDENCE_PATH);
    expect(model.searchLink.href).toBe("/insights/search-review-evidence");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveAskSearchEvidencePeerLink("ask")).toEqual(ASK_SEARCH_EVIDENCE_SEARCH_LINK);
    expect(resolveAskSearchEvidencePeerLink("search")).toEqual(ASK_SEARCH_EVIDENCE_ASK_LINK);
  });
});
