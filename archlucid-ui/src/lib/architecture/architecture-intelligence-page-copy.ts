import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { resolveWorkingArchitecturePortfolioParentLink } from "@/lib/resolve-working-evidence-parent-link";

/** Canonical page title for `/architecture/architecture-intelligence`. */
export const ARCHITECTURE_INTELLIGENCE_PAGE_TITLE = "Try another reasoning pass";

export const ARCHITECTURE_INTELLIGENCE_PRIMARY_CONTENT_ID = "architecture-intelligence-primary-content" as const;

export const ARCHITECTURE_INTELLIGENCE_FIRST_VIEWPORT_ID = "architecture-intelligence-first-viewport" as const;

export const ARCHITECTURE_INTELLIGENCE_FIRST_VIEWPORT_TEST_ID = ARCHITECTURE_INTELLIGENCE_FIRST_VIEWPORT_ID;

export const ARCHITECTURE_INTELLIGENCE_SKIP_TARGET_ID = ARCHITECTURE_INTELLIGENCE_FIRST_VIEWPORT_ID;

export const ARCHITECTURE_INTELLIGENCE_SKIP_LINK_LABEL = "Skip to architecture intelligence workspace" as const;

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

export function resolveArchitectureIntelligenceBreadcrumbParent(workingMode: boolean): {
  readonly label: string;
  readonly href: string;
} {
  if (workingMode) {
    const parent = resolveWorkingArchitecturePortfolioParentLink(true);

    return {
      label: parent.label,
      href: parent.href,
    };
  }

  return {
    label: ARCHITECTURE_INTELLIGENCE_BREADCRUMB_PARENT_LABEL,
    href: ARCHITECTURE_INTELLIGENCE_BREADCRUMB_PARENT_HREF,
  };
}

export const ARCHITECTURE_INTELLIGENCE_LOADING_STATUS = "Loading architecture intelligence…";

export const ARCHITECTURE_INTELLIGENCE_PRODUCT_CONTEXT_RETRY_LABEL = "Try again";

export const ARCHITECTURE_INTELLIGENCE_ACTIVE_RUN_LABEL = "Active reasoning session";

export const ARCHITECTURE_INTELLIGENCE_PUBLISH_TOGGLE_LABEL =
  "Publish gated findings and recommendations into findings and advisory on run";

export const ARCHITECTURE_INTELLIGENCE_CLAIM_HEADING = "Reasoning lab only";
