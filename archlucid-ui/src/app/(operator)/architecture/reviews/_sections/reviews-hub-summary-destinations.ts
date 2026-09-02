import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_HOME_OPEN_FINDINGS_HREF } from "@/lib/operator/operator-home-metric-hrefs";
import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";

import { reviewsHubInventoryFilterHref } from "./reviews-hub-inventory-filters";

export const REVIEWS_HUB_SUMMARY_FINDINGS_HREF = buildGovernanceFindingsQueueHref();
export const REVIEWS_HUB_SUMMARY_OPEN_RISKS_HREF = OPERATOR_HOME_OPEN_FINDINGS_HREF;
export const REVIEWS_HUB_SUMMARY_AWAITING_APPROVAL_HREF = GOVERNANCE_APPROVAL_QUEUE_PATH;
export const REVIEWS_HUB_SUMMARY_ACTIVE_HREF = reviewsHubInventoryFilterHref("Active");
export const REVIEWS_HUB_SUMMARY_FINALIZED_HREF = reviewsHubInventoryFilterHref("finalized");
