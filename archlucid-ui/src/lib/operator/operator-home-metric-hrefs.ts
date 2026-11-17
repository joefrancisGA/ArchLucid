import {
  FIRST_REVIEW_GUIDE_PATH,
  ONBOARDING_OPTIONAL_SETUP_HEADING_ID,
} from "@/lib/first-review-guide-route";

import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { findingsPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

import { reviewsHubInventoryFilterHref } from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-inventory-filters";

/** Deep-links for clickable operator-home workspace metrics. */

export const OPERATOR_HOME_OPEN_FINDINGS_HREF = buildGovernanceFindingsQueueHref({ filter: "open" });

export function resolveOperatorHomeOpenFindingsHref(productLine: ProductLineId): string {
  return buildGovernanceFindingsQueueHref({
    filter: "open",
    basePath: findingsPathForProductLine(productLine),
  });
}

/** Home query param that pre-filters Recent reviews to packages with approval warnings. */
export const OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM = "warnings";

export const OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF = `/?${OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM}=1`;

export const OPERATOR_HOME_SETUP_READINESS_HREF =
  `${FIRST_REVIEW_GUIDE_PATH}#${ONBOARDING_OPTIONAL_SETUP_HEADING_ID}` as const;

export const OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF = reviewsHubInventoryFilterHref("Active");

export const OPERATOR_HOME_FINALIZED_PACKAGES_HREF = reviewsHubInventoryFilterHref("finalized");
