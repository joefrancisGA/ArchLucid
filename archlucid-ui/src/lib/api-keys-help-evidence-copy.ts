import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { API_KEYS_SETTINGS_SOURCES } from "@/lib/api-keys-settings-evidence-copy";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";

export const API_KEYS_HELP_CANONICAL_PATH = "/help/api-keys" as const;

export const API_KEYS_HELP_CLAIM_DISCIPLINE =
  `API key management is not available in this release — host automation credentials live in deployment configuration and people access is governed under Users and roles. This guide is not the ${HELP_DILIGENCE_ARTIFACT_INDEX_TITLE} for a signed review record. Open Assurance status, Audit, or CLI usage help when diligence needs citations beyond this orientation.`;

export const API_KEYS_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const API_KEYS_HELP_SOURCES_INTRO =
  "Use these follow-ups when automation credential questions turn into membership setup, scripting guidance, audit trails, or trust citations.";

/** Operator Sources — reuses settings band links (no self-href to retired `/administration/api-keys`). */
export const API_KEYS_HELP_SOURCES: readonly EvidenceSourceLink[] = API_KEYS_SETTINGS_SOURCES;
