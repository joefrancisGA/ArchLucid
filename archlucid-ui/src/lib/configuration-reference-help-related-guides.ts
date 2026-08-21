import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { API_CONTRACTS_HELP_TOPIC_LABEL } from "@/lib/api-contracts-help-guide-content";
import { AUTHENTICATION_SIGN_IN_HELP_TOPIC_LABEL } from "@/lib/authentication-sign-in-help-evidence-copy";
import { ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL } from "@/lib/enterprise-onboarding-help-evidence-copy";
import { resolveRelatedFollowUpsTitle } from "@/lib/help/related-follow-ups-title";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** TB-2272 — at most three related diligence guides for the configuration reference job. */
export const CONFIGURATION_REFERENCE_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL, href: inAppHelpHref("enterprise-onboarding") },
  { label: API_CONTRACTS_HELP_TOPIC_LABEL, href: inAppHelpHref("api-contracts") },
  { label: AUTHENTICATION_SIGN_IN_HELP_TOPIC_LABEL, href: inAppHelpHref("authentication-sign-in") },
] as const;

export const CONFIGURATION_REFERENCE_HELP_RELATED_HEADING = resolveRelatedFollowUpsTitle(
  CONFIGURATION_REFERENCE_HELP_RELATED_GUIDES,
);

export const CONFIGURATION_REFERENCE_HELP_RELATED_TEST_ID =
  "help-configuration-reference-related-help";

/** Related guides for `/help/configuration-reference`. */
export function configurationReferenceHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return CONFIGURATION_REFERENCE_HELP_RELATED_GUIDES;
}
