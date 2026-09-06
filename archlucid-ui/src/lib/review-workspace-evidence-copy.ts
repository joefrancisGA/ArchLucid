import { REVIEWS_LIST_PATH, REVIEWS_NEW_PATH, reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { GOVERNANCE_AUDIT_PATH, GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import type { PageHelpTopic } from "@/lib/usability/page-help-topic-rows";

export const REVIEW_WORKSPACE_HELP_TOPIC_LABEL = "Review workspace" as const;

/** Review workspace detail — learn more anchors the inspect section of the packages guide. */
export const REVIEW_WORKSPACE_HELP_TOPIC: PageHelpTopic = {
  slug: "review-packages",
  label: REVIEW_WORKSPACE_HELP_TOPIC_LABEL,
  hashFragment: "inspect-an-architecture-package",
};

export const REVIEW_WORKSPACE_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Review workspace — outcomes, findings, evidence, activity, and finalize actions for one architecture review.",
  whatToDoNext:
    "Triage findings on the Findings tab, confirm evidence on Evidence, then finalize on Activity when the review is ready to lock.",
  whyEmpty: "Tabs populate after intake completes and the review pipeline produces findings and evidence.",
  whereToConfigurePrerequisite:
    "Open a review from Reviews after intake completes, or re-run the review when execution failed.",
  taskSteps: [
    "Check Overview for status, blockers, and the recommended next action.",
    "Triage findings and capture any missing evidence.",
    "Finalize on Activity when findings are ready and approval gates are clear.",
  ],
} as const;

const REVIEW_WORKSPACE_RESERVED_SEGMENTS = new Set(["new"]);

/** True on the canonical review workspace detail route (not hub, intake, or child surfaces). */
export function pathIsReviewWorkspaceDetail(pathname: string): boolean {
  const path = (pathname ?? "").split("?")[0] ?? "";
  const match = path.match(/^\/(?:architecture\/)?reviews\/([^/]+)(?:\/(.*))?$/);

  if (match === null) {
    return false;
  }

  const reviewId = match[1]?.trim() ?? "";
  const remainder = match[2]?.trim() ?? "";

  if (reviewId.length === 0 || REVIEW_WORKSPACE_RESERVED_SEGMENTS.has(reviewId)) {
    return false;
  }

  if (remainder.length === 0) {
    return true;
  }

  return remainder === "print";
}

export const REVIEW_WORKSPACE_CLAIM_DISCIPLINE =
  "This review workspace holds one architecture review's findings, decisions, and artifacts — not a complete audit export alone. Open Evidence graph, Audit, or finalized review record detail when you need the full package.";

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
    { label: "Architecture packages help", href: inAppHelpHref("review-packages") },
  ] as const;
}
