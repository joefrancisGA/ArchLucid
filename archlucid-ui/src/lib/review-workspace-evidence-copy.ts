import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH, reviewDetailPath } from "@/lib/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const REVIEW_WORKSPACE_CLAIM_DISCIPLINE =
  "This review workspace is the package leave-behind for one architecture review — findings, decisions, and artifacts here are application-layer evidence, not a complete diligence Sources export package alone, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Evidence graph, Audit, or signed-record detail when you need fuller sponsor-safe trails.";

export const REVIEW_WORKSPACE_SOURCES_INTRO =
  "Use these follow-ups when package work needs evidence search, governance disposition, or activity trails.";

export type ReviewWorkspaceSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Build operator Sources for a run — never self-links the review detail path. */
export function buildReviewWorkspaceSources(runId: string): readonly ReviewWorkspaceSourceLink[] {
  const trimmed = runId.trim();
  const evidenceHref =
    trimmed.length > 0
      ? `/insights/evidence-graph?runId=${encodeURIComponent(trimmed)}`
      : "/insights/evidence-graph";
  const findingsHref =
    trimmed.length > 0
      ? `${reviewDetailPath(trimmed)}?reviewTab=findings`
      : "/governance/findings";

  return [
    { label: "Architecture reviews", href: REVIEWS_LIST_PATH },
    { label: "Start a review", href: REVIEWS_NEW_PATH },
    { label: "Evidence graph", href: evidenceHref },
    { label: "Findings tab", href: findingsHref },
    { label: "Governance findings", href: "/governance/findings" },
    { label: "Audit trail", href: "/governance/audit" },
    { label: "Review packages help", href: inAppHelpHref("review-packages") },
  ] as const;
}
