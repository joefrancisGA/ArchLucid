import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import {
  getShowcaseCompareHref,
  getShowcaseExecutiveHref,
  getShowcaseManifestHref,
} from "@/lib/buyer-safe-review-navigation";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL } from "@/lib/buyer-polish-copy";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

export type BuyerAskGroundingLink = {
  readonly label: string;
  readonly href: string;
};

function baselineGroundingLinksForRun(runId: string): readonly BuyerAskGroundingLink[] {
  return [
    {
      label: "Open review",
      href: `/architecture/reviews/${encodeURIComponent(runId)}`,
    },
    {
      label: BUYER_SURFACE_VOCABULARY.evidenceGraph,
      href: evidenceGraphHref({ runId }),
    },
    {
      label: BUYER_SURFACE_VOCABULARY.auditTrail,
      href: `${GOVERNANCE_AUDIT_PATH}?runId=${encodeURIComponent(runId)}`,
    },
  ];
}

/**
 * Deterministic Sources cites for a review — baseline review / evidence / audit for any run id,
 * plus Claims Intake showcase spine anchors when the canonical demo review is selected.
 */
export function buyerAskGroundingLinksForRun(runIdRaw: string): readonly BuyerAskGroundingLink[] | null {
  const runId = canonicalizeDemoRunId(runIdRaw.trim());

  if (runId.length === 0) {
    return null;
  }

  if (runId !== SHOWCASE_STATIC_DEMO_RUN_ID) {
    return baselineGroundingLinksForRun(runId);
  }

  return [
    {
      label: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.reviewExecutiveSummaryLabel,
      href: getShowcaseExecutiveHref(),
    },
    {
      label: "Finalized review",
      href: getShowcaseManifestHref(),
    },
    {
      label: "Policy pack basis",
      href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
    },
    {
      label: BUYER_SURFACE_VOCABULARY.phiMinimizationRisk,
      href: `/architecture/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`,
    },
    {
      label: BUYER_SURFACE_VOCABULARY.evidenceGraph,
      href: evidenceGraphHref({ runId }),
    },
    {
      label: BUYER_SURFACE_VOCABULARY.auditTrail,
      href: `${GOVERNANCE_AUDIT_PATH}?runId=${encodeURIComponent(runId)}`,
    },
    {
      label: BUYER_COMPARE_OPEN_FULL_LINK_LABEL,
      href: getShowcaseCompareHref(),
    },
  ];
}
