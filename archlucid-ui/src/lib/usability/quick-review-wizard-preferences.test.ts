import { describe, expect, it, beforeEach } from "vitest";

import {
  persistQuickReviewWizardPreferences,
  readQuickReviewWizardPreferences,
} from "./quick-review-wizard-preferences";

describe("quick-review-wizard-preferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips proof scope, execution mode, and advanced disclosure", () => {
    persistQuickReviewWizardPreferences({
      proofScope: ["cost", "topology"],
      executionMode: "live",
      advancedConfigExpanded: true,
    });

    expect(readQuickReviewWizardPreferences()).toEqual({
      proofScope: ["cost", "topology"],
      executionMode: "live",
      advancedConfigExpanded: true,
    });
  });

  it("returns null when stored proof scope is empty", () => {
    localStorage.setItem(
      "archlucid_quick_review_wizard_prefs_v1",
      JSON.stringify({ proofScope: [], executionMode: "simulator", advancedConfigExpanded: false }),
    );

    expect(readQuickReviewWizardPreferences()).toBeNull();
  });
});
