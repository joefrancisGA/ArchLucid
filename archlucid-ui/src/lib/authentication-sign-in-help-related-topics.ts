import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { SSO_WIZARD_PAGE_TITLE } from "@/lib/sso-wizard-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AUTHENTICATION_SIGN_IN_HELP_RELATED_HEADING = "Related" as const;

/** TB-1617: at most two product-safe related guides — no enterprise-onboarding checklist dump. */
export const AUTHENTICATION_SIGN_IN_HELP_RELATED_TOPICS: readonly EvidenceSourceLink[] = [
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Report a problem", href: inAppHelpHref("report-a-problem") },
] as const;

export const AUTHENTICATION_SIGN_IN_HELP_SSO_SETUP_LINK: EvidenceSourceLink = {
  label: SSO_WIZARD_PAGE_TITLE,
  href: "/administration/identity/sso-wizard",
};

export const AUTHENTICATION_SIGN_IN_HELP_BANNED_RELATED_HELP_SLUGS: readonly string[] = [
  "enterprise-onboarding",
] as const;

export function authenticationSignInHelpRelatedTopics(): readonly EvidenceSourceLink[] {
  return AUTHENTICATION_SIGN_IN_HELP_RELATED_TOPICS;
}

export function relatedTopicsContainBannedAuthenticationHelpSlug(
  topics: readonly EvidenceSourceLink[],
): boolean {
  return topics.some((topic) =>
    AUTHENTICATION_SIGN_IN_HELP_BANNED_RELATED_HELP_SLUGS.some((slug) => topic.href.includes(slug)),
  );
}
