import { describe, expect, it } from "vitest";

import {
  describeFirstPilotReviewTitleGap,
  FIRST_PILOT_REVIEW_TITLE_QUALITY_EXAMPLE,
  isFirstPilotReviewTitleAcceptable,
  isFirstPilotReviewTitleAcceptableWithEvidence,
} from "@/lib/first-pilot-review-title-quality";

describe("first-pilot-review-title-quality", () => {
  it("accepts the placeholder system-plus-decision shape", () => {
    expect(isFirstPilotReviewTitleAcceptable(FIRST_PILOT_REVIEW_TITLE_QUALITY_EXAMPLE)).toBe(true);
    expect(isFirstPilotReviewTitleAcceptable("Retail API — retire on-prem gateway")).toBe(true);
    expect(isFirstPilotReviewTitleAcceptable("Payments platform: move checkout to Azure")).toBe(true);
    expect(describeFirstPilotReviewTitleGap(FIRST_PILOT_REVIEW_TITLE_QUALITY_EXAMPLE)).toBeNull();
  });

  it("rejects empty, invented default, and banned activity placeholders", () => {
    expect(isFirstPilotReviewTitleAcceptable("")).toBe(false);
    expect(isFirstPilotReviewTitleAcceptable("ab")).toBe(false);
    expect(isFirstPilotReviewTitleAcceptable("Architecture review")).toBe(false);
    expect(isFirstPilotReviewTitleAcceptable("Test review")).toBe(false);
    expect(isFirstPilotReviewTitleAcceptable("weekly review")).toBe(false);
    expect(isFirstPilotReviewTitleAcceptable("Retail API")).toBe(false);
    expect(describeFirstPilotReviewTitleGap("Test review")).toMatch(/system and the decision/i);
  });

  it("accepts short project titles when evidence carries the architecture context", () => {
    expect(isFirstPilotReviewTitleAcceptableWithEvidence("#Al-Lucid")).toBe(true);
    expect(isFirstPilotReviewTitleAcceptableWithEvidence("Retail API review")).toBe(true);
    expect(describeFirstPilotReviewTitleGap("#Al-Lucid", { evidenceAttached: true })).toBeNull();
    expect(isFirstPilotReviewTitleAcceptableWithEvidence("Architecture review")).toBe(false);
  });
});
