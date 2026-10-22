import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const FLAT_LABEL_VALUE_BAND_TEST_FILES = [
  "src/components/InlineMetadataLabel.test.tsx",
  "src/components/operator-home/OperatorHomeReviewSummaryCard.test.tsx",
  "src/components/runs/RunInspectorPreview.test.tsx",
  "src/app/(operator)/insights/sponsor-report/_sections/PilotValueReportPageView.test.tsx",
] as const;

const TB_1999_SHIPPED_SOURCE_ROOTS = [
  "src/app/(operator)/insights/sponsor-report/_sections/PilotValueReportPageView.tsx",
  "src/app/(operator)/governance/policy-packs/[id]/PolicyPackGenericDetail.tsx",
  "src/app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx",
] as const;

function readUiUtf8(pathFromUiRoot: string): string {
  return readFileSync(join(UI_ROOT, pathFromUiRoot), "utf8");
}

describe("flat label:value metadata band regression (TB-1999)", () => {
  it("keeps sibling Vitest guards for TB-1996 through TB-1998 on disk", () => {
    for (const relativePath of FLAT_LABEL_VALUE_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("keeps buyer-facing metadata rows on InlineMetadataLabel or InlineMetadataLine (TB-1999)", () => {
    for (const relativePath of TB_1999_SHIPPED_SOURCE_ROOTS) {
      const source = readUiUtf8(relativePath);

      expect(source.includes("InlineMetadataLabel") || source.includes("InlineMetadataLine"), relativePath).toBe(
        true,
      );
    }
  });

  it("forbids raw Label: value prose on pilot value report disposition rows (TB-1999)", () => {
    const pilotReport = readUiUtf8(
      "src/app/(operator)/insights/sponsor-report/_sections/PilotValueReportPageView.tsx",
    );

    expect(pilotReport).toContain("InlineMetadataLabel");
    expect(pilotReport).not.toMatch(/Approved:\s*\{/);
  });
});
