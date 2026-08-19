import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(process.cwd());

const TB_2006_BAND_TEST_FILE = "src/components/architecture/ArchitectureDraftWorkspace.test.tsx";
const TB_2008_BAND_TEST_FILE =
  "src/app/(operator)/administration/workspace-settings/_sections/TenantCostSettingsCard.test.tsx";

const TB_2011_WIZARD_SOURCE_ROOTS = [
  "src/app/(operator)/architecture/reviews/new/use-guided-intake-draft-workflow.ts",
  "src/app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.tsx",
  "src/app/(operator)/architecture/reviews/new/QuickStartWizard.tsx",
] as const;

function readSrc(relativePath: string): string {
  return readFileSync(join(UI_ROOT, relativePath), "utf8");
}

describe("form validation affordances regression band (TB-2011)", () => {
  it("documents TB-2006 architecture draft Start review disable-until-ready contract", () => {
    const architectureDraft = readSrc(TB_2006_BAND_TEST_FILE);

    expect(architectureDraft).toContain("TB-2006");
    expect(architectureDraft).toContain("disables Start review");
    expect(architectureDraft).toContain("no validation toast");
  });

  it("documents TB-2008 tenant cost settings disable-until-ready contract", () => {
    const tenantCost = readSrc(TB_2008_BAND_TEST_FILE);

    expect(tenantCost).toContain("TB-2008");
    expect(tenantCost).toContain("disables Save");
    expect(tenantCost).toContain("without validation toast");
  });

  it("does not toast client-known guided-intake clarification validation behind disabled CTAs", () => {
    const guidedIntake = readSrc(TB_2011_WIZARD_SOURCE_ROOTS[0]);

    expect(guidedIntake).not.toContain("Enter an answer or skip this clarification.");
    expect(guidedIntake).not.toContain("Answer or skip each required clarification before reviewing.");
  });

  it("keeps review-start wizards on inline validation instead of validation toasts", () => {
    const firstPilot = readSrc(TB_2011_WIZARD_SOURCE_ROOTS[1]);
    const quickStart = readSrc(TB_2011_WIZARD_SOURCE_ROOTS[2]);

    expect(firstPilot).not.toContain("showError");
    expect(firstPilot).toContain("setClientValidationMessage");
    expect(quickStart).not.toContain("showError");
    expect(quickStart).toContain("stepValidationMessage");
  });
});
