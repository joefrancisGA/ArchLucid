import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

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

const ghostButtonPatterns = [
  /variant=["']ghost["']/,
  /variant:\s*["']ghost["']/,
  /buttonVariants\(\{\s*variant:\s*["']ghost["']/,
  /variant=["']link["']/,
  /variant:\s*["']link["']/,
  /buttonVariants\(\{\s*variant:\s*["']link["']/,
] as const;

describe("shared button wrappers visible-boundary guard (TB-2169)", () => {
  it.each(SHARED_BUTTON_WRAPPER_PATHS)("does not emit ghost/link Button variants in %s", (relativePath) => {
    const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");

    for (const pattern of ghostButtonPatterns) {
      expect(source, `${relativePath} matched ${pattern}`).not.toMatch(pattern);
    }
  });
});
