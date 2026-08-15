import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

const TB_2293_MIGRATED_MODULES = [
  "app/(operator)/architecture/reviews/RunsListClient.tsx",
  "app/(operator)/governance/decision-register/DecisionRegisterFiltersPanel.tsx",
  "app/(operator)/administration/ai-usage/_sections/ai-usage/AiUsageDailyUsagePanel.tsx",
  "components/GraphBuyerCanvasToolbar.tsx",
  "app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx",
] as const;

function readModuleSource(relativePath: (typeof TB_2293_MIGRATED_MODULES)[number]): string {
  return readFileSync(join(SRC_ROOT, ...relativePath.split("/")), "utf8");
}

function assertNoListScopePrimaryOutlineToggles(source: string): void {
  expect(source).not.toMatch(/variant=\{[^}]*\? "primary" : "outline"/);
}

describe("TB-2293 list-scope FilterChip migration contract", () => {
  it.each(TB_2293_MIGRATED_MODULES)("does not use filled primary Button toggles in %s", (relativePath) => {
    assertNoListScopePrimaryOutlineToggles(readModuleSource(relativePath));
  });

  it.each(TB_2293_MIGRATED_MODULES)("uses FilterChip for list-scope toggles in %s", (relativePath) => {
    expect(readModuleSource(relativePath)).toContain("FilterChip");
  });
});
