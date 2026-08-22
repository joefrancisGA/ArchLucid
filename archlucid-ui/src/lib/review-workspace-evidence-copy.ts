import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH, reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";

export const REVIEW_WORKSPACE_CLAIM_DISCIPLINE =
  "This review workspace holds one architecture review's findings, decisions, and artifacts — not a complete audit export alone. Open Evidence graph, Audit, or sealed-record detail when you need the full package.";

export const REVIEW_WORKSPACE_SOURCES_INTRO =
  "Use these follow-ups when package work needs evidence search, findings triage, or activity records.";


/** Build operator Sources for a run — never self-links the review detail path. */
export function buildReviewWorkspaceSources(runId: string): readonly EvidenceSourceLink[] {
  const trimmed = runId.trim();
  const evidenceHref =
    trimmed.length > 0
      ? `/insights/evidence-graph?runId=${encodeURIComponent(trimmed)}`
      : "/insights/evidence-graph";
  const findingsHref =
    trimmed.length > 0
      ? `${reviewDetailPath(trimmed)}?reviewTab=findings`
      : GOVERNANCE_FINDINGS_PATH;

  return [
    { label: "Architecture reviews", href: REVIEWS_LIST_PATH },
    { label: "Start a review", href: REVIEWS_NEW_PATH },
    { label: "Evidence graph", href: evidenceHref },
    { label: "Findings tab", href: findingsHref },
    { label: "Findings queue", href: GOVERNANCE_FINDINGS_PATH },
    { label: "Audit trail", href: GOVERNANCE_AUDIT_PATH },
    { label: "Review packages help", href: inAppHelpHref("review-packages") },
  ] as const;
}
