import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const PROCUREMENT_HELP_CANONICAL_PATH = "/help/procurement" as const;

export const PROCUREMENT_HELP_CLAIM_DISCIPLINE =
  "This Procurement FAQ orients buyers and architects on diligence questions and pack requests — it is help orientation, not a CPA SOC 2 attestation, a published third-party pen-test report, or a signed-review diligence Sources package from your tenant. Open Assurance status, Trust Center, or settings Security & trust when you need live assurance surfaces or NDA request paths.";

export const PROCUREMENT_HELP_SOURCES_INTRO =
  "Use these follow-ups when procurement FAQ vocabulary turns into assurance hubs, isolation depth, or contract templates.";


/** Operator Sources — no self-href to `/help/procurement`. */
export const PROCUREMENT_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "DPA template", href: inAppHelpHref("dpa-template") },
  { label: "Settings Security & trust", href: "/administration/security-trust" },
] as const;
