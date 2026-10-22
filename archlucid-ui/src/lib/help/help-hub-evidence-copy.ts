import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export const HELP_HUB_CANONICAL_PATH = "/help" as const;

export const HELP_HUB_HELP_TOPIC_LABEL = "Help" as const;

/** Breadcrumb ancestor label for `/help/*` topic pages. */
export const HELP_TOPIC_BREADCRUMB_HUB_LABEL = "Help & Support" as const;

export const HELP_HUB_CLAIM_DISCIPLINE_HEADING = "What Help Center is not";

export const HELP_HUB_FOLLOW_UPS_TITLE = "Where to go next";

export const HELP_HUB_CLAIM_DISCIPLINE =
 "Help Center orients you to guides and documentation — not a full audit export. Open a specialty guide, Audit, or Assurance status when you need official records.";

export const HELP_HUB_CLAIM_DISCIPLINE_SECURENOW =
  "Help Center orients you to SecureNow guides and documentation — not a full audit export. Open a specialty guide, Audit evidence lineage, or Assurance status when you need official records.";

export const HELP_HUB_SOURCES_INTRO =
 "Use these follow-ups when browsing Help turns into workflow orientation, assurance, or activity records.";

export const HELP_HUB_SOURCES_INTRO_SECURENOW =
  "Use these follow-ups when browsing Help turns into cloud evidence orientation, assurance, or audit lineage.";

export const HELP_HUB_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "browsing Help turns into workflow orientation, assurance, or activity records",
);


/** Operator Sources — no self-href to the Help hub. */
export const HELP_HUB_SOURCES: readonly EvidenceSourceLink[] = [
 { label: "Getting started", href: inAppHelpHref("getting-started") },
 { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
 { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
 { label: "Product FAQ", href: "/faq" },
 { label: "Assurance status", href: "/assurance-status" },
 { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
] as const;

export const HELP_HUB_SOURCES_SECURENOW: readonly EvidenceSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Findings", href: inAppHelpHref("findings") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Audit evidence lineage", href: SECURENOW_AUDIT_EVIDENCE_PATH },
] as const;

export function resolveHelpHubClaimDiscipline(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId) ? HELP_HUB_CLAIM_DISCIPLINE_SECURENOW : HELP_HUB_CLAIM_DISCIPLINE;
}

export function resolveHelpHubSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId) ? HELP_HUB_SOURCES_INTRO_SECURENOW : HELP_HUB_SOURCES_INTRO;
}

export function resolveHelpHubSources(productLineId: ProductLineId = "architecture"): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId) ? HELP_HUB_SOURCES_SECURENOW : HELP_HUB_SOURCES;
}

export function resolveHelpHubOrientationSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  if (isSecureNowProductLine(productLineId)) {
    return hubSecondaryFollowUpsIntro(
      "browsing Help turns into cloud evidence orientation, assurance, or audit lineage",
    );
  }

  return HELP_HUB_ORIENTATION_SOURCES_INTRO;
}

export function resolveHelpHubOrientationSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  const sources = resolveHelpHubSources(productLineId);

  return sources.filter((source) => !HELP_HUB_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href));
}

const HELP_HUB_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([HELP_HUB_CANONICAL_PATH]);

/** Operator orientation Sources — excludes self-href to `/help` (HEL). */
export const HELP_HUB_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = HELP_HUB_SOURCES.filter(
  (source) => !HELP_HUB_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
