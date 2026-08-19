import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  REVIEWS_NEW_DETAILED_PATH_TOKEN,
  REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL,
} from "@/lib/reviews-new-path-copy";
import {
  REVIEWS_NEW_DETAILED_TAB_PATH_TOKEN,
  REVIEWS_NEW_DETAILED_TAB_PRODUCT_LABEL,
  REVIEWS_NEW_DETAILED_TAB_TRAFFIC_NOTE,
  REVIEWS_NEW_DETAILED_TAB_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-reviews-new-detailed";

const UI_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const REVIEWS_NEW_DETAILED_BAND_TEST_FILES = [
  "src/lib/ui-route-traffic-reviews-new-detailed.test.ts",
  "src/app/(operator)/architecture/reviews/new/ReviewsNewPathSwitcher.test.tsx",
  "src/app/(operator)/architecture/reviews/new/reviews-new-path-switcher-state.test.ts",
  "src/app/(operator)/architecture/reviews/new/NewRunWizardClient.embedded.test.tsx",
  "src/lib/reviews-new-path-copy.test.ts",
] as const;

describe("reviews-new detailed path band regression (TB-1870)", () => {
  it("keeps sibling Vitest guards for TB-1866 through TB-1869 on disk", () => {
    for (const relativePath of REVIEWS_NEW_DETAILED_BAND_TEST_FILES) {
      expect(existsSync(join(UI_ROOT, relativePath)), relativePath).toBe(true);
    }
  });

  it("honors REN traffic path token and product label alignment (TB-1866)", () => {
    expect(REVIEWS_NEW_DETAILED_TAB_TRAFFIC_ROW_ID).toBe("REN");
    expect(REVIEWS_NEW_DETAILED_TAB_PATH_TOKEN).toBe(REVIEWS_NEW_DETAILED_PATH_TOKEN);
    expect(REVIEWS_NEW_DETAILED_TAB_PRODUCT_LABEL).toBe(REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL);
    expect(REVIEWS_NEW_DETAILED_TAB_TRAFFIC_NOTE).toContain(`path=${REVIEWS_NEW_DETAILED_PATH_TOKEN}`);
    expect(REVIEWS_NEW_DETAILED_TAB_TRAFFIC_NOTE).toContain("ReviewsNewPathSwitcher");
    expect(REVIEWS_NEW_DETAILED_TAB_TRAFFIC_NOTE).toContain("cannot improve further toward 80");
  });

  it("keeps detailed path query token stable for URL sync guards (TB-1867)", () => {
    expect(REVIEWS_NEW_DETAILED_PATH_TOKEN).toBe("detailed");
  });
});
