/**
 * Canonical architect-facing section order for Review Package detail (TB-620).
 * Draft and finalized packages use different render trees — keep two explicit lists.
 */

export const RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER = [
  "summary-header",
  "section-nav",
  "policy-pack-callout",
  "commit-blocking-banner",
  "first-week-guidance",
  "first-screen-proof-status",
  "technology-baseline",
  "findings",
  "decision-delta",
  "governance-alerts",
  "evidence-trust",
  "manifest-summary",
  "export-actions",
  "explanation-confidence",
  "mid-deferred",
  "sponsor-bottom-line",
  "holistic-critic",
  "below-fold",
] as const;

export const RUN_DETAIL_DRAFT_ARCHITECT_SECTION_ORDER = [
  "summary-header",
  "stalled-guidance",
  "commit-blocking-banner",
  "first-week-guidance",
  "first-screen-proof-status",
  "technology-baseline",
  "capture-evidence",
  "progress-tracker",
  "findings",
  "governance-alerts",
  "governance-cta",
  "sponsor-report-cta",
  "operator-technical-disclosure",
  "below-fold",
] as const;

export type RunDetailFinalizedArchitectSection =
  (typeof RUN_DETAIL_FINALIZED_ARCHITECT_SECTION_ORDER)[number];

export type RunDetailDraftArchitectSection = (typeof RUN_DETAIL_DRAFT_ARCHITECT_SECTION_ORDER)[number];

/** Maps PageView source markers to architect section ids for order regression tests. */
export const RUN_DETAIL_PAGE_VIEW_SECTION_MARKERS: Readonly<Record<RunDetailFinalizedArchitectSection, string>> = {
  "summary-header": "<RunDetailWorkspaceHeader",
  "section-nav": "<RunDetailSectionNav",
  "policy-pack-callout": "<ReviewDetailPolicyPackImpactCallout",
  "commit-blocking-banner": "<CommitBlockingFindingsBanner",
  "first-week-guidance": "<FirstWeekRouteGuidance",
  "first-screen-proof-status": "<RunDetailFirstScreenProofStatusClient",
  "technology-baseline": "<TechnologyBaselineSection",
  findings: "<RunDetailExplanationDeferred",
  "decision-delta": "<RunDetailDecisionDeltaDeferred",
  "governance-alerts": "<RunDetailGovernanceAlerts",
  "evidence-trust": "<RunDetailTrustEvidenceCardSectionDeferred",
  "manifest-summary": "<RunDetailManifestSummarySection",
  "export-actions": "<ExportDeliverableDialog",
  "explanation-confidence": "<RunExplanationConfidenceBanner",
  "mid-deferred": "<RunDetailMidDeferredSections",
  "sponsor-bottom-line": "<RunDetailSponsorBottomLine",
  "holistic-critic": "<RunDetailHolisticCriticPanel",
  "below-fold": "<RunDetailBelowFoldSections",
};

export function assertArchitectSectionOrder(source: string, order: readonly string[], markers: Readonly<Record<string, string>>): void {
  let lastIndex = -1;

  for (const sectionId of order) {
    const marker = markers[sectionId];

    if (marker === undefined) {
      continue;
    }

    const index = source.indexOf(marker);

    if (index === -1) {
      continue;
    }

    if (index < lastIndex) {
      throw new Error(`Section "${sectionId}" appears before an earlier architect section in RunDetailPageView.`);
    }

    lastIndex = index;
  }
}
