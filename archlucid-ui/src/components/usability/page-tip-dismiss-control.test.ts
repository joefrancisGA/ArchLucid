import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd());

/** Page-top tips and shell banners must expose a visible Dismiss label, not icon-only X. */
const PAGE_TIP_DISMISS_CONTROL_PATHS = [
  "src/components/ContextualPageHintStrip.tsx",
  "src/components/usability/ExplainThisViewBanner.tsx",
  "src/components/usability/GlobalSearchShortcutCoach.tsx",
  "src/components/usability/FirstVisitHelpAutoOpen.tsx",
  "src/components/usability/ReviewsNewWizardResumeStrip.tsx",
  "src/components/KeyboardShortcutsDiscoverabilityCoach.tsx",
  "src/components/llm/LlmBudgetApproachingLimitBanner.tsx",
  "src/components/TeamExpansionNudge.tsx",
  "src/components/trial/TrialBanner.tsx",
  "src/components/trial/TrialExpiryBanner.tsx",
  "src/components/trial/TrialUsageUpgradeNudge.tsx",
  "src/components/operator-home/PilotRoiBaselineReadinessCard.tsx",
  "src/components/ScopeChangeConsequenceBanner.tsx",
] as const;

describe("page tip dismiss controls", () => {
  it.each(PAGE_TIP_DISMISS_CONTROL_PATHS)("does not use iconOnly DismissControl in %s", (relativePath) => {
    const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");

    expect(source, `${relativePath} must use a visible Dismiss button`).not.toMatch(/\biconOnly\b/);
  });
});
