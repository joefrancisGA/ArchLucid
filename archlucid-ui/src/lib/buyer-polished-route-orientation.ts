import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { pathMatchesGovernanceAlerts } from "@/lib/governance-route-paths";
import {
  BUYER_EXECUTIVE_SUMMARY_VOCABULARY,
  BUYER_SURFACE_VOCABULARY,
  BUYER_TERMINOLOGY,
  PILOT_FEEDBACK_VOCABULARY,
} from "@/lib/buyer-surface-vocabulary";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

export type BuyerPolishedRouteOrientationOptions = {
  /** When `/search` carries `runId`, header copy can reflect a scoped review package. */
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
  const path = (pathname.split("?")[0] ?? "").trim().replace(/\/$/, "");

  const inspectRiskFinding = /^\/reviews\/[^/]+\/findings\/[^/]+\/inspect\b/.exec(path);

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
      line: "Severity, disposition, mitigation, and trace links into the finalized review package.",
    };
  }

  if (path.startsWith(`/executive/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)) {
    return {
      label: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle,
      line: `Board-ready posture, outcomes, and evidence hooks for ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}.`,
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
    return {
      label: BUYER_TERMINOLOGY.portfolioOverview,
      line: "ROI, remediation, and governance posture across committed review packages.",
    };
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

  if (path.startsWith("/governance")) {
    return {
      label: "Governance approval record",
      line: "Governance approval record — approved for governed use with monitored PHI minimization control. Approved as the governed architecture record for diligence, architecture review, and implementation planning. Production deployments remain governed by enterprise change management.",
    };
  }

  if (path.startsWith("/audit")) {
    return {
      label: "Audit Trail",
      line: `Immutable audit events correlated to reviews such as ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}.`,
    };
  }

  if (path.startsWith(`/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)) {
    return {
      label: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
      line: "Finalized decision record — findings, finalized signed review record, evidence trail, governance disposition, and deliverables.",
    };
  }

  if (/^\/reviews\/[^/]+$/.exec(path) !== null) {
    return {
      label: "Review package",
      line: "Review package record — outcomes, findings, artifacts, downloads, and deep links into evidence surfaces.",
    };
  }

  if (path.startsWith("/policy-packs")) {
    return null;
  }

  if (path.startsWith("/ask")) {
    return null;
  }

  if (path.startsWith("/search")) {
    const searchRunId = options?.searchRunId?.trim() ?? "";

    if (searchRunId.length > 0) {
      return {
        label: "Search this review's evidence",
        line: "Find language across this review package's summaries, signed review record, and linked metadata.",
      };
    }

    return {
      label: "Search review evidence",
      line: "Find evidence, findings, decisions, and signed review records across this workspace.",
    };
  }

  if (path === "/product-learning") {
    return {
      label: BUYER_TERMINOLOGY.evaluationFeedback,
      line: PILOT_FEEDBACK_VOCABULARY.layerContextLine,
    };
  }

  if (path.startsWith("/compare")) {
    return {
      label: "Compare two reviews",
      line: "See what changed between finalized review packages.",
    };
  }

  if (path.startsWith("/advisory")) {
    return {
      label: OPERATOR_NAV_LINK_LABELS.architectureAdvisory,
      line: "Recommended changes based on committed review packages.",
    };
  }

  if (path === "/settings/security-trust" || path === "/workspace/security-trust") {
    return {
      label: "Security & trust",
      line: "Procurement-facing security posture, trust center, and assessment materials.",
    };
  }

  if (path === "/value-report") {
    return {
      label: "Value report",
      line: "Generate sponsor-ready summaries of review outcomes, ROI, and governance progress.",
    };
  }

  if (path.startsWith("/value-report/pilot")) {
    return {
      label: "Sponsor report",
      line: "Pilot outcomes — metrics and governance signals from finalized reviews.",
    };
  }

  if (path.startsWith("/value-report/roi")) {
    return {
      label: "Sponsor report",
      line: "ROI summary — estimated hours saved from review findings.",
    };
  }

  if (path.startsWith("/scorecard")) {
    return {
      label: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.scorecardPageTitle,
      line: BUYER_EXECUTIVE_SUMMARY_VOCABULARY.scorecardLayerContextLine,
    };
  }

  return null;
}
