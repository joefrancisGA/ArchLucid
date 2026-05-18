import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import {
  getShowcaseCompareHref,
  getShowcaseExecutiveHref,
  getShowcaseManifestHref,
} from "@/lib/buyer-safe-review-navigation";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL } from "@/lib/buyer-polish-copy";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

export type BuyerAskGroundingLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Deterministic anchors shown under Ask assistant replies on the Claims Intake demo spine — makes grounding visible
 * without depending on model prose (Illustrative seeded threads still apply).
 */
export function buyerAskGroundingLinksForRun(runIdRaw: string): readonly BuyerAskGroundingLink[] | null {
  const runId = canonicalizeDemoRunId(runIdRaw.trim());

  if (runId !== SHOWCASE_STATIC_DEMO_RUN_ID) {
    return null;
  }

  return [
    {
      label: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
      href: getShowcaseExecutiveHref(),
    },
    {
      label: "Finalized manifest package",
      href: getShowcaseManifestHref(),
    },
    {
      label: "Policy pack basis",
      href: SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
    },
    {
      label: BUYER_SURFACE_VOCABULARY.phiMinimizationRisk,
      href: `/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID)}`,
    },
    {
      label: BUYER_SURFACE_VOCABULARY.evidenceGraph,
      href: `/graph?runId=${encodeURIComponent(runId)}`,
    },
    {
      label: BUYER_COMPARE_OPEN_FULL_LINK_LABEL,
      href: getShowcaseCompareHref(),
    },
    {
      label: BUYER_SURFACE_VOCABULARY.auditTrail,
      href: `/audit?runId=${encodeURIComponent(runId)}`,
    },
  ];
}
