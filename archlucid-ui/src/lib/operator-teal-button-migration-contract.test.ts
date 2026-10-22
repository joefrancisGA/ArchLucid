import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

/** Operator surfaces migrated from inline `bg-teal-*` Button fills to `variant="primary"` (**TB-2291**). */
const TB_2291_MIGRATED_MODULES = [
  "components/TeamExpansionNudge.tsx",
  "components/trial/TrialBanner.tsx",
  "components/trial/TrialExpiryBanner.tsx",
  "components/trial/TrialUsageUpgradeNudge.tsx",
  "components/product/FeatureAvailabilityStates.tsx",
  "components/PostCommitAdvancedAnalysisHint.tsx",
  "components/wizard/steps/WizardStepPreset.tsx",
] as const;

function readModuleSource(relativePath: (typeof TB_2291_MIGRATED_MODULES)[number]): string {
  return readFileSync(join(SRC_ROOT, ...relativePath.split("/")), "utf8");
}

function assertNoButtonTealFillOverrides(source: string): void {
  const buttonOpenTags = source.match(/<Button[\s\S]*?>/g) ?? [];

  for (const block of buttonOpenTags) {
    expect(block).not.toMatch(/bg-teal-/);
  }
}

describe("TB-2291 operator teal Button migration contract", () => {
  it.each(TB_2291_MIGRATED_MODULES)("does not apply inline teal fills on Button in %s", (relativePath) => {
    assertNoButtonTealFillOverrides(readModuleSource(relativePath));
  });

  it("PostCommitAdvancedAnalysisHint uses primary variant for operator compare CTA", () => {
    const source = readModuleSource("components/PostCommitAdvancedAnalysisHint.tsx");

    expect(source).toContain('variant={buyerPolishedShell ? "outline" : "primary"}');
  });

  it("WizardStepPreset start-from-scratch CTA uses primary variant", () => {
    const source = readModuleSource("components/wizard/steps/WizardStepPreset.tsx");

    expect(source).toContain('variant="primary"');
    expect(source).toContain('data-testid="wizard-start-blank"');
  });
});
