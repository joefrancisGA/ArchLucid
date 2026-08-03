import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SYSTEM_HEALTH_CLAIM_DISCIPLINE =
  "Live/ready checks and build identity describe this workspace’s operational readiness — not a signed-review diligence Sources trail. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const SYSTEM_HEALTH_SOURCES_INTRO =
  "Open connection status or troubleshooting when a dependency fails; digests and audits are separate operator jobs.";

export type SystemHealthSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to system-health. */
export const SYSTEM_HEALTH_SOURCES: readonly SystemHealthSourceLink[] = [
  { label: "Connection status", href: "/administration/connection-status" },
  { label: "Architecture digests", href: "/digests" },
  { label: "Governance audit", href: "/governance/audit" },
  { label: "Troubleshooting help", href: inAppHelpHref("troubleshooting") },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;

export const SYSTEM_HEALTH_CANONICAL_PATH = "/administration/system-health" as const;
