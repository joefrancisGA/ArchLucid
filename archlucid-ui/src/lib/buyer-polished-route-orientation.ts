import {
  SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH,
  SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH,
  SPONSOR_REPORT_PILOT_OUTCOMES_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";
import { pathMatchesGovernanceAlerts, pathMatchesGovernanceAlertRules, pathMatchesGovernanceAudit } from "@/lib/governance-route-paths";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isPinnedDemoWorkspaceRunId } from "@/lib/demo-workspace-scope";
import {
  BUYER_EXECUTIVE_SUMMARY_VOCABULARY,
  BUYER_SURFACE_VOCABULARY,
  BUYER_TERMINOLOGY,
} from "@/lib/buyer-surface-vocabulary";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  GOVERNANCE_OVERVIEW_PAGE_LEAD,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL,
  GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE,
  GOVERNANCE_REVIEW_CONTEXT_PAGE_LEAD,
} from "@/lib/governance-overview-copy";

import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

export type BuyerPolishedRouteOrientationOptions = {
  /** When `/search` or `/governance` carries `runId`, header copy can reflect a scoped review. */
  readonly searchRunId?: string;
};

function pathMatchesValueReportSponsorHeroRoutes(pathname: string): boolean {
  return (
    pathname === "/value-report" ||
    pathname.startsWith("/value-report/") ||
    pathname === SPONSOR_REPORT_EXECUTIVE_SUMMARY_PATH ||
    pathname === SPONSOR_REPORT_PILOT_OUTCOMES_PATH ||
    pathname.startsWith(`${SPONSOR_REPORT_PILOT_OUTCOMES_PATH}/`) ||
    pathname === SPONSOR_REPORT_ROI_SUMMARY_PATH ||
    pathname.startsWith(`${SPONSOR_REPORT_ROI_SUMMARY_PATH}/`)
  );
}

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
  const path = (pathname.split("?")[0] ?? "").trim().replace(/\/$/, "");

  const inspectRiskFinding = /^\/reviews\/[^/]+\/findings\/[^/]+\/(?:inspect|evidence-trace)\b/.exec(path);

  if (inspectRiskFinding !== null) {
    return {
      label: "Evidence traceability",
      line: "Citations, structured payloads, and audit correlation tied to this risk observation.",
    };
  }

  const riskFinding = /^\/reviews\/[^/]+\/findings\/[^/]+\b/.exec(path);

  if (riskFinding !== null) {
    return {
      label: "Finding",
      line: "Severity, disposition, mitigation, and trace links into the finalized review.",
    };
  }

  if (path.startsWith(`/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)) {
    return {
      label: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.reviewExecutiveSummaryLabel,
      line: `Board-ready posture, outcomes, and evidence hooks for ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}.`,
    };
  }

  const executivePinnedRun = /^\/executive\/reviews\/([^/]+)$/.exec(path);

  if (executivePinnedRun !== null && isPinnedDemoWorkspaceRunId(executivePinnedRun[1])) {
    return {
      label: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.reviewExecutiveSummaryLabel,
      line: "Board-ready posture, outcomes, and evidence hooks for this finalized review.",
    };
  }

  if (path.startsWith(`/showcase/`)) {
    return {
      label: "Guided walkthrough",
      line: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} — narrative companion to the authenticated review record.`,
    };
  }

  if (path.includes(`/signed-records/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`)) {
    return {
      label: SIGNED_MANIFEST_LABEL,
      line: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} — decisions, monitored risks, and deliverables.`,
    };
  }

  const friendlyManifestPath = `/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}/manifest`.replace(/\/$/, "");

  if (path.replace(/\/$/, "") === friendlyManifestPath) {
    return {
      label: SIGNED_MANIFEST_LABEL,
      line: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} — decisions, monitored risks, and deliverables.`,
    };
  }

  const friendlyArchitecturePath = `/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}/architecture`.replace(/\/$/, "");

  if (path.replace(/\/$/, "") === friendlyArchitecturePath) {
    return {
      label: SIGNED_MANIFEST_LABEL,
      line: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} — decisions, monitored risks, and deliverables.`,
    };
  }

  if (path.startsWith("/signed-records/")) {
    return {
      label: SIGNED_MANIFEST_LABEL,
      line: `${BUYER_SURFACE_VOCABULARY.finalizedSignedManifestRecord} — decisions, findings counts, artifacts, and download bundle.`,
    };
  }

  if (path === "/dashboard") {
    // Executive dashboard carries its own portfolioPageLead hero (TB-1439) — not strip + body twins.
    return null;
  }

  if (path === "/executive/scorecard") {
    return {
      label: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.scorecardPageTitle,
      line: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.scorecardLayerContextLine,
    };
  }

  if (path.startsWith("/graph")) {
    return null;
  }

  if (path === "/governance/findings" || path.startsWith("/governance/findings/")) {
    return null;
  }

  if (path === "/governance/risk-exceptions" || path.startsWith("/governance/risk-exceptions/")) {
    return null;
  }

  if (path === "/governance/policy-packs" || path.startsWith("/governance/policy-packs/")) {
    return null;
  }

  if (path === "/governance/resolution" || path.startsWith("/governance/resolution/")) {
    return null;
  }

  if (pathMatchesGovernanceAlerts(path)) {
    return null;
  }

  if (path === "/governance/dashboard" || path.startsWith("/governance/dashboard/")) {
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

  if (path === "/governance") {
    const searchRunId = options?.searchRunId?.trim() ?? "";

    // Governance overview carries its own OperatorPageHeader subtitle (TB-1434) — not strip + header twins.
    if (searchRunId.length === 0) {
      return null;
    }

    if (canonicalizeDemoRunId(searchRunId) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)) {
      return {
        label: GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LABEL,
        line: GOVERNANCE_OVERVIEW_SAMPLE_CONTEXT_LINE,
      };
    }

    return {
      label: "Review governance",
      line: GOVERNANCE_REVIEW_CONTEXT_PAGE_LEAD,
    };
  }

  if (path.startsWith("/governance")) {
    return {
      label: "Governance",
      line: GOVERNANCE_OVERVIEW_PAGE_LEAD,
    };
  }

  if (path.startsWith(`/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)) {
    return {
      label: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
      line: "Signed review record — findings, decisions, evidence trail, governance disposition, and deliverables.",
    };
  }

  if (path !== "/reviews/new" && /^\/reviews\/[^/]+$/.exec(path) !== null) {
    return {
      label: "Review",
      line: "Review record — outcomes, findings, artifacts, downloads, and deep links into evidence surfaces.",
    };
  }

  if (path.startsWith("/policy-packs")) {
    return null;
  }

  if (path.startsWith("/ask")) {
    return null;
  }

  if (path === "/architecture-intelligence" || path.startsWith("/architecture-intelligence/")) {
    return {
      label: "Architecture intelligence",
      line: "Closed-loop reasoning — interview, evidence-gated findings, and publish into product findings.",
    };
  }

  if (path.startsWith("/search")) {
    const searchRunId = options?.searchRunId?.trim() ?? "";

    if (searchRunId.length > 0) {
      return {
        label: "Search this review's evidence",
        line: "Find language across this review's summaries, signed review record, and linked metadata.",
      };
    }

    // Search page carries its own OperatorPageHeader subtitle (TB-1436) — not strip + header twins.
    return null;
  }

  if (path === "/product-learning") {
    // Product learning carries its own pageLead hero (TB-1438) — not strip + body twins.
    return null;
  }

  if (path.startsWith("/compare")) {
    return null;
  }

  if (path === "/settings/security-trust" || path === "/workspace/security-trust") {
    return {
      label: "Security & trust",
      line: "Procurement-facing security posture, trust center, and assessment materials.",
    };
  }

  if (pathMatchesValueReportSponsorHeroRoutes(path)) {
    // Value-report pages carry their own page hero (TB-1437) — not strip + LayerHeader + subtitle twins.
    return null;
  }

  if (path.startsWith("/scorecard") || path.startsWith(SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH)) {
    return {
      label: "Insights",
      line: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.scorecardLayerContextLine,
    };
  }

  return null;
}
