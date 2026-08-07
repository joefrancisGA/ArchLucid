import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PROCUREMENT_HELP_CANONICAL_PATH = "/help/procurement" as const;

export const PROCUREMENT_HELP_CLAIM_DISCIPLINE =
  "This Procurement FAQ orients buyers and operators on diligence questions and pack requests — it is help orientation, not a CPA SOC 2 attestation, a published third-party pen-test report, or a signed-review diligence Sources package from your tenant. Open Assurance status, Trust Center, or settings Security & trust when you need live assurance surfaces or NDA request paths.";

export const PROCUREMENT_HELP_SOURCES_INTRO =
  "Use these follow-ups when procurement FAQ vocabulary turns into assurance hubs, isolation depth, or contract templates.";

export type ProcurementHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/procurement`. */
export const PROCUREMENT_HELP_SOURCES: readonly ProcurementHelpSourceLink[] = [
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "DPA template", href: inAppHelpHref("dpa-template") },
  { label: "Settings Security & trust", href: "/administration/security-trust" },
] as const;
