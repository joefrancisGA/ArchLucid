import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
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

  if (path.includes(`/manifests/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`)) {
    return {
      label: "Signed manifest",
      line: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} — decisions, monitored risks, and deliverables.`,
    };
  }

  const friendlyManifestPath = `/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}/manifest`.replace(/\/$/, "");

  if (path.replace(/\/$/, "") === friendlyManifestPath) {
    return {
      label: "Signed manifest",
      line: `${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE} — decisions, monitored risks, and deliverables.`,
    };
  }

  if (path.startsWith("/manifests/")) {
    return {
      label: "Architecture review manifest",
      line: `${BUYER_SURFACE_VOCABULARY.finalizedSignedManifestRecord} — decisions, findings counts, artifacts, and download bundle.`,
    };
  }

  if (path.startsWith("/graph")) {
    return {
      label: "Evidence trail",
      line: "Decision traceability graph — reviewed context, policy basis, architecture analysis, prioritized findings, decisions, signed manifest, and deliverables.",
    };
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
      line: "Finalized decision record — findings, finalized signed manifest, evidence trail, governance disposition, and deliverables.",
    };
  }

  if (/^\/reviews\/[^/]+$/.exec(path) !== null) {
    return {
      label: "Review package",
      line: "Review package record — outcomes, findings, artifacts, downloads, and deep links into evidence surfaces.",
    };
  }

  if (path.startsWith("/policy-packs")) {
    return {
      label: "Policy packs",
      line: "Control libraries applied to architecture reviews — what each pack checks for this tenant.",
    };
  }

  if (path.startsWith("/ask")) {
    return {
      label: "Ask this review",
      line: `Pose questions scoped to persisted reviews; answers cite the manifest and evidence trail when available.`,
    };
  }

  if (path.startsWith("/search")) {
    const searchRunId = options?.searchRunId?.trim() ?? "";

    if (searchRunId.length > 0) {
      return {
        label: "Search this review's evidence",
        line: "Find language across this review package's summaries, manifest, and linked metadata.",
      };
    }

    return {
      label: "Search review evidence",
      line: "Find language across review summaries, manifests, and linked metadata (tenant-scoped). Narrow with an optional run filter when you open Search from a review.",
    };
  }

  if (path.startsWith("/compare")) {
    return {
      label: "Advanced review comparison",
      line: "Side-by-side architecture deltas — what changed in scope, posture, risk, and deliverables.",
    };
  }

  return null;
}
