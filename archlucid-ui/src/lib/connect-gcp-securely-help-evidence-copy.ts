import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONNECT_GCP_SECURELY_CANONICAL_PATH = "/help/cloud-connections/gcp" as const;

export const CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE =
  "This guide explains how to attach GCP with Workload Identity Federation and Cloud Asset Viewer scope — it is connector setup orientation, not a signed-review diligence Sources package. Open Assurance status or the live Cloud connections hub before treating setup guidance as assurance evidence.";

export const CONNECT_GCP_SECURELY_CONFIGURE_ACTION = "Open GCP connection settings" as const;

export const CONNECT_GCP_SECURELY_CONFIGURE_HREF = "/integrations/cloud-connections/gcp" as const;

export const CONNECT_GCP_SECURELY_SOURCES_INTRO =
  "Use these follow-ups when GCP setup needs the live hub, sibling cloud guides, or assurance cites.";

export type ConnectGcpSecurelySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/cloud-connections/gcp`. */
export const CONNECT_GCP_SECURELY_SOURCES: readonly ConnectGcpSecurelySourceLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "GCP connection settings", href: CONNECT_GCP_SECURELY_CONFIGURE_HREF },
  { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
  { label: "Connect AWS securely", href: inAppHelpHref("cloud-connections-aws") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
