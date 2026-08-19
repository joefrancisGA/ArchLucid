import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findButtonVisibleBoundaryViolations } from "@/lib/button-visible-boundary-source-patterns";

const REPO_ROOT = join(process.cwd());

/** Shared wrappers that must not reintroduce ghost/link Button variants after TB-2168. */
const SHARED_BUTTON_WRAPPER_PATHS = [
  "src/components/usability/DismissControl.tsx",
  "src/components/help/HelpTopicPdfDownloadButton.tsx",
  "src/components/tour/OptInTourLauncher.tsx",
  "src/app/(operator)/help/HelpTopicMarkdownView.tsx",
  "src/components/ScopeSwitcherProjectOptionButton.tsx",
  "src/components/ProductLearningFeedbackControls.tsx",
  "src/app/(operator)/insights/ask-review-questions/_sections/AskThreadHistoryPanel.tsx",
  "src/app/(operator)/governance/policy-packs/_sections/PolicyPacksRefreshToolbar.tsx",
  "src/app/(operator)/insights/compare-two-reviews/_sections/CompareSampleComparisonAction.tsx",
] as const;

describe("shared button wrappers visible-boundary guard (TB-2169)", () => {
  it.each(SHARED_BUTTON_WRAPPER_PATHS)("does not emit ghost/link Button variants in %s", (relativePath) => {
    const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");
    const violations = findButtonVisibleBoundaryViolations(source);

    expect(violations, `${relativePath}: use outline per UI_DESIGN_SYSTEM.md § TB-2168`).toEqual([]);
  });
});
