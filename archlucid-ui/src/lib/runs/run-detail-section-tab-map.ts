import {
  isReviewDetailTabId,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";

/**
 * Maps in-page section anchor ids to the review workspace tab that owns them.
 * Used for legacy hash deep-links and for filtering the on-page section nav in the tabbed workspace.
 */
export const RUN_DETAIL_SECTION_TAB: Readonly<Record<string, ReviewDetailTabId>> = {
  "review-summary": "overview",
  "recommended-actions": "overview",
  "run-explanation": "findings",
  "trust-evidence": "evidence",
  "capture-evidence": "evidence",
  "artifacts-exports": "evidence",
  "manifest-summary": "policies",
  "governance-decision": "decisions-remediation",
  "review-package": "review-package",
  "sponsor-handoff": "review-package",
  "sponsor-handoff-extended": "review-package",
  "run-actions": "review-package",
  "submitted-architecture": "architecture",
  "technology-baseline": "architecture",
  "architecture-graph": "architecture",
  "pipeline-timeline": "activity",
  "pipeline-stages": "activity",
  "architecture-assessment-progress": "activity",
  "authority-chain": "activity",
  "agent-forensics": "activity",
};

export function resolveReviewDetailTabForSectionAnchor(
  anchorId: string | null | undefined,
): ReviewDetailTabId | null {
  if (anchorId === null || anchorId === undefined) {
    return null;
  }

  const normalized = anchorId.replace(/^#/, "").trim();

  if (normalized.length === 0) {
    return null;
  }

  return RUN_DETAIL_SECTION_TAB[normalized] ?? null;
}

export function filterRunDetailNavSectionsForTab<T extends { readonly id: string; readonly available: boolean }>(
  sections: readonly T[],
  tabId: ReviewDetailTabId,
): T[] {
  return sections.filter((section) => {
    if (!section.available) {
      return false;
    }

    if (isReviewDetailTabId(section.id)) {
      return true;
    }

    const ownerTab = RUN_DETAIL_SECTION_TAB[section.id];

    return ownerTab === tabId;
  });
}
