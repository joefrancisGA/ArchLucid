import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { hubSecondaryFollowUpsIntro } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const API_KEYS_HELP_CANONICAL_PATH = "/help/api-keys" as const;

export const API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide is not";

export const API_KEYS_HELP_CLAIM_DISCIPLINE =
  "This guide is not where procurement goes for finalized review record citations. Open Assurance status when diligence needs citations beyond this orientation.";

export const API_KEYS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const API_KEYS_HELP_SOURCES_INTRO =
  "Use these follow-ups when automation credential questions need membership guidance or trust citations.";

export const API_KEYS_HELP_ORIENTATION_SOURCES_INTRO = hubSecondaryFollowUpsIntro(
  "automation credential questions need membership guidance or trust citations",
);

/** Help Sources — excludes action-panel destinations (Users and roles, CLI usage help, Audit). */
export const API_KEYS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "Assurance status", href: "/assurance-status" },
] as const;

const API_KEYS_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS = new Set<string>([API_KEYS_HELP_CANONICAL_PATH]);

/** Help orientation Sources — excludes self-href to `/help/api-keys` (HEP). */
export const API_KEYS_HELP_ORIENTATION_SOURCES: readonly EvidenceSourceLink[] = API_KEYS_HELP_SOURCES.filter(
  (source) => !API_KEYS_HELP_EXCLUDED_ORIENTATION_SOURCE_HREFS.has(source.href),
);
