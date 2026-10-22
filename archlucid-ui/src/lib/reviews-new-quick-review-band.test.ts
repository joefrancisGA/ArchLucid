import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  REVIEWS_NEW_PATH_HINTS,
  REVIEWS_NEW_QUICK_REVIEW_PATH_TOKEN,
  REVIEWS_NEW_QUICK_START_TAB_LABEL,
} from "@/lib/reviews-new-path-copy";
import {
  REVIEWS_NEW_QUICK_REVIEW_TAB_PATH_TOKEN,
  REVIEWS_NEW_QUICK_REVIEW_TAB_PRODUCT_LABEL,
  REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_NOTE,
  REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-reviews-new-quick-review";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const QUICK_REVIEW_BAND_TEST_FILES = [
  "src/lib/ui-route-traffic-reviews-new-quick-review.test.ts",
  "src/app/(operator)/architecture/reviews/new/ReviewsNewPathSwitcher.test.tsx",
  "src/app/(operator)/architecture/reviews/new/quick-review-wizard-import-policy.test.ts",
  "src/app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.test.tsx",
  "src/lib/reviews-new-path-copy.test.ts",
] as const;

describe("reviews-new quick-review band regression (TB-1875)", () => {
  it("keeps sibling Vitest guards for TB-1871 through TB-1874 on disk", () => {
    for (const relativePath of QUICK_REVIEW_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("honors REQ traffic path token and product label alignment (TB-1871)", () => {
    expect(REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_ROW_ID).toBe("REQ");
    expect(REVIEWS_NEW_QUICK_REVIEW_TAB_PATH_TOKEN).toBe(REVIEWS_NEW_QUICK_REVIEW_PATH_TOKEN);
    expect(REVIEWS_NEW_QUICK_REVIEW_TAB_PRODUCT_LABEL).toBe(REVIEWS_NEW_QUICK_START_TAB_LABEL);
    expect(REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_NOTE).toContain(
      `path=${REVIEWS_NEW_QUICK_REVIEW_PATH_TOKEN}`,
    );
    expect(REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_NOTE).toContain("ReviewsNewPathSwitcher");
    expect(REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_NOTE).toContain("FirstPilotIntakeWizard");
    expect(REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_NOTE).toContain("cannot improve further toward 80");
  });

  it("keeps quick-review path hint and URL token aligned (TB-1867 / TB-1872)", () => {
    expect(REVIEWS_NEW_QUICK_REVIEW_PATH_TOKEN).toBe("quick-review");
    expect(REVIEWS_NEW_PATH_HINTS["quick-review"]).toMatch(/quick start|evidence|review title/i);
  });

  it("keeps dual-surface honesty and density Vitest in sibling modules (TB-1873 / TB-1874)", () => {
    expect(
      existsSync(
        join(UI_ROOT, "src/app/(operator)/architecture/reviews/new/quick-review-wizard-import-policy.test.ts"),
      ),
    ).toBe(true);
    expect(
      existsSync(join(UI_ROOT, "src/app/(operator)/architecture/reviews/new/FirstPilotIntakeWizard.test.tsx")),
    ).toBe(true);
  });
});
