import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import {
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  pathMatchesGovernanceAlerts,
  pathMatchesGovernanceAlertRules,
  pathMatchesGovernanceApprovalQueue,
  pathMatchesGovernanceAudit,
  pathMatchesGovernanceExceptions,
} from "@/lib/governance/governance-route-paths";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isPinnedDemoWorkspaceRunId } from "@/lib/demo-workspace-scope";
import {
  BUYER_SPONSOR_SUMMARY_VOCABULARY,
  BUYER_SURFACE_VOCABULARY,
  BUYER_TERMINOLOGY,
} from "@/lib/vocabulary/buyer-surface-vocabulary";
import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  GOVERNANCE_OVERVIEW_PAGE_LEAD,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE,
} from "@/lib/governance/governance-overview-copy";

import {
  pathMatchesSettingsSecurityTrust,
} from "@/lib/settings-admin-route-paths";
import {
  pathMatchesSignedRecordsDetailRoute,
  signedRecordDetailPath,
} from "@/lib/signed-records-paths";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import { isValueReportOutcomesSurface } from "@/lib/value-report-outcomes-nav-tabs";

export type BuyerPolishedRouteOrientationOptions = {
  /** When `/insights/search-review-evidence` or `/governance` carries `runId`, header copy can reflect a scoped review. */
  readonly searchRunId?: string;
};

/**
 * Stable header strip orientation for buyer-polished shell — replaces abstract layer questions where path is known.
 */
export function buyerPolishedRouteOrientation(
  pathname: string,
  options?: BuyerPolishedRouteOrientationOptions,
): {
  readonly label: string;
  readonly line: string;
} | null {
  const rawPath = (pathname.split("?")[0] ?? "").trim().replace(/\/$/, "");
  const path = canonicalizeLegacyOperatorRoutePath(rawPath.length === 0 ? "/" : rawPath).split("?")[0] ?? rawPath;

  const inspectRiskFinding = /^\/architecture\/reviews\/[^/]+\/findings\/[^/]+\/(?:inspect|evidence-trace)\b/.exec(path);

  if (inspectRiskFinding !== null) {
    return {
      label: "Evidence traceability",
      line: "Citations, structured payloads, and audit correlation tied to this risk observation.",
    };
  }

  const riskFinding = /^\/architecture\/reviews\/[^/]+\/findings\/[^/]+\b/.exec(path);

  if (riskFinding !== null) {
    return {
      label: "Finding",
      line: "Severity, disposition, mitigation, and trace links into the finalized review.",
    };
  }

  if (path.startsWith(`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)) {
    return {
      label: BUYER_SPONSOR_SUMMARY_VOCABULARY.reviewSponsorReportLabel,
      line: `Board-ready posture, outcomes, and evidence hooks for ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}.`,
    };
  }

  const executivePinnedRun = /^\/sponsor\/reviews\/([^/]+)$/.exec(path);

  if (executivePinnedRun !== null && isPinnedDemoWorkspaceRunId(executivePinnedRun[1])) {
    return {
      label: BUYER_SPONSOR_SUMMARY_VOCABULARY.reviewSponsorReportLabel,
      line: "Board-ready posture, outcomes, and evidence hooks for this finalized review.",
    };
  }

  if (path.startsWith(`/showcase/`)) {
    return {
      label: "Guided walkthrough",
      line: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} — narrative companion to the authenticated review record.`,
    };
  }

  if (path.includes(signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID))) {
    return {
      label: SIGNED_MANIFEST_LABEL,
      line: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} — decisions, monitored risks, and deliverables.`,
    };
  }

  const friendlyArchitecturePath = `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}/architecture`.replace(/\/$/, "");

  if (path.replace(/\/$/, "") === friendlyArchitecturePath) {
    return {
      label: SIGNED_MANIFEST_LABEL,
      line: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} — decisions, monitored risks, and deliverables.`,
    };
  }

  if (pathMatchesSignedRecordsDetailRoute(path)) {
    return {
      label: SIGNED_MANIFEST_LABEL,
      line: `${BUYER_SURFACE_VOCABULARY.finalizedSignedManifestRecord} — decisions, findings counts, artifacts, and download bundle.`,
    };
  }

  if (path === SPONSOR_DASHBOARD_HREF || path.startsWith(`${SPONSOR_DASHBOARD_HREF}/`)) {
    // Sponsor dashboard carries its own portfolioPageLead hero (TB-1439) — not strip + body twins.
    return null;
  }

  if (path.startsWith("/insights/evidence-graph")) {
    return null;
  }

  if (path === "/governance/findings" || path.startsWith("/governance/findings/")) {
    return null;
  }

  if (pathMatchesGovernanceExceptions(path)) {
    return null;
  }

  if (path === "/governance/policy-packs" || path.startsWith("/governance/policy-packs/")) {
    return null;
  }

  if (path === GOVERNANCE_STANDARDS_AND_RULES_PATH || path.startsWith(`${GOVERNANCE_STANDARDS_AND_RULES_PATH}/`)) {
    return null;
  }

  if (pathMatchesGovernanceAlerts(path)) {
    return null;
  }

  if (path === "/governance/decision-register" || path.startsWith("/governance/decision-register/")) {
    return null;
  }

  // Advisory scans carries its own OperatorPageHeader lead (TB-1125) — skip LayerHeader orientation.
  if (path.startsWith("/governance/advisory-scans") || path.startsWith("/advisory")) {
    return null;
  }

  // Recurrence schedules carries its own OperatorPageHeader subtitle (TB-1129) — do not inherit
  // the generic `/governance` overview lead (pending approvals / workspace status).
  if (path === "/governance/recurrence-schedules" || path.startsWith("/governance/recurrence-schedules/")) {
    return null;
  }

  // Governance setup carries its own OperatorPageHeader (TB-1136) — not overview vocabulary.
  if (
    path === "/governance/setup" ||
    path.startsWith("/governance/setup/") ||
    path === "/governance/first-30-days" ||
    path.startsWith("/governance/first-30-days/")
  ) {
    return null;
  }

  // Audit trail carries its own OperatorPageHeader subtitle (TB-1435) — not governance overview strip.
  if (pathMatchesGovernanceAudit(path)) {
    return null;
  }

  // Alert rules hub carries its own OperatorPageHeader subtitle (TB-1435).
  if (pathMatchesGovernanceAlertRules(path)) {
    return null;
  }

  if (pathMatchesGovernanceApprovalQueue(path)) {
    const searchRunId = options?.searchRunId?.trim() ?? "";

    // Approval queue owns OperatorPageHeader title/lead (always "Approval queue") — no strip twin (TB-1434).
    if (searchRunId.length === 0) {
      return null;
    }

    if (canonicalizeDemoRunId(searchRunId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
      return {
        label: GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL,
        line: GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE,
      };
    }

    // Review-scoped deep links (`?runId=`) keep the Approval queue title; context bar names the review.
    return null;
  }

  if (path.startsWith("/governance")) {
    return {
      label: "Governance",
      line: GOVERNANCE_OVERVIEW_PAGE_LEAD,
    };
  }

  if (path.startsWith(`/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)) {
    return {
      label: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
      line: "Signed review record — findings, decisions, evidence trail, governance disposition, and deliverables.",
    };
  }

  if (path !== "/architecture/reviews/new" && /^\/architecture\/reviews\/[^/]+$/.exec(path) !== null) {
    return {
      label: "Review record",
      line: "Outcomes, findings, signed review record, and evidence trail for this architecture review.",
    };
  }

  if (path.startsWith("/insights/ask-review-questions")) {
    return null;
  }

  if (path === "/architecture/architecture-intelligence" || path.startsWith("/architecture/architecture-intelligence/")) {
    return {
      label: "Architecture intelligence",
      line: "Closed-loop reasoning — interview, evidence-gated findings, and publish into product findings.",
    };
  }

  if (path.startsWith("/insights/search-review-evidence")) {
    const searchRunId = options?.searchRunId?.trim() ?? "";

    if (searchRunId.length > 0) {
      return {
        label: EVIDENCE_TRAIL_SEARCH.scopedTitle,
        line: "Find language across this review's summaries, signed review record, and linked metadata.",
      };
    }

    // Search page carries its own OperatorPageHeader subtitle (TB-1436) — not strip + header twins.
    return null;
  }

  if (path === "/internal/product-learning") {
    // Product learning carries its own pageLead hero (TB-1438) — not strip + body twins.
    return null;
  }

  if (path.startsWith("/insights/compare-two-reviews")) {
    return null;
  }

  if (pathMatchesSettingsSecurityTrust(path)) {
    return {
      label: "Security & Trust",
      line: "Procurement-facing security posture, trust center, and assessment materials.",
    };
  }

  // Shared Insights strip for the Outcomes tab hub (scorecard, ROI summary, pilot outcomes, sponsor report).
  if (isValueReportOutcomesSurface(path)) {
    return {
      label: "Insights",
      line: BUYER_SPONSOR_SUMMARY_VOCABULARY.scorecardLayerContextLine,
    };
  }

  return null;
}
