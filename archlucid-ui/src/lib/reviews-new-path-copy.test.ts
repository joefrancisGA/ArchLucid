import { describe, expect, it } from "vitest";

import {
  REVIEWS_NEW_BRIEF_PLACEHOLDER,
  REVIEWS_NEW_PATH_HINTS,
  REVIEWS_NEW_PROOF_COLLECTION_HINT,
} from "@/lib/reviews-new-path-copy";

describe("reviews-new-path-copy buyer-facing copy", () => {
  it("guided-intake hint describes structured clarifying questions without repeating the mode name", () => {
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).not.toMatch(/guided intake/i);
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).toMatch(/clarifying questions/i);
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).toMatch(/readiness checks/i);
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).not.toMatch(/admission gates/i);
  });

  it("quick-review hint is clearly for the fastest first-pilot path", () => {
    expect(REVIEWS_NEW_PATH_HINTS["quick-review"]).toMatch(/first-pilot|evidence|review title/i);
  });

  it("detailed hint is for export-ready reviews", () => {
    expect(REVIEWS_NEW_PATH_HINTS.detailed).toMatch(/templates|imports|export/i);
  });

  it("proof collection hint references the collect script and review-id", () => {
    expect(REVIEWS_NEW_PROOF_COLLECTION_HINT).toMatch(/collect-first-pilot-proof/i);
    expect(REVIEWS_NEW_PROOF_COLLECTION_HINT).toMatch(/review-id/i);
  });

  it("uses cloud-neutral example brief placeholder (TB-773)", () => {
    expect(REVIEWS_NEW_BRIEF_PLACEHOLDER).toMatch(/private networking/i);
    expect(REVIEWS_NEW_BRIEF_PLACEHOLDER).not.toMatch(/\bAzure\b/i);
  });
});
