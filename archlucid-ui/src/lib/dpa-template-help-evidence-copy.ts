import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { DPA_TEMPLATE_HELP_PATH } from "@/lib/dpa-template-help-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DPA_TEMPLATE_HELP_CANONICAL_PATH = DPA_TEMPLATE_HELP_PATH;

export const DPA_TEMPLATE_HELP_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const DPA_TEMPLATE_HELP_SOURCES_INTRO =
  "Use these follow-ups when counsel needs isolation depth or assurance cites beyond this negotiation template.";

/** Operator Sources — excludes first-viewport CTAs (Trust Center, Subprocessors, Procurement FAQ). */
export const DPA_TEMPLATE_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Data handling and tenant isolation", href: inAppHelpHref("data-handling") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
