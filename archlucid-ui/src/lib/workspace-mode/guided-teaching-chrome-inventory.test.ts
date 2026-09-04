import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { GUIDED_TEACHING_CHROME_SURFACE_IDS } from "@/lib/workspace-mode/guided-teaching-chrome-inventory";

const SURFACE_COMPONENT_FILES: Record<string, string> = {
  "shell-shortcut-coaches":
    "src/components/KeyboardShortcutsDiscoverabilityCoach.tsx",
  "first-visit-help-auto-open": "src/components/usability/FirstVisitHelpAutoOpen.tsx",
  "explain-this-view-banner": "src/components/usability/ExplainThisViewBanner.tsx",
  "contextual-page-hint-strip": "src/components/ContextualPageHintStrip.tsx",
  "core-pilot-celebrate-strip": "src/components/usability/CorePilotCompleteCelebrateStrip.tsx",
  "opt-in-tour-launcher": "src/components/tour/OptInTourLauncher.tsx",
  "findings-triage-first-finding-strip":
    "src/components/usability/FindingsTriageFirstFindingStrip.tsx",
  "help-panel-core-pilot-pin": "src/components/use-help-panel.tsx",
  "where-to-go-next-strips": "src/components/shell/AppShellMainAffordances.tsx",
  "sample-reviews-on-overview": "src/components/SampleReviewsOnOverviewPreferenceProvider.tsx",
  "keyboard-shortcuts-coach": "src/components/KeyboardShortcutsDiscoverabilityCoach.tsx",
  "global-search-shortcut-coach": "src/components/usability/GlobalSearchShortcutCoach.tsx",
  "persistent-workspace-next-action-strip":
    "src/components/usability/PersistentWorkspaceNextActionStrip.tsx",
};

describe("GUIDED_TEACHING_CHROME_SURFACE_IDS (LI-15)", () => {
  it("lists every teaching surface id", () => {
    expect(GUIDED_TEACHING_CHROME_SURFACE_IDS).toHaveLength(13);
  });

  it("gates each inventoried surface with useTeachingChromeVisible or Working-mode guard", () => {
    const uiRoot = join(process.cwd());

    for (const surfaceId of GUIDED_TEACHING_CHROME_SURFACE_IDS) {
      const relativePath = SURFACE_COMPONENT_FILES[surfaceId];

      expect(relativePath, `missing component mapping for ${surfaceId}`).toBeDefined();

      const source = readFileSync(join(uiRoot, relativePath), "utf8");
      const gated =
        source.includes("useTeachingChromeVisible")
        || (surfaceId === "sample-reviews-on-overview" && source.includes("isWorkingWorkspaceMode"));

      expect(gated, `${surfaceId} should gate teaching chrome in ${relativePath}`).toBe(true);
    }
  });
});
