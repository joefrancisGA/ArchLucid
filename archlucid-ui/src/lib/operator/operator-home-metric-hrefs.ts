import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";

import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";

/** Deep-links for clickable operator-home workspace metrics. */

export const OPERATOR_HOME_OPEN_FINDINGS_HREF = buildGovernanceFindingsQueueHref({ filter: "open" });

/** Home query param that pre-filters Recent reviews to packages with governance warnings. */
export const OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM = "warnings";

export const OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF = `/?${OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM}=1`;

export const OPERATOR_HOME_SETUP_READINESS_HREF = FIRST_REVIEW_GUIDE_PATH;

export const OPERATOR_HOME_ARCHITECTURE_PACKAGES_HREF = "/architecture/reviews";
