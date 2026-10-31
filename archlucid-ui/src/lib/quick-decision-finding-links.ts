import { severityBadgeLabel } from "@/lib/quick-decision-summary-derive";
import { formatRecommendationFirstSentenceWithTruncationHonesty } from "@/lib/quick-decision-severity-labels";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/findings/finding-inspect-graph-evidence";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import {
  defaultManifestIdForShowcaseFinding,
  primaryFindingEvidenceNavigationHref,
  runDetailSectionHref,
} from "@/lib/findings/finding-source-evidence-links";

export const QUICK_DECISION_RECOMMENDATION_NOT_STORED = "Recommended action was not stored." as const;

export const QUICK_DECISION_RECOMMENDATION_STORED_EMPTY =
  "Recommended action was stored empty." as const;

/** @deprecated Use {@link QUICK_DECISION_RECOMMENDATION_NOT_STORED}. */
export const QUICK_DECISION_RECOMMENDATION_FALLBACK = QUICK_DECISION_RECOMMENDATION_NOT_STORED;

export function formatQuickDecisionRecommendedAction(recommendation: string): string {
  if (recommendation.length === 0) {
    return QUICK_DECISION_RECOMMENDATION_NOT_STORED;
  }

  if (recommendation.trim().length === 0) {
    return QUICK_DECISION_RECOMMENDATION_STORED_EMPTY;
  }

  return formatRecommendationFirstSentenceWithTruncationHonesty(recommendation);
}

/** First recommendation sentence, or omission copy when the finding has no recommendation. */
export function quickDecisionRecommendationSnippet(finding: QuickDecisionFinding): string {
  return formatQuickDecisionRecommendedAction(finding.recommendation);
}

/** Severity wording used by ITSM / work-item payloads (coarser than the severity badge scale). */
export function quickDecisionWorkItemSeverityLabel(severityValue: number | null): string {
  return severityBadgeLabel(severityValue);
}

/** Evidence navigation targets derived for a single finding row (no API calls). */
export type QuickDecisionFindingEvidenceLinks = {
  readonly evidenceRefCount: number | null;
  readonly manifestHref: string | null;
  readonly graphHref: string | null;
  /** Preferred single chip target: manifest section first, then graph evidence trail. */
  readonly viewEvidenceHref: string | null;
};

export function buildQuickDecisionFindingEvidenceLinks(
  runId: string,
  finding: QuickDecisionFinding,
): QuickDecisionFindingEvidenceLinks {
  const evidenceRefCount = finding.evidenceRefCount ?? null;
  const graphFocusId = preferredGraphNodeIdForFindingDeepLink(runId, finding.findingId);
  const manifestId = defaultManifestIdForShowcaseFinding(runId, finding.findingId);
  const manifestHref = manifestId !== null ? runDetailSectionHref(runId, "manifest-summary") : null;
  const graphHref =
    evidenceRefCount !== null && evidenceRefCount > 0
      ? graphTrailHrefWithOptionalNode(runId, graphFocusId)
      : null;
  const viewEvidenceHref =
    primaryFindingEvidenceNavigationHref(
      manifestHref !== null
        ? [{ kind: "manifestSection", label: "Manifest", detail: null, href: manifestHref }]
        : graphHref !== null
          ? [{ kind: "graphNode", label: "Graph", detail: null, href: graphHref }]
          : [],
    ) ?? graphHref;

  return { evidenceRefCount, manifestHref, graphHref, viewEvidenceHref };
}
