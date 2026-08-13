import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const ENTERPRISE_ONBOARDING_HELP_CANONICAL_PATH = "/help/enterprise-onboarding" as const;

export const ENTERPRISE_ONBOARDING_HELP_TOPIC_LABEL = "How enterprise onboarding works" as const;

export const ENTERPRISE_ONBOARDING_HELP_RELATED_PAGES_TITLE = "Related setup and trust pages";

export const ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE =
  "This enterprise onboarding checklist orients architects on SSO, identity, and hosted tenant setup — it is not a signed review record. Open Identity providers, Security and trust, or Audit when you need live evidence trails or governance approval records.";

export const ENTERPRISE_ONBOARDING_HELP_SOURCES_INTRO =
  "Use these follow-ups when onboarding checklist steps turn into identity setup, roles, cloud attachment, or assurance orientation.";


/** Operator Sources - no self-href to `/help/enterprise-onboarding`. */
export const ENTERPRISE_ONBOARDING_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Identity providers", href: "/administration/identity-providers" },
  { label: "Users and roles", href: inAppHelpHref("users-and-roles") },
  { label: "Security and trust help", href: inAppHelpHref("security-trust") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Cloud connections", href: "/integrations/cloud-connections" },
  { label: "Getting started", href: inAppHelpHref("getting-started") },
] as const;
