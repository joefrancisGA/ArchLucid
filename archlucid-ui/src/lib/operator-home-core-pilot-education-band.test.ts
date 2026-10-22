import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { inAppHelpHref } from "@/lib/product-documentation-registry";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const OPERATOR_HOME_CORE_PILOT_BAND_TEST_FILES = [
  "src/components/operator-home/OperatorHomeDoThisNextCard.test.tsx",
  "src/components/operator-home/OperatorHomeAdvancedGuidanceSection.test.tsx",
  "src/components/operator-home/OperatorHomeWorkspaceEmptyState.test.tsx",
] as const;

function readUiUtf8(pathFromUiRoot: string): string {
  return readFileSync(join(UI_ROOT, pathFromUiRoot), "utf8");
}

describe("operator-home core-pilot education band regression (TB-1995)", () => {
  it("keeps sibling Vitest guards for TB-1994 on disk", () => {
    for (const relativePath of OPERATOR_HOME_CORE_PILOT_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("documents the core-pilot help href used by educational secondaries", () => {
    expect(inAppHelpHref("core-pilot")).toBe("/help/core-pilot");
  });

  it("locks Do-this-next Vitest against duplicate core-pilot educational secondaries (TB-1994 / TB-1995)", () => {
    const doThisNextTest = readUiUtf8("src/components/operator-home/OperatorHomeDoThisNextCard.test.tsx");

    expect(doThisNextTest).toContain("TB-1994 / TB-1995");
    expect(doThisNextTest).toContain("operator-home-do-this-next-secondary");
    expect(doThisNextTest).toContain("OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA");
    expect(doThisNextTest).toContain("OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA");
  });

  it("locks advanced-guidance Vitest against competing View workflow body CTAs (TB-1994)", () => {
    const advancedGuidanceTest = readUiUtf8(
      "src/components/operator-home/OperatorHomeAdvancedGuidanceSection.test.tsx",
    );

    expect(advancedGuidanceTest).toContain('name: "View workflow"');
    expect(advancedGuidanceTest).toContain("core-pilot-checklist");
  });
});
