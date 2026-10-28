import { BUYER_SPONSOR_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { resolveQuickDecisionFindingInspectHref } from "@/lib/findings/finding-evidence-navigation";
import {
  getShowcaseCompareHref,
  getShowcaseSponsorHref,
  getShowcaseManifestHref,
} from "@/lib/buyer/buyer-safe-review-navigation";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import {
  SHOWCASE_STATIC_DEMO_POLICY_PACK_DETAIL_HREF,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

export type BuyerAskGroundingLink = {
  readonly label: string;
  /** Omitted when no stored deep link exists for the cited id. */
  readonly href?: string;
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
      label: BUYER_SPONSOR_SUMMARY_VOCABULARY.reviewSponsorReportLabel,
      href: getShowcaseSponsorHref(),
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

export type AskAnswerCitationRefs = {
  readonly referencedFindings: readonly string[];
  readonly referencedDecisions: readonly string[];
  readonly referencedArtifacts: readonly string[];
};

/** Sources footer links for citation ids stored on a single assistant answer (not review navigation). */
export function buildAskAnswerCitationSourceLinks(
  runIdRaw: string,
  refs: AskAnswerCitationRefs | null,
): readonly BuyerAskGroundingLink[] {
  const runId = canonicalizeDemoRunId(runIdRaw.trim());

  if (refs === null) {
    return [];
  }

  if (runId.length === 0) {
    return [{ label: "Review id was not stored." }];
  }

  const links: BuyerAskGroundingLink[] = [];

  for (const findingId of refs.referencedFindings) {
    const trimmed = findingId.trim();

    if (trimmed.length === 0) {
      links.push({ label: "Finding citation was stored empty." });
      continue;
    }

    links.push({
      label: `Finding id ${trimmed}`,
      href: resolveQuickDecisionFindingInspectHref(runId, trimmed),
    });
  }

  for (const decisionId of refs.referencedDecisions) {
    const trimmed = decisionId.trim();

    if (trimmed.length === 0) {
      links.push({ label: "Decision citation was stored empty." });
      continue;
    }

    links.push({
      label: `Decision citation ${trimmed}. A link to that decision was not stored.`,
    });
  }

  for (const artifactId of refs.referencedArtifacts) {
    const trimmed = artifactId.trim();

    if (trimmed.length === 0) {
      links.push({ label: "Artifact citation was stored empty." });
      continue;
    }

    if (trimmed.toLowerCase() === runId.toLowerCase()) {
      links.push({
        label: "Open review",
        href: `/architecture/reviews/${encodeURIComponent(runId)}`,
      });
      continue;
    }

    links.push({
      label: `Artifact id ${trimmed}. A link to that artifact was not stored.`,
    });
  }

  return links;
}

export function collectCitedReviewIdsFromAskAnswerRefs(
  runIdRaw: string,
  refs: AskAnswerCitationRefs | null,
): ReadonlySet<string> {
  const cited = new Set<string>();
  const runId = canonicalizeDemoRunId(runIdRaw.trim()).toLowerCase();

  if (refs === null) {
    return cited;
  }

  for (const artifactId of refs.referencedArtifacts) {
    const trimmed = artifactId.trim().toLowerCase();

    if (trimmed.length > 0) {
      cited.add(trimmed);
    }
  }

  if (runId.length > 0 && refs.referencedArtifacts.some((id) => id.trim().toLowerCase() === runId)) {
    cited.add(runId);
  }

  return cited;
}
