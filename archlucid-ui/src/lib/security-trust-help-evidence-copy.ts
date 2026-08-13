import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF } from "@/lib/trust-center-public-assurance";

export const SECURITY_TRUST_HELP_CANONICAL_PATH = "/help/security-trust" as const;

export const SECURITY_TRUST_HELP_TOPIC_LABEL = "How security and trust work" as const;

export const SECURITY_TRUST_HELP_CLAIM_DISCIPLINE =
  "This Security and trust help topic orients architects and buyers on the assurance ladder, data handling, and diligence materials — it is help orientation, not a CPA SOC 2 attestation, a published third-party pen-test report, or a signed-review diligence Sources package from your tenant. Open Assurance status or Trust Center when you need public assurance surfaces or downloadable packs.";

export const SECURITY_TRUST_HELP_SOURCES_INTRO =
  "Use these follow-ups when help vocabulary turns into live assurance hubs, isolation depth, or procurement orientation.";

export const SECURITY_TRUST_HELP_PRIMARY_ACTION = {
  label: "Download evidence pack",
  href: TRUST_CENTER_EVIDENCE_PACK_ZIP_HREF,
  testId: "help-security-trust-primary-action",
} as const;

/** Operator Sources — no self-href to `/help/security-trust`. */
export const SECURITY_TRUST_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Data handling & isolation", href: inAppHelpHref("data-handling") },
  { label: "SOC 2 self-assessment", href: inAppHelpHref("soc2-self-assessment") },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
] as const;
