import type { RunDetailSection } from "@/components/runs/RunDetailSectionNav";
import {
  REVIEW_DETAIL_TAB_IDS,
  REVIEW_DETAIL_TAB_LABELS,
  type ReviewDetailTabId,
} from "@/lib/review-detail-workspace-tabs";
import type { ManifestSummary, RunDetail } from "@/types/authority";

export type BuildRunDetailNavSectionsArgs = {
  readonly buyerPolishedSections: boolean;
  readonly manifestSummary: ManifestSummary | null;
  readonly trustEvidenceCard: RunDetail["trustEvidenceCard"];
  readonly manifestId: string | null | undefined;
  readonly graphSnapshotId: string | null | undefined;
};

function tabAvailable(tabId: ReviewDetailTabId, args: BuildRunDetailNavSectionsArgs): boolean {
  const manifestId = (args.manifestId ?? "").trim();

  switch (tabId) {
    case "overview":
    case "findings":
    case "decisions-remediation":
    case "review-package":
    case "activity":
      return true;
    case "evidence":
      return Boolean(args.trustEvidenceCard) || manifestId.length === 0;
    case "policies":
      return manifestId.length > 0 || args.manifestSummary !== null;
    case "architecture":
      return true;
    default: {
      const unreachable: never = tabId;

      return Boolean(unreachable);
    }
  }
}

/** Tab-aligned section strip — maps each destination to the eight-tab review workspace contract. */
export function buildRunDetailNavSections(
  args: BuildRunDetailNavSectionsArgs,
): RunDetailSection[] {
  return REVIEW_DETAIL_TAB_IDS.map((tabId) => ({
    id: tabId,
    label: REVIEW_DETAIL_TAB_LABELS[tabId],
    available: tabAvailable(tabId, args),
  }));
}
