export const ADMINISTRATION_CONNECTION_STATUS_PRIMARY_CONTENT_ID =
  "connection-status-primary-content" as const;

export const ADMINISTRATION_CONNECTION_STATUS_FIRST_VIEWPORT_TEST_ID =
  "connection-status-first-viewport" as const;

export const ADMINISTRATION_CONNECTION_STATUS_SKIP_TARGET_ID =
  ADMINISTRATION_CONNECTION_STATUS_FIRST_VIEWPORT_TEST_ID;

export const ADMINISTRATION_CONNECTION_STATUS_SKIP_LINK_LABEL =
  "Skip to integration readiness" as const;

export const ADMINISTRATION_CONNECTION_STATUS_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "connection-status-header-claim-discipline" as const;

export const ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_OPERATOR =
  "See which integrations are ready, recommended, or optional for this workspace — and what to configure first." as const;

export const ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_BUYER =
  "Scan connector readiness for this workspace, then open the integration that still needs setup." as const;

export const ADMINISTRATION_CONNECTION_STATUS_PAGE_LEAD =
  "See which integrations are ready, recommended, or optional for this workspace — and what still needs configuration." as const;

export const ADMINISTRATION_CONNECTION_STATUS_START_HERE_CARD_TITLE = "Start here" as const;

export const ADMINISTRATION_CONNECTION_STATUS_BUYER_START_HERE_HELPER =
  "Use the readiness summary and category filters below to scan connector posture. Setup actions open the matching integration workspace." as const;

export function administrationConnectionStatusPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell
    ? ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_BUYER
    : ADMINISTRATION_CONNECTION_STATUS_PAGE_SUBTITLE_OPERATOR;
}
