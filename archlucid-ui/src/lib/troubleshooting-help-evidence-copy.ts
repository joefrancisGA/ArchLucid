import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const TROUBLESHOOTING_HELP_CANONICAL_PATH = "/help/troubleshooting" as const;

export const TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE =
  "This troubleshooting guide helps operators unblock reviews and connections — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open System health or Audit when you need operational or governed trails.";

export const TROUBLESHOOTING_HELP_SOURCES_INTRO =
  "Use these follow-ups when a symptom needs live health checks, audit context, engineering runbooks, or product orientation.";

export type TroubleshootingHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/troubleshooting`. */
export const TROUBLESHOOTING_HELP_SOURCES: readonly TroubleshootingHelpSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
  { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
] as const;
