import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_SECURITY_TRUST_PATH } from "@/lib/settings-admin-route-paths";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SETTINGS_SECURITY_TRUST_CANONICAL_PATH = SETTINGS_SECURITY_TRUST_PATH;

export const SETTINGS_SECURITY_TRUST_CLAIM_DISCIPLINE =
  "This settings page lists procurement-oriented security and trust materials for the workspace — it is architect orientation, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status, Trust Center, or Audit when you need live assurance surfaces or governed trails.";

export const SETTINGS_SECURITY_TRUST_SOURCES_INTRO =
  "Use these follow-ups when procurement vocabulary turns into public assurance hubs, isolation depth, or audit activity.";


/** Operator Sources — no self-href to settings security-trust. */
export const SETTINGS_SECURITY_TRUST_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Data handling & isolation", href: inAppHelpHref("data-handling") },
  { label: "Audit", href: "/governance/audit" },
] as const;
