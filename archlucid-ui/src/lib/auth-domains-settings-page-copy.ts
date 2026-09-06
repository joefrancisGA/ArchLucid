export const AUTH_DOMAINS_SETTINGS_PRIMARY_CONTENT_ID = "auth-domains-primary-content" as const;

export const AUTH_DOMAINS_SETTINGS_FIRST_VIEWPORT_TEST_ID = "auth-domains-first-viewport" as const;

export const AUTH_DOMAINS_SETTINGS_SKIP_TARGET_ID = AUTH_DOMAINS_SETTINGS_FIRST_VIEWPORT_TEST_ID;

export const AUTH_DOMAINS_SETTINGS_SKIP_LINK_LABEL = "Skip to sign-in domain workflow" as const;

export const AUTH_DOMAINS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "auth-domains-header-claim-discipline" as const;

export const AUTH_DOMAINS_PAGE_SUBTITLE_OPERATOR =
  "Verify email domain ownership, test routing, and enable SSO enforcement for this tenant." as const;

export const AUTH_DOMAINS_PAGE_SUBTITLE_BUYER =
  "Add and verify an email domain, test SSO routing, then enable enforcement when your organization is ready." as const;

export const AUTH_DOMAINS_SETTINGS_PAGE_LEAD =
  "Track verified email domains, DNS checks, routing tests, and SSO enforcement posture for this tenant." as const;

export const AUTH_DOMAINS_SETTINGS_START_HERE_CARD_TITLE = "Start here" as const;

export const AUTH_DOMAINS_SETTINGS_BUYER_START_HERE_HELPER =
  "Walk the four-step workflow below. Adding domains or changing enforcement requires Admin authority in this workspace." as const;

export function authDomainsPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? AUTH_DOMAINS_PAGE_SUBTITLE_BUYER : AUTH_DOMAINS_PAGE_SUBTITLE_OPERATOR;
}
