import { inAppHelpHref } from "@/lib/product-documentation-registry";

import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

import {

  HUB_SECONDARY_FOLLOW_UPS_TITLES,

  hubSecondaryFollowUpsIntro,

} from "@/lib/evidence-orientation/hub-secondary-follow-ups";



export const CLOUD_CONNECTIONS_CANONICAL_PATH = "/integrations/cloud-connections" as const;



export const CLOUD_CONNECTIONS_HELP_TOPIC_LABEL = "How cloud connections work" as const;



export const CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE = HUB_SECONDARY_FOLLOW_UPS_TITLES.cloudConnections;



export const CLOUD_CONNECTIONS_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "you need Connection status, provider help, or How ArchLucid works after choosing a cloud provider above",
);



/** Operator Sources — no self-href to the cloud-connections landing page. */

export const CLOUD_CONNECTIONS_SOURCES: readonly EvidenceSourceLink[] = [

  { label: "Connection status", href: "/administration/connection-status" },

  { label: "Start an evidence-only review", href: "/architecture/reviews/new" },

  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },

  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },

] as const;

