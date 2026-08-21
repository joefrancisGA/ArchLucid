import { ACCOUNT_SECURITY_PATH } from "@/lib/account-route-paths";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const PREFERENCES_HELP_CANONICAL_PATH = "/help/preferences" as const;

export const PREFERENCES_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide does not cover";

export const PREFERENCES_HELP_CLAIM_DISCIPLINE =
  "This guide explains personal preferences — not a full audit export.";

export const PREFERENCES_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const PREFERENCES_HELP_SOURCES_INTRO =
  "Follow these links when personal theme settings lead to onboarding, account security, or official assurance materials.";

/** Operator follow-ups — no self-href to preferences. */
export const PREFERENCES_HELP_SOURCES: readonly EvidenceOrientationLink[] = [
  {
    label: "Getting started",
    href: inAppHelpHref("getting-started"),
    when: "Open onboarding help when first-review workflow is the blocker",
  },
  {
    label: "Sign-in methods",
    href: ACCOUNT_SECURITY_PATH,
    when: "Open account security when sign-in controls need attention",
  },
  {
    label: "How ArchLucid works",
    href: inAppHelpHref("getting-started", "how-archlucid-works"),
    when: "Read product orientation when preferences are not the primary question",
  },
  {
    label: "Assurance status",
    href: "/assurance-status",
    when: "Open assurance status when official materials are needed for procurement",
  },
] as const;
