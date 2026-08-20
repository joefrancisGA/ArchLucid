import type { EvidenceOrientationSourcesLayout } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";

/** Wrap layout for secondary hub follow-up link rows (TB-2038 / HOM). */
export const HUB_SECONDARY_SOURCES_LAYOUT: EvidenceOrientationSourcesLayout = "wrap";

/**
 * Intro copy for orientation strips that sit below primary workspace on hub pages.
 * `primaryWorkCue` should name the on-page job in plain language.
 */
export function hubSecondaryFollowUpsIntro(primaryWorkCue: string): string {
  return `Use these when ${primaryWorkCue}. Primary actions on this page come first.`;
}

export const HUB_SECONDARY_FOLLOW_UPS_TITLES = {
  operatorHome: "After a review",
  reviewsNew: "Related guides",
  settingsHub: "Related administration",
  governanceFindings: "Related governance",
  architecturesHub: "When you are ready",
  roiSummary: "Related reporting",
  evidenceGraph: "Related exploration",
  alertsInbox: "Related governance",
  cloudConnections: "Related connections",
  digestsSchedule: "Related digests",
  policyPacksHub: "Related governance",
} as const;
