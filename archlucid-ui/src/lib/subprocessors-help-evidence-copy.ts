import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const SUBPROCESSORS_HELP_CANONICAL_PATH = "/help/subprocessors" as const;

export const SUBPROCESSORS_HELP_CLAIM_DISCIPLINE =
  "This Subprocessors register orients buyers and operators on hosted-service processors — it is help orientation, not a CPA SOC 2 attestation, a published third-party pen-test report, or a countersigned DPA. Open the DPA template or Security and trust when you need procurement or assurance materials.";

export const SUBPROCESSORS_HELP_SOURCES_INTRO =
  "Use these follow-ups when subprocessor vocabulary turns into DPA negotiation, trust-center materials, or data-handling diligence.";

export type SubprocessorsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/subprocessors`. */
export const SUBPROCESSORS_HELP_SOURCES: readonly SubprocessorsHelpSourceLink[] = [
  { label: "DPA template", href: inAppHelpHref("dpa-template") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "Data handling", href: inAppHelpHref("data-handling") },
  { label: "Tenant isolation", href: inAppHelpHref("data-handling-tenant-isolation") },
  { label: "Procurement", href: inAppHelpHref("procurement") },
] as const;
