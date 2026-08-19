import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const CONNECT_GCP_SECURELY_CANONICAL_PATH = "/help/cloud-connections/gcp" as const;

export const CONNECT_GCP_SECURELY_HELP_TOPIC_LABEL = "How GCP cloud connection works" as const;

export const CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const CONNECT_GCP_SECURELY_CLAIM_HEADING_ID = "connect-gcp-securely-help-claim-discipline-heading" as const;

export const CONNECT_GCP_SECURELY_FOLLOW_UPS_TITLE = "Where to go next";

export const CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE =
  "This guide explains how to attach GCP with Workload Identity Federation and Cloud Asset Viewer scope — it is connector setup orientation, not a sealed-review diligence Sources package. Open Assurance status or the live Cloud connections hub before treating setup guidance as assurance evidence.";

export const CONNECT_GCP_SECURELY_CONFIGURE_ACTION = "Open GCP connection settings" as const;

export const CONNECT_GCP_SECURELY_CONFIGURE_HREF = "/integrations/cloud-connections/gcp" as const;

export const CONNECT_GCP_SECURELY_SOURCES_INTRO =
  "Use these follow-ups when GCP setup needs the live hub, sibling cloud guides, or assurance cites.";


/** Operator Sources — no self-href to `/help/cloud-connections/gcp`. */
export const CONNECT_GCP_SECURELY_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "GCP connection settings", href: CONNECT_GCP_SECURELY_CONFIGURE_HREF },
  { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
  { label: "Connect AWS securely", href: inAppHelpHref("cloud-connections-aws") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
