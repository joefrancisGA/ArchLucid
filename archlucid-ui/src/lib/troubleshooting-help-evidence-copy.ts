import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import {
  SUPPORT_BUNDLE_EXCLUDED_ITEMS,
  SUPPORT_BUNDLE_INCLUDED_ITEMS,
  SUPPORT_BUNDLE_SAFETY_SUMMARY,
} from "@/lib/support-workspace-present";

export const TROUBLESHOOTING_HELP_CANONICAL_PATH = "/help/troubleshooting" as const;

export const TROUBLESHOOTING_HELP_TOPIC_LABEL = "How troubleshooting works" as const;

export const TROUBLESHOOTING_HELP_LAST_REVIEWED = "2026-08-11" as const;

export const TROUBLESHOOTING_HELP_LAST_REVIEWED_LABEL =
  `Last reviewed ${TROUBLESHOOTING_HELP_LAST_REVIEWED}` as const;

export const TROUBLESHOOTING_HELP_APPLICABILITY =
  "Applies to the current ArchLucid operator workspace build. Guidance describes buyer-facing review, sign-in, and export symptoms — not engineering runbooks.";

export const SECURENOW_TROUBLESHOOTING_HELP_APPLICABILITY =
  "Applies to the current SecureNow operator workspace build. Guidance describes sign-in, Azure connector, inventory, and findings export symptoms — not engineering runbooks.";

export const TROUBLESHOOTING_HELP_RELATED_TITLE = "Live checks and follow-ups" as const;

export const TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const TROUBLESHOOTING_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE =
  "This guide helps architects unblock reviews and connections — open System health or Audit when you need operational status or activity records.";

export const SECURENOW_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE =
  "This guide helps security operators unblock sign-in, connectors, and findings exports — open System health or Audit evidence lineage when you need operational status or sealed evidence records.";

export const TROUBLESHOOTING_HELP_CLAIM_HEADING_ID = "help-troubleshooting-claim-discipline-heading" as const;

export const TROUBLESHOOTING_HELP_SOURCES_INTRO =
  "Use these follow-ups when a symptom needs live health checks, audit context, or product orientation.";

export const SECURENOW_TROUBLESHOOTING_HELP_SOURCES_INTRO =
  "Use these follow-ups when a symptom needs live health checks, audit lineage, or SecureNow orientation.";

export { TROUBLESHOOTING_SUPPORT_EXPECTATIONS } from "@/lib/support-workspace-present";

export const TROUBLESHOOTING_SUPPORT_BUNDLE_DISCLOSURE =
  `${SUPPORT_BUNDLE_SAFETY_SUMMARY} Includes: ${SUPPORT_BUNDLE_INCLUDED_ITEMS.join(", ")}. Excludes: ${SUPPORT_BUNDLE_EXCLUDED_ITEMS.join(", ")}. The ZIP stays on your device until you attach or email it.`;

/** Operator follow-ups — no self-href to `/help/troubleshooting`. */
export const TROUBLESHOOTING_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Audit", href: GOVERNANCE_AUDIT_PATH },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
] as const;

export const SECURENOW_TROUBLESHOOTING_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "System health", href: "/administration/system-health" },
  { label: "Audit evidence lineage", href: SECURENOW_AUDIT_EVIDENCE_PATH },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Azure connections", href: inAppHelpHref("cloud-connections") },
  { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
] as const;

export function resolveTroubleshootingHelpClaimDiscipline(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE
    : TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE;
}

export function resolveTroubleshootingHelpApplicability(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_TROUBLESHOOTING_HELP_APPLICABILITY
    : TROUBLESHOOTING_HELP_APPLICABILITY;
}

export function resolveTroubleshootingHelpSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_TROUBLESHOOTING_HELP_SOURCES_INTRO
    : TROUBLESHOOTING_HELP_SOURCES_INTRO;
}

export function resolveTroubleshootingHelpSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_TROUBLESHOOTING_HELP_SOURCES
    : TROUBLESHOOTING_HELP_SOURCES;
}
