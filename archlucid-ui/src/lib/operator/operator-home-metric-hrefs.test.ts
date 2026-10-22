import { describe, expect, it } from "vitest";

import {
  FIRST_REVIEW_GUIDE_PATH,
  ONBOARDING_OPTIONAL_SETUP_HEADING_ID,
} from "@/lib/first-review-guide-route";
import { reviewsHubInventoryFilterHref } from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-inventory-filters";

import {
  OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF,
  OPERATOR_HOME_FINALIZED_PACKAGES_HREF,
  OPERATOR_HOME_OPEN_FINDINGS_HREF,
  OPERATOR_HOME_SETUP_READINESS_HREF,
} from "@/lib/operator/operator-home-metric-hrefs";
import {
  operatorHomeActiveReviewsPresentation,
  operatorHomeFinalizedPackagesPresentation,
  workspaceOpenFindingsPresentation,
} from "@/lib/metric-count-presentation";

describe("operator-home-metric-hrefs", () => {
  it("deep-links setup readiness to optional workspace setup on the first-review guide", () => {
    expect(OPERATOR_HOME_SETUP_READINESS_HREF).toBe(
      `${FIRST_REVIEW_GUIDE_PATH}#${ONBOARDING_OPTIONAL_SETUP_HEADING_ID}`,
    );
  });

  it("aligns home counter hrefs with their inventory filter labels", () => {
    expect(OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF).toBe(reviewsHubInventoryFilterHref("Active"));
    expect(OPERATOR_HOME_FINALIZED_PACKAGES_HREF).toBe(reviewsHubInventoryFilterHref("finalized"));
    expect(operatorHomeActiveReviewsPresentation(2).href).toBe(OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF);
    expect(operatorHomeFinalizedPackagesPresentation(3).href).toBe(OPERATOR_HOME_FINALIZED_PACKAGES_HREF);
    expect(workspaceOpenFindingsPresentation(4).href).toBe(OPERATOR_HOME_OPEN_FINDINGS_HREF);
  });
});
