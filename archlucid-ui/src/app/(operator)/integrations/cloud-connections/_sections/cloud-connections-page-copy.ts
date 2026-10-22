import {
  CLOUD_CONNECTIONS_PAGE_SUBTITLE,
} from "@/lib/cloud-connections-copy";

export const CLOUD_CONNECTIONS_PAGE_PRIMARY_CONTENT_ID = "cloud-connections-primary-content" as const;

export const CLOUD_CONNECTIONS_PAGE_FIRST_VIEWPORT_TEST_ID = "cloud-connections-first-viewport" as const;

export const CLOUD_CONNECTIONS_PAGE_SKIP_TARGET_ID = CLOUD_CONNECTIONS_PAGE_FIRST_VIEWPORT_TEST_ID;

export const CLOUD_CONNECTIONS_PAGE_SKIP_LINK_LABEL = "Skip to cloud connection options" as const;

export const CLOUD_CONNECTIONS_PAGE_HEADER_CLAIM_DISCIPLINE_TEST_ID =
  "cloud-connections-header-claim-discipline" as const;

export const CLOUD_CONNECTIONS_PAGE_SUBTITLE_BUYER =
  "Connect read-only cloud inventory or start an evidence-only review — cloud connectors are optional." as const;

export function cloudConnectionsPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? CLOUD_CONNECTIONS_PAGE_SUBTITLE_BUYER : CLOUD_CONNECTIONS_PAGE_SUBTITLE;
}

export const CLOUD_CONNECTIONS_START_HERE_CARD_TITLE = "Start here" as const;

export const CLOUD_CONNECTIONS_START_HERE_LEAD =
  "Open a provider card below to configure read-only federation, or use Connection status when you need readiness across all integrations." as const;
