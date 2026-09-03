import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const CONNECT_AWS_SECURELY_CANONICAL_PATH = "/help/cloud-connections/aws" as const;

export const CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL = "How AWS cloud connection works" as const;

export const CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE =
  "This guide explains how to attach AWS with OIDC-federated read-only IAM and Resource Explorer inventory — open Assurance status or Cloud connections for connector health or official materials.";

export const CONNECT_AWS_SECURELY_FOLLOW_UPS_TITLE = "Where to go next";

export const CONNECT_AWS_SECURELY_CLAIM_HEADING_ID = "help-cloud-connections-aws-claim-discipline-heading" as const;

export const CONNECT_AWS_SECURELY_SOURCES_INTRO =
  "Use these follow-ups when AWS setup needs the live hub, connection health, security orientation, or official assurance materials.";

/** Operator Sources — no self-href to `/help/cloud-connections/aws` or sibling cloud provider guides. */
export const CONNECT_AWS_SECURELY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "AWS connection settings", href: "/integrations/cloud-connections/aws" },
  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;

export { AWS_CLOUD_CONNECTION_BANNED_COPY as CONNECT_AWS_SECURELY_BANNED_COPY } from "@/lib/aws-cloud-connection-copy";
