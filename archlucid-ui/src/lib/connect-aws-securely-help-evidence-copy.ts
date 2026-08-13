import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const CONNECT_AWS_SECURELY_CANONICAL_PATH = "/help/cloud-connections/aws" as const;

export const CONNECT_AWS_SECURELY_HELP_TOPIC_LABEL = "How AWS cloud connection works" as const;

export const CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE =
  "This guide explains how to attach AWS with OIDC-federated read-only IAM and Resource Explorer inventory — it is connector setup orientation, not a signed-review diligence Sources package. Open Assurance status or the live Cloud connections hub before treating setup guidance as assurance evidence.";

export const CONNECT_AWS_SECURELY_SOURCES_INTRO =
  "Use these follow-ups when AWS setup needs the live hub, parent cloud-connections help, sibling cloud guides, or assurance cites.";


/** Operator Sources — no self-href to `/help/cloud-connections/aws`. */
export const CONNECT_AWS_SECURELY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "AWS connection settings", href: "/integrations/cloud-connections/aws" },
  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },
  { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
  { label: "Connect GCP securely", href: inAppHelpHref("cloud-connections-gcp") },
  { label: "Assurance status", href: "/security-trust" },
] as const;

export { AWS_CLOUD_CONNECTION_BANNED_COPY as CONNECT_AWS_SECURELY_BANNED_COPY } from "@/lib/aws-cloud-connection-copy";
