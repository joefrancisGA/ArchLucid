import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { CONFIGURATION_REFERENCE_HELP_JOB_MATRIX } from "@/lib/configuration-reference-help-ia-dual";

export const CONFIGURATION_REFERENCE_HELP_RELATED_TEST_ID =
  "help-configuration-reference-related-help";

/** @deprecated Related guides merged into {@link CONFIGURATION_REFERENCE_HELP_JOB_MATRIX}. */
export const CONFIGURATION_REFERENCE_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] =
  CONFIGURATION_REFERENCE_HELP_JOB_MATRIX
    .filter((row) => row.isCurrent !== true && row.href !== undefined)
    .map((row) => ({ label: row.label, href: row.href! }));

/** @deprecated Merged into {@link CONFIGURATION_REFERENCE_HELP_JOB_MATRIX} — kept for inbound link guards. */
export function configurationReferenceHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return CONFIGURATION_REFERENCE_HELP_RELATED_GUIDES;
}
