import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

/**
 * Stable header strip orientation for buyer-polished shell — replaces abstract layer questions where path is known.
 */
export function buyerPolishedRouteOrientation(pathname: string): {
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
      label: "Risk finding",
      line: "Severity, impact, mitigation, and trace links into the finalized review package.",
    };
  }

  if (path.startsWith(`/executive/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)) {
    return {
      label: "Executive Summary",
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
      line: "Sealed manifest record — decisions, findings counts, artifacts, and download bundle.",
    };
  }

  if (path.startsWith("/graph")) {
    return {
      label: "Evidence graph",
      line: "Trace how reviewed source context and policy checks feed prioritized risk findings, decisions, the signed manifest, and deliverables.",
    };
  }

  if (path.startsWith("/governance")) {
    return {
      label: "Governance approval record",
      line: "Signed approval record for this workspace — ties to evidence without replacing change-management decisions.",
    };
  }

  if (path.startsWith("/audit")) {
    return {
      label: "Audit Trail",
      line: `Immutable lifecycle events correlated to reviews such as ${SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE}.`,
    };
  }

  if (path.startsWith(`/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}`)) {
    return {
      label: SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
      line: "Finalized decision record — findings, sealed manifest, evidence graph, governance disposition, and deliverables.",
    };
  }

  if (/^\/reviews\/[^/]+$/.exec(path) !== null) {
    return {
      label: "Review package",
      line: "Run record — outcomes, findings, artifacts, downloads, and deep links into evidence surfaces.",
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
      line: `Pose questions scoped to persisted reviews; answers cite the manifest and evidence graph when available.`,
    };
  }

  if (path.startsWith("/search")) {
    return {
      label: "Search this review's evidence",
      line: "Find language across review summaries, manifests, and linked metadata (tenant-scoped).",
    };
  }

  if (path.startsWith("/compare")) {
    return {
      label: "Compare reviews",
      line: "Side-by-side architecture deltas — what changed in scope, posture, risk, and deliverables.",
    };
  }

  return null;
}
