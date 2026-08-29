import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_LEAD,
  GUIDED_INTAKE_WHAT_IF_BRANCH_HINT_LEAD,
} from "@/lib/guided-intake-copy";
import {
  REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN,
  REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
  REVIEWS_NEW_PATH_HINTS,
} from "@/lib/reviews-new-path-copy";
import {
  REVIEWS_NEW_GUIDED_INTAKE_TAB_PATH_TOKEN,
  REVIEWS_NEW_GUIDED_INTAKE_TAB_PRODUCT_LABEL,
  REVIEWS_NEW_GUIDED_INTAKE_TAB_TRAFFIC_NOTE,
} from "@/lib/ui-route-traffic-reviews-new-guided-intake";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const GUIDED_INTAKE_BAND_TEST_FILES = [
  "src/lib/ui-route-traffic-reviews-new-guided-intake.test.ts",
  "src/lib/guided-intake-copy.test.ts",
  "src/app/(operator)/architecture/reviews/new/ReviewsNewPathSwitcher.test.tsx",
  "src/app/(operator)/architecture/reviews/new/SocraticIntakeWizard.test.tsx",
] as const;

function readUiUtf8(pathFromUiRoot: string): string {
  return readFileSync(join(UI_ROOT, pathFromUiRoot), "utf8");
}

describe("guided-intake band regression (TB-1880)", () => {
  it("keeps sibling Vitest guards for TB-1876 through TB-1879 on disk", () => {
    for (const relativePath of GUIDED_INTAKE_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("honors ENE traffic path token and product label (TB-1876)", () => {
    expect(REVIEWS_NEW_GUIDED_INTAKE_TAB_PATH_TOKEN).toBe(REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN);
    expect(REVIEWS_NEW_GUIDED_INTAKE_TAB_PRODUCT_LABEL).toBe(REVIEWS_NEW_GUIDED_QUESTIONS_LABEL);
    expect(REVIEWS_NEW_GUIDED_INTAKE_TAB_TRAFFIC_NOTE).toContain(
      `path=${REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN}`,
    );
    expect(REVIEWS_NEW_GUIDED_INTAKE_TAB_TRAFFIC_NOTE).toContain("SocraticIntakeWizard");
  });

  it("keeps guided-intake path hint and URL token aligned (TB-1867 / TB-1877)", () => {
    expect(REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN).toBe("guided-intake");
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).toMatch(/clarifying questions/i);
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).toMatch(/readiness checks/i);
  });

  it("forbids admission-gate buyer jargon in guided-intake chrome (TB-1878)", () => {
    expect(REVIEWS_NEW_PATH_HINTS["guided-intake"]).not.toMatch(/admission gates?/i);
  });

  it("demotes context banners to neutral helper copy (TB-1879)", () => {
    expect(GUIDED_INTAKE_SOURCE_ARCHITECTURE_HINT_LEAD).toBe("Reviewing saved architecture.");
    expect(GUIDED_INTAKE_WHAT_IF_BRANCH_HINT_LEAD).toBe("What-if branch.");

    const wizardSource = readUiUtf8(
      "src/app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx",
    );

    expect(wizardSource).toContain('data-testid="guided-intake-primary-panel"');
    expect(wizardSource).toContain('data-testid="socratic-source-architecture-banner"');
    expect(wizardSource).toContain("flex min-w-0 flex-col gap-4");
    expect(wizardSource).not.toContain("border-teal-200");
    expect(wizardSource).not.toContain("border-sky-300");
  });
});
