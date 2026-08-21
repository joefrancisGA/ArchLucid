import type { EvidenceOrientationSourcesLayout } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import {
  RELATED_GUIDES_FOLLOW_UPS_TITLE,
  RELATED_RESOURCES_FOLLOW_UPS_TITLE,
  isHelpOnlyRelatedFollowUpsTitle,
} from "@/lib/help/related-follow-ups-title";

/** Two-column follow-up index beside intro — default for Where to go next strips. */
export const WHERE_TO_GO_NEXT_SOURCES_LAYOUT: EvidenceOrientationSourcesLayout = "columns";

/** Hub pages below primary workspace use the same condensed columns layout. */
export const HUB_SECONDARY_SOURCES_LAYOUT: EvidenceOrientationSourcesLayout =
  WHERE_TO_GO_NEXT_SOURCES_LAYOUT;

/**
 * Intro copy for orientation strips that sit below primary workspace on hub pages.
 * `primaryWorkCue` should name the on-page job in plain language.
 */
export function hubSecondaryFollowUpsIntro(primaryWorkCue: string): string {
  return `Use these when ${primaryWorkCue}. Primary actions on this page come first.`;
}

/** @deprecated Prefer {@link RELATED_GUIDES_FOLLOW_UPS_TITLE} from `related-follow-ups-title`. */
export const HUB_RELATED_GUIDES_FOLLOW_UPS_TITLE = RELATED_GUIDES_FOLLOW_UPS_TITLE;

/** Hub follow-up strips that mix in-app help with operator routes. */
export const HUB_RELATED_RESOURCES_FOLLOW_UPS_TITLE = RELATED_RESOURCES_FOLLOW_UPS_TITLE;

/** Related Guides strips list help topics — the heading makes Read/Open prefixes redundant. */
export function isRelatedGuidesFollowUpsTitle(title: string): boolean {
  return isHelpOnlyRelatedFollowUpsTitle(title);
}

export const HUB_SECONDARY_FOLLOW_UPS_TITLES = {
  operatorHome: "After a review",
  reviewsNew: HUB_RELATED_RESOURCES_FOLLOW_UPS_TITLE,
  settingsHub: "Related administration",
  governanceFindings: "Related governance",
  architecturesHub: "When you are ready",
  roiSummary: "Related reporting",
  evidenceGraph: "Related exploration",
  alertsInbox: "Related governance",
  cloudConnections: HUB_RELATED_RESOURCES_FOLLOW_UPS_TITLE,
  digestsSchedule: "Related digests",
  policyPacksHub: "Related governance",
} as const;
