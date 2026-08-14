import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const API_KEYS_HELP_CANONICAL_PATH = "/help/api-keys" as const;

export const API_KEYS_HELP_CLAIM_DISCIPLINE_HEADING = "What this guide is not";

export const API_KEYS_HELP_CLAIM_DISCIPLINE =
  `This guide is not the ${HELP_DILIGENCE_ARTIFACT_INDEX_TITLE} for a signed review record. Open Assurance status when diligence needs citations beyond this orientation.`;

export const API_KEYS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const API_KEYS_HELP_SOURCES_INTRO =
  "Use these follow-ups when automation credential questions need membership guidance or trust citations.";

/** Help Sources — excludes action-panel destinations (Users and roles, CLI usage help, Audit). */
export const API_KEYS_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Users and roles help", href: inAppHelpHref("users-and-roles") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
