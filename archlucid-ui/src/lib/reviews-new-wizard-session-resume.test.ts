import { afterEach, describe, expect, it, vi } from "vitest";

import {
  consumeReviewsNewWizardAutoRestore,
  dispatchReviewsNewWizardContinueRequested,
  findResumableReviewsNewWizardSession,
  requestReviewsNewWizardAutoRestore,
  reviewsNewGuidedIntakeHasSaveableContent,
  reviewsNewQuickStartHasSaveableContent,
  reviewsNewTemplatesHasSaveableContent,
  reviewsNewWizardPathIsActive,
} from "@/lib/reviews-new-wizard-session-resume";
import {
  WIZARD_SESSION_IDS,
  writeWizardSessionSnapshot,
} from "@/lib/wizard-session-persistence";

describe("reviews-new-wizard-session-resume", () => {
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("finds the most recently saved quick-start session with saveable content", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "Payments platform", briefText: "" },
    });

    const session = findResumableReviewsNewWizardSession();

    expect(session).not.toBeNull();
    expect(session?.wizardId).toBe(WIZARD_SESSION_IDS.reviewsNewQuickStart);
    expect(session?.pathMode).toBe("quick-review");
  });

  it("ignores empty quick-start snapshots", () => {
    writeWizardSessionSnapshot(WIZARD_SESSION_IDS.reviewsNewQuickStart, {
      stepIndex: 0,
      state: { runTitle: "", briefText: "" },
    });

    expect(findResumableReviewsNewWizardSession()).toBeNull();
  });

  it("consumes auto-restore flag only for the matching wizard", () => {
    requestReviewsNewWizardAutoRestore(WIZARD_SESSION_IDS.reviewsNewQuickStart);

    expect(consumeReviewsNewWizardAutoRestore(WIZARD_SESSION_IDS.reviewsNewQuickStart)).toBe(true);
    expect(consumeReviewsNewWizardAutoRestore(WIZARD_SESSION_IDS.reviewsNewQuickStart)).toBe(false);
  });

  it("treats bare path as quick-review for resume targeting", () => {
    expect(reviewsNewWizardPathIsActive("", "quick-review")).toBe(true);
    expect(reviewsNewWizardPathIsActive("quick-review", "quick-review")).toBe(true);
    expect(reviewsNewWizardPathIsActive("", "guided-intake")).toBe(false);
    expect(reviewsNewWizardPathIsActive("guided-intake", "guided-intake")).toBe(true);
  });

  it("dispatches continue requested event with wizard id", () => {
    const listener = vi.fn();

    window.addEventListener("archlucid:reviews-new-wizard-continue", listener);

    dispatchReviewsNewWizardContinueRequested(WIZARD_SESSION_IDS.reviewsNewQuickStart);

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({
      wizardId: WIZARD_SESSION_IDS.reviewsNewQuickStart,
    });

    window.removeEventListener("archlucid:reviews-new-wizard-continue", listener);
  });

  it("matches wizard saveable predicates", () => {
    expect(reviewsNewQuickStartHasSaveableContent({ runTitle: "A", briefText: "" }, 0)).toBe(true);
    expect(reviewsNewTemplatesHasSaveableContent({ systemName: "", description: "" }, 0)).toBe(false);
    expect(reviewsNewTemplatesHasSaveableContent({ systemName: "Core", description: "" }, 0)).toBe(true);
    expect(
      reviewsNewGuidedIntakeHasSaveableContent(
        { freeTextIntent: "", businessOutcome: "", systemName: "", draftId: null },
        0,
      ),
    ).toBe(false);
    expect(
      reviewsNewGuidedIntakeHasSaveableContent(
        { freeTextIntent: "Intent", businessOutcome: "", systemName: "", draftId: null },
        0,
      ),
    ).toBe(true);
  });
});
