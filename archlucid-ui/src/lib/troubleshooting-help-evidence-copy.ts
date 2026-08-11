import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const TROUBLESHOOTING_HELP_CANONICAL_PATH = "/help/troubleshooting" as const;

export const TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE =
  "This troubleshooting guide helps architects unblock reviews and connections — it is not a signed-review diligence Sources package. Open System health or Audit when you need operational or governed trails.";

export const TROUBLESHOOTING_HELP_SOURCES_INTRO =
  "Use these follow-ups when a symptom needs live health checks, audit context, engineering runbooks, or product orientation.";


/** Operator Sources — no self-href to `/help/troubleshooting`. */
export const TROUBLESHOOTING_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Audit", href: "/governance/audit" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
] as const;
