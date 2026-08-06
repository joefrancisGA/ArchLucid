import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CONNECT_AZURE_SECURELY_CANONICAL_PATH = "/help/cloud-connections/azure" as const;

export const CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE =
  "This guide explains how to attach Azure with workload identity federation and read-only roles — it is connector setup orientation, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status or the live Cloud connections hub before treating setup guidance as assurance evidence.";

export const CONNECT_AZURE_SECURELY_SOURCES_INTRO =
  "Use these follow-ups when Azure setup needs the live hub, parent cloud-connections help, permissions detail, or assurance cites.";

export type ConnectAzureSecurelySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/cloud-connections/azure`. */
export const CONNECT_AZURE_SECURELY_SOURCES: readonly ConnectAzureSecurelySourceLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },
  { label: "Azure permissions guide", href: inAppHelpHref("azure-permissions") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
