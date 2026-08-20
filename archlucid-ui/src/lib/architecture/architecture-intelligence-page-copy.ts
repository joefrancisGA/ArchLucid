import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

/** Canonical page title for `/architecture/architecture-intelligence`. */
export const ARCHITECTURE_INTELLIGENCE_PAGE_TITLE = "Try another reasoning pass";

export const ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE =
  "Explore an alternative reasoning pass on a free-form architecture description.";

export const ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER =
  "Explore an alternative reasoning pass and publish gated findings into your review when ready.";

export function architectureIntelligencePageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE_BUYER
    : ARCHITECTURE_INTELLIGENCE_PAGE_SUBTITLE;
}

export const ARCHITECTURE_INTELLIGENCE_BREADCRUMB_PARENT_LABEL = OPERATOR_NAV_LINK_LABELS.reviewPackage;

export const ARCHITECTURE_INTELLIGENCE_BREADCRUMB_PARENT_HREF = REVIEWS_LIST_PATH;

export const ARCHITECTURE_INTELLIGENCE_LOADING_STATUS = "Loading architecture intelligence…";

export const ARCHITECTURE_INTELLIGENCE_PRODUCT_CONTEXT_RETRY_LABEL = "Try again";

export const ARCHITECTURE_INTELLIGENCE_ACTIVE_RUN_LABEL = "Active reasoning session";

export const ARCHITECTURE_INTELLIGENCE_PUBLISH_TOGGLE_LABEL =
  "Publish gated findings and recommendations into findings and advisory on run";

export const ARCHITECTURE_INTELLIGENCE_CLAIM_HEADING = "Reasoning lab only";
