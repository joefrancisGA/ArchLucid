import { describe, expect, it } from "vitest";

import {
  FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID,
  LEGACY_FINISH_SETUP_HEADING_ID,
  LEGACY_FINISH_SETUP_SECTION_ID,
  ONBOARDING_OPTIONAL_SETUP_HEADING_ID,
  isFirstReviewGuideProgressDeepLinkHash,
  isOnboardingOptionalSetupDeepLinkHash,
} from "@/lib/first-review-guide-route";

describe("first-review-guide deep-link hashes", () => {
  it("matches optional workspace setup and legacy finish-setup anchors", () => {
    expect(isOnboardingOptionalSetupDeepLinkHash(`#${ONBOARDING_OPTIONAL_SETUP_HEADING_ID}`)).toBe(true);
    expect(isOnboardingOptionalSetupDeepLinkHash(`#${LEGACY_FINISH_SETUP_SECTION_ID}`)).toBe(true);
    expect(isOnboardingOptionalSetupDeepLinkHash(`#${LEGACY_FINISH_SETUP_HEADING_ID}`)).toBe(true);
    expect(isOnboardingOptionalSetupDeepLinkHash("#unrelated-anchor")).toBe(false);
  });

  it("matches the walkthrough progress checklist anchor", () => {
    expect(isFirstReviewGuideProgressDeepLinkHash(`#${FIRST_REVIEW_GUIDE_PROGRESS_HEADING_ID}`)).toBe(true);
    expect(isFirstReviewGuideProgressDeepLinkHash(`#${ONBOARDING_OPTIONAL_SETUP_HEADING_ID}`)).toBe(false);
  });
});
