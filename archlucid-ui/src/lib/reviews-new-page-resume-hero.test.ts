import { afterEach, describe, expect, it } from "vitest";

import {
  resolveReviewsNewPathModeFromQuery,
  reviewsNewShowsPathTabChrome,
  shouldShowReviewsNewPageLevelResumeHero,
  shouldSuppressWizardSessionResumePromptOnReviewsNew,
} from "@/lib/reviews-new-page-resume-hero";
import {
  dismissReviewsNewWizardResumeStrip,
  findResumableReviewsNewWizardSession,
} from "@/lib/reviews-new-wizard-session-resume";
import {
  WIZARD_SESSION_IDS,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

describe("reviews-new-page-resume-hero", () => {
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("resolves path query tokens", () => {
    expect(resolveReviewsNewPathModeFromQuery("detailed")).toBe("detailed");
    expect(resolveReviewsNewPathModeFromQuery("guided-intake")).toBe("guided-intake");
    expect(resolveReviewsNewPathModeFromQuery("quick-review")).toBe("quick-review");
    expect(resolveReviewsNewPathModeFromQuery("")).toBeNull();
    expect(resolveReviewsNewPathModeFromQuery("unknown")).toBeNull();
  });

  it("treats buyer-polished detailed and guided tabs as path-tab chrome", () => {
    expect(reviewsNewShowsPathTabChrome(true, "detailed")).toBe(true);
    expect(reviewsNewShowsPathTabChrome(true, "guided-intake")).toBe(true);
    expect(reviewsNewShowsPathTabChrome(true, "quick-review")).toBe(false);
    expect(reviewsNewShowsPathTabChrome(true, null)).toBe(false);
    expect(reviewsNewShowsPathTabChrome(false, "detailed")).toBe(false);
  });

  it("shows the hub resume hero on the launcher and quick-review tab when a session exists", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    expect(shouldShowReviewsNewPageLevelResumeHero(true, "")).toBe(true);
    expect(shouldShowReviewsNewPageLevelResumeHero(true, "quick-review")).toBe(true);
    expect(shouldShowReviewsNewPageLevelResumeHero(true, "detailed")).toBe(false);
    expect(shouldShowReviewsNewPageLevelResumeHero(true, "guided-intake")).toBe(false);
  });

  it("suppresses wizard resume prompts when the hub resume hero is visible", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    expect(shouldSuppressWizardSessionResumePromptOnReviewsNew(true, "")).toBe(true);
    expect(shouldSuppressWizardSessionResumePromptOnReviewsNew(true, "detailed")).toBe(false);
  });

  it("allows wizard resume prompts after the hub strip is dismissed", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "Brief" },
    });

    const session = findResumableReviewsNewWizardSession();

    expect(session).not.toBeNull();

    if (session !== null) {
      dismissReviewsNewWizardResumeStrip(session);
    }

    expect(shouldShowReviewsNewPageLevelResumeHero(true, "")).toBe(false);
    expect(shouldSuppressWizardSessionResumePromptOnReviewsNew(true, "")).toBe(false);
  });
});
