import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const CONNECT_GCP_SECURELY_CANONICAL_PATH = "/help/cloud-connections/gcp" as const;

export const CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL = "How GCP cloud connection works" as const;

export const CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const CONNECT_GCP_SECURELY_CLAIM_HEADING_ID = "connect-gcp-securely-help-claim-discipline-heading" as const;

export const CONNECT_GCP_SECURELY_FOLLOW_UPS_TITLE = "Where to go next";

export const CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE =
  "This guide explains how to connect GCP read-only inventory — setup help only, not proof for auditors. Open Assurance status or the Cloud connections hub before treating setup guidance as security evidence.";

export const CONNECT_GCP_SECURELY_CONFIGURE_ACTION = "Open GCP connection settings" as const;

export const CONNECT_GCP_SECURELY_CONFIGURE_HREF = "/integrations/cloud-connections/gcp" as const;

export const CONNECT_GCP_SECURELY_SOURCES_INTRO =
  "Use these follow-ups when GCP setup needs the live hub, connection health, security orientation, or official assurance materials.";

/** Operator Sources — no self-href to `/help/cloud-connections/gcp` or sibling cloud provider guides. */
export const CONNECT_GCP_SECURELY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "GCP connection settings", href: CONNECT_GCP_SECURELY_CONFIGURE_HREF },
  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
