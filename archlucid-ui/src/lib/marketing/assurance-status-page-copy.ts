import { assuranceStatusHeroSupporting } from "@/lib/security-trust-product-copy";

export const ASSURANCE_STATUS_PAGE_TITLE = "Assurance status" as const;

export const ASSURANCE_STATUS_PRIMARY_CONTENT_ID = "assurance-status-primary-content" as const;

export const ASSURANCE_STATUS_SKIP_LINK_LABEL = "Skip to assurance status content" as const;

export const ASSURANCE_STATUS_BREADCRUMB_HUB_LABEL = "Welcome" as const;

export const ASSURANCE_STATUS_BREADCRUMB_HUB_PATH = "/welcome" as const;

export const ASSURANCE_STATUS_BREADCRUMB_TOPIC_TITLE = ASSURANCE_STATUS_PAGE_TITLE;

/** Buyer-facing hero lead — product-line aware; use {@link assuranceStatusHeroSupporting}. */
export const ASSURANCE_STATUS_HERO_SUPPORTING = assuranceStatusHeroSupporting("architecture");
