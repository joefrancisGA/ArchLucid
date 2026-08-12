import { firstRecommendationSentence } from "@/lib/quick-decision-summary-derive";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import {
  defaultManifestIdForShowcaseFinding,
  primaryFindingEvidenceNavigationHref,
  runDetailSectionHref,
} from "@/lib/finding-source-evidence-links";

/** Shown when a finding carries no recommendation text of its own. */
export const QUICK_DECISION_RECOMMENDATION_FALLBACK = "See finding detail for recommended actions.";

/** First recommendation sentence, or the shared fallback when the finding has no recommendation. */
export function quickDecisionRecommendationSnippet(finding: QuickDecisionFinding): string {
  return finding.recommendation.length > 0
    ? firstRecommendationSentence(finding.recommendation)
    : QUICK_DECISION_RECOMMENDATION_FALLBACK;
}

/** Severity wording used by ITSM / work-item payloads (coarser than the severity badge scale). */
export function quickDecisionWorkItemSeverityLabel(severityValue: number): string {
  if (severityValue >= 3) {
    return "High";
  }

  if (severityValue === 2) {
    return "Medium";
  }

  if (severityValue === 1) {
    return "Low";
  }

  return "Info";
}

/** Evidence navigation targets derived for a single finding row (no API calls). */
export type QuickDecisionFindingEvidenceLinks = {
  readonly evidenceRefCount: number;
  readonly manifestHref: string | null;
  readonly graphHref: string | null;
  /** Preferred single chip target: manifest section first, then graph evidence trail. */
  readonly viewEvidenceHref: string | null;
};

export function buildQuickDecisionFindingEvidenceLinks(
  runId: string,
  finding: QuickDecisionFinding,
): QuickDecisionFindingEvidenceLinks {
  const evidenceRefCount = finding.evidenceRefCount ?? 0;
  const graphFocusId = preferredGraphNodeIdForFindingDeepLink(runId, finding.findingId);
  const manifestId = defaultManifestIdForShowcaseFinding(runId, finding.findingId);
  const manifestHref = manifestId !== null ? runDetailSectionHref(runId, "manifest-summary") : null;
  const graphHref =
    evidenceRefCount > 0 || graphFocusId !== null
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
