import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { SECURENOW_AUDIT_EVIDENCE_PATH } from "@/lib/audit-evidence-lineage-route";
import { SECURENOW_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { isSecureNowProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";

export const ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH = "/help/enterprise-onboarding" as const;

export const ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL = "How enterprise onboarding works" as const;

export const ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const ENTERPRISE_ONBOARDING_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const ENTERPRISE_ONBOARDING_HELP_CLAIM_HEADING_ID =
  "help-enterprise-onboarding-claim-discipline-heading" as const;

export const ENTERPRISE_ONBOARDING_HELP_RELATED_PAGES_TITLE = "Related setup and trust pages";

export const ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE =
  "This checklist orients architects on SSO, identity, and hosted tenant setup — open Identity providers, Security and trust, or Audit when you need live evidence trails or approval records.";

export const SECURENOW_ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE =
  "This checklist orients tenant administrators on SSO, roles, and SecureNow evidence intake — open Identity providers, Security and trust, or Audit evidence lineage when you need live directory or sealed evidence records.";

export const ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO =
  "Use these follow-ups when onboarding checklist steps turn into identity setup, roles, cloud attachment, or assurance orientation.";

export const SECURENOW_ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO =
  "Use these follow-ups when onboarding checklist steps turn into identity setup, roles, Azure or inventory intake, or assurance orientation.";

/** Operator Sources - no self-href to `/help/enterprise-onboarding`. */
export const ENTERPRISE_ONBOARDING_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Identity providers", href: "/administration/identity-providers" },
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Assurance status", href: "/assurance-status" },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;

export const SECURENOW_ENTERPRISE_ONBOARDING_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Identity providers", href: "/administration/identity-providers" },
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Policy packs", href: SECURENOW_POLICY_PACKS_PATH },
  { label: "Extract and upload", href: SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH },
  { label: "Audit evidence lineage", href: SECURENOW_AUDIT_EVIDENCE_PATH },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
] as const;

export function resolveEnterpriseOnboardingHelpClaimDiscipline(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE
    : ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE;
}

export function resolveEnterpriseOnboardingHelpSourcesIntro(productLineId: ProductLineId = "architecture"): string {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO
    : ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO;
}

export function resolveEnterpriseOnboardingHelpSources(
  productLineId: ProductLineId = "architecture",
): readonly EvidenceSourceLink[] {
  return isSecureNowProductLine(productLineId)
    ? SECURENOW_ENTERPRISE_ONBOARDING_HELP_SOURCES
    : ENTERPRISE_ONBOARDING_HELP_SOURCES;
}
