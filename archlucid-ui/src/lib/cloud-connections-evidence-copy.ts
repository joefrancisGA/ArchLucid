import { SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

import {

  HUB_SECONDARY_FOLLOW_UPS_TITLES,

  hubSecondaryFollowUpsIntro,

} from "@/lib/evidence-orientation/hub-secondary-follow-ups";



export const CLOUD_CONNECTIONS_CANONICAL_PATH = "/integrations/cloud-connections" as const;



export const CLOUD_CONNECTIONS_HELP_TOPIC_LABEL = "How cloud connections work" as const;

export const CLOUD_CONNECTIONS_CLAIM_DISCIPLINE =
  "This cloud connections hub configures optional read-only inventory connectors — connector setup only, not a sealed review record or audit export by itself.";

export const CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.cloudConnections;



export const CLOUD_CONNECTIONS_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "you need Connection status, cloud connections help, or How ArchLucid works after choosing a cloud provider above",
);



/** Operator Sources — no self-href to the cloud-connections landing page. */

export const CLOUD_CONNECTIONS_SOURCES: readonly EvidenceSourceLink[] = [

  { label: "Connection status", href: "/administration/connection-status" },

  { label: "Start an evidence-only review", href: "/architecture/reviews/new" },

  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },

  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },

] as const;

export const SECURENOW_CLOUD_CONNECTIONS_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "you need Connection status, Extract and upload, or cloud connections help after configuring Azure above",
);

export const SECURENOW_CLOUD_CONNECTIONS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Extract and upload", href: SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH },
  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;

export function resolveCloudConnectionsSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId) ? SECURENOW_CLOUD_CONNECTIONS_SOURCES_INTRO : CLOUD_CONNECTIONS_SOURCES_INTRO;
}

export function resolveCloudConnectionsSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId) ? SECURENOW_CLOUD_CONNECTIONS_SOURCES : CLOUD_CONNECTIONS_SOURCES;
}

