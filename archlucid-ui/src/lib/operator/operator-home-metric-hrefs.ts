import {
  FIRST_REVIEW_GUIDE_PATH,
  ONBOARDING_OPTIONAL_SETUP_HEADING_ID,
} from "@/lib/first-review-guide-route";

import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";

import { reviewsHubInventoryFilterHref } from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-inventory-filters";

/** Deep-links for clickable operator-home workspace metrics. */

export const OPERATOR_HOME_OPEN_FINDINGS_HREF = buildGovernanceFindingsQueueHref({ filter: "open" });

/** Home query param that pre-filters Recent reviews to packages with governance warnings. */
export const OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM = "warnings";

export const OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF = `/?${OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM}=1`;

export const OPERATOR_HOME_SETUP_READINESS_HREF =
  `${FIRST_REVIEW_GUIDE_PATH}#${ONBOARDING_OPTIONAL_SETUP_HEADING_ID}` as const;

export const OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF = reviewsHubInventoryFilterHref("Active");

export const OPERATOR_HOME_FINALIZED_PACKAGES_HREF = reviewsHubInventoryFilterHref("finalized");
