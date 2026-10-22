import type { ProductLineId } from "@/lib/product-line/product-line-id";

export const HELP_HUB_PAGE_TITLE = "Help" as const;

export const HELP_HUB_PRIMARY_CONTENT_ID = "help-hub-primary-content" as const;

export const HELP_HUB_SKIP_LINK_LABEL = "Skip to help center content" as const;

export const HELP_HUB_PAGE_SUBTITLE_BUYER =
  "Browse how-to guides, troubleshooting, and procurement orientation for architecture reviews in this workspace.";

export const HELP_HUB_PAGE_SUBTITLE_SECURENOW =
  "Browse how-to guides, troubleshooting, and procurement orientation for SecureNow cloud evidence and findings work.";

export const HELP_HUB_BUYER_START_HERE_HELPER =
  "Search or browse guide topics below, then open a specialty guide when you need step-by-step workflow detail.";

export const HELP_HUB_BUYER_START_HERE_HELPER_SECURENOW =
  "Search or browse featured topics below, then open Getting started, Troubleshooting, or Security and trust when you need the next step.";

export function helpHubPageSubtitleBuyer(productLineId: ProductLineId = "architecture"): string {
  return productLineId === "security" ? HELP_HUB_PAGE_SUBTITLE_SECURENOW : HELP_HUB_PAGE_SUBTITLE_BUYER;
}

export function helpHubBuyerStartHereHelper(productLineId: ProductLineId = "architecture"): string {
  return productLineId === "security" ? HELP_HUB_BUYER_START_HERE_HELPER_SECURENOW : HELP_HUB_BUYER_START_HERE_HELPER;
}

export const HELP_HUB_ORIENTATION_BOTTOM_TEST_ID = "help-hub-orientation-bottom" as const;

export const HELP_HUB_FIRST_VIEWPORT_TEST_ID = "help-hub-first-viewport" as const;

export const HELP_HUB_BREADCRUMB_HUB_LABEL = "Welcome" as const;

export const HELP_HUB_BREADCRUMB_HUB_PATH = "/welcome" as const;

export const HELP_HUB_BREADCRUMB_TOPIC_TITLE = HELP_HUB_PAGE_TITLE;
