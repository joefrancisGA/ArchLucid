import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

/**
 * Components painting a pastel tint that the notice-surface pattern still matches (TB-2379 baseline).
 *
 * `DESIGN_TOKENS.callout.*` is the canonical recipe: neutral `bg-al-surface-raised` with a
 * coloured border, per the "no decorative pastel card backgrounds" rule in the UI standard.
 * Hand-rolled tints drifted apart — sibling review-intake notices carried `border-amber-300 /
 * text-amber-950` and `border-amber-200 / text-amber-900` for the same severity.
 *
 * The entries left here are not notices: they are diff rows, status chips, legend swatches, and
 * selected-state fills where the color *is* the datum, so a neutral callout surface would erase
 * the meaning. The regex cannot tell those apart from a notice fill, so they stay listed. This
 * list may shrink but must never grow.
 *
 * @see docs/library/UI_DESIGN_SYSTEM.md
 */
const TINTED_CALLOUT_SURFACE_BASELINE: ReadonlySet<string> = new Set([
  "app/(marketing)/quick-scan/QuickScanForm.tsx",
  "app/(operator)/administration/_sections/SettingsMasterDestinationCard.tsx",
  "app/(operator)/administration/ai-usage/_sections/ai-usage/AiUsageRecentActivityPanel.tsx",
  "app/(operator)/administration/model-governance/_sections/ModelGovernanceSettingsCard.tsx",
  "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFeasibilityVerdictSection.tsx",
  "app/(operator)/insights/roi-summary/_sections/RoiSummaryLoadedHourlyCostField.tsx",
  "app/(operator)/internal/configuration/_sections/AdminConfigurationPageView.tsx",
  "components/BeforeAfterDelta/BeforeAfterDeltaTopPanel.tsx",
  "components/GraphNodeKindLegendChips.tsx",
  "components/compare/ArchitectureManifestUnifiedDiffView.tsx",
  "components/findings/FindingsWhatIfAnalysisPanel.tsx",
  "components/governance/GovernanceConflictsTable.tsx",
  "components/operator-home/OperatorHomeGlossarySections.tsx",
  "components/policy/PolicyPackComplianceRuleKeyDiffView.tsx",
  "components/reviews/ReviewAgentExecutionLogSection.tsx",
  "components/usability/SponsorConfidenceLabel.tsx",
]);

const TINTED_CALLOUT_SURFACE = /\bbg-(?:amber|emerald|rose|green|sky)-(?:50|100)\b/;

function collectComponentFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectComponentFiles(absolute));
      continue;
    }

    if (extname(absolute) === ".tsx" && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

function usesTintedCalloutSurface(absolute: string): boolean {
  return TINTED_CALLOUT_SURFACE.test(readFileSync(absolute, "utf8"));
}

describe("notice callout surfaces (TB-2379)", () => {
  it("keeps pastel-tinted callout surfaces inside the frozen baseline", () => {
    const offenders = collectComponentFiles(SRC_ROOT)
      .filter(usesTintedCalloutSurface)
      .map(toPosixRelativePath)
      .filter((path) => !TINTED_CALLOUT_SURFACE_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that were already migrated", () => {
    const stale = [...TINTED_CALLOUT_SURFACE_BASELINE]
      .filter((path) => !usesTintedCalloutSurface(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
