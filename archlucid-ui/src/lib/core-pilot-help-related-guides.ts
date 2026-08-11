import {
  CORE_PILOT_HELP_SOURCES,
} from "@/lib/core-pilot-help-evidence-copy";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  CORE_PILOT_HELP_DEPTH_GUIDES,
  CORE_PILOT_HELP_PRIMARY_ACTIONS,
} from "@/lib/core-pilot-help-guide-content";

/**
 * Hrefs already reachable from a page CTA or the adjacent troubleshooting line.
 * Repeating them is what made the former top-of-page Sources strip read as a link farm.
 */
function alreadyLinkedOnPageHrefs(): ReadonlySet<string> {
  return new Set<string>([
    CORE_PILOT_HELP_PRIMARY_ACTIONS.startReview.href,
    CORE_PILOT_HELP_PRIMARY_ACTIONS.troubleshooting.href,
  ]);
}

function isNewFollowUp(source: EvidenceSourceLink, linkedHrefs: ReadonlySet<string>): boolean {
  return !linkedHrefs.has(source.href);
}

/**
 * Related guides for `/help/first-architecture-review`: curated depth guides first, then any
 * follow-up Source the page does not already link. Deduped by href so the curated label wins.
 */
export function corePilotHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  const linkedHrefs = new Set<string>([
    ...alreadyLinkedOnPageHrefs(),
    ...CORE_PILOT_HELP_DEPTH_GUIDES.map((guide) => guide.href),
  ]);

  const followUps = CORE_PILOT_HELP_SOURCES.filter((source) => isNewFollowUp(source, linkedHrefs));

  return [...CORE_PILOT_HELP_DEPTH_GUIDES, ...followUps];
}
