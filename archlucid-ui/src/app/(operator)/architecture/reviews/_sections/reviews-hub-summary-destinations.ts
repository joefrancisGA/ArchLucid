import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import {
  OPERATOR_HOME_OPEN_FINDINGS_HREF,
  resolveOperatorHomeOpenFindingsHref,
} from "@/lib/operator/operator-home-metric-hrefs";
import { buildGovernanceFindingsQueueHref } from "@/lib/metric-count-presentation";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { findingsPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

import { reviewsHubInventoryFilterHref } from "./reviews-hub-inventory-filters";

export const REVIEWS_HUB_SUMMARY_FINDINGS_HREF = buildGovernanceFindingsQueueHref();
export const REVIEWS_HUB_SUMMARY_OPEN_RISKS_HREF = OPERATOR_HOME_OPEN_FINDINGS_HREF;

export function resolveReviewsHubSummaryFindingsHref(productLine: ProductLineId): string {
  return buildGovernanceFindingsQueueHref({ basePath: findingsPathForProductLine(productLine) });
}

export function resolveReviewsHubSummaryOpenRisksHref(productLine: ProductLineId): string {
  return resolveOperatorHomeOpenFindingsHref(productLine);
}
export const REVIEWS_HUB_SUMMARY_AWAITING_APPROVAL_HREF = GOVERNANCE_APPROVAL_QUEUE_PATH;
export const REVIEWS_HUB_SUMMARY_ACTIVE_HREF = reviewsHubInventoryFilterHref("Active");
export const REVIEWS_HUB_SUMMARY_FINALIZED_HREF = reviewsHubInventoryFilterHref("finalized");
