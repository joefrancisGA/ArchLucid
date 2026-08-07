import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CLOUD_CONNECTIONS_CANONICAL_PATH = "/integrations/cloud-connections" as const;

export const CLOUD_CONNECTIONS_CLAIM_DISCIPLINE =
  "Provider status tiles and evidence-only upload summarize connection readiness for read-only collection — they are not a signed-review diligence Sources package by themselves. Open Connection status or a provider guide before treating inventory as authoritative. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const CLOUD_CONNECTIONS_SOURCES_INTRO =
  "Pick a cloud provider or evidence-only upload below, then use Connection status, provider help, or How ArchLucid works when you need orientation before production collection.";

export type CloudConnectionsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to the cloud-connections landing page. */
export const CLOUD_CONNECTIONS_SOURCES: readonly CloudConnectionsSourceLink[] = [
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Start an evidence-only review", href: "/architecture/reviews/new" },
  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },
  { label: "Azure permissions", href: inAppHelpHref("azure-permissions") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;
