import { getShowcaseSponsorHref, getShowcaseManifestHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { isBuyerGoldenSpineRunId } from "@/lib/buyer/buyer-golden-spine-run-id";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY, BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import { comparePageHref } from "@/lib/compare-url-query-params";
import { SHOWCASE_PHI_FINDING_GRAPH_NODE_ID } from "@/lib/findings/finding-inspect-graph-evidence";
import {
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import {
  GOVERNANCE_STANDARDS_AND_RULES_PATH,
  governanceApprovalQueueHref,
  pathMatchesGovernanceAlerts,
  pathMatchesGovernanceApprovalQueue,
  pathMatchesGovernanceAudit,
  pathMatchesGovernanceExceptions,
} from "@/lib/governance/governance-route-paths";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

/**
 * Canonical five-step buyer demo spine — keep in sync with {@link LayerContextStrip} journey chips and home CTAs.
 */
export const BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS = [
  {
    step: 1,
    label: BUYER_SPONSOR_SUMMARY_VOCABULARY.reviewSponsorReportLabel,
    href: getShowcaseSponsorHref(),
    chipTooltip:
      "Condensed outcomes, posture, and monitored risks for sponsor sign-off — the diligence starting point.",
  },
  {
    step: 2,
    label: SIGNED_MANIFEST_LABEL,
    href: getShowcaseManifestHref(),
    chipTooltip: "Versioned record of decisions, findings, and downloadable outputs in this finalized review.",
  },
  {
    step: 3,
    // Surface name (TB-2097 B): destination pill; “Evidence trail” remains the glossary concept.
    label: BUYER_SURFACE_VOCABULARY.evidenceGraph,
    href: `/insights/evidence-graph?runId=${showcaseRunEnc}&graphNodeId=${encodeURIComponent(SHOWCASE_PHI_FINDING_GRAPH_NODE_ID)}`,
    chipTooltip: "Interactive graph linking evidence → findings → decisions → signed review record outputs.",
  },
  {
    step: 4,
    label: "Governance approval",
    href: governanceApprovalQueueHref(SHOWCASE_STATIC_DEMO_RUN_ID),
    chipTooltip: "Governance posture, approvals, and monitoring hooks tied to this review.",
  },
  {
    step: 5,
    label: BUYER_SURFACE_VOCABULARY.auditTrail,
    // Canonical TB-405 path; legacy `/audit` permanently redirects here.
    href: auditTrailNavHref(SHOWCASE_STATIC_DEMO_RUN_ID),
    chipTooltip: "Chronological audit trail of review events for compliance and operational follow-up.",
  },
] as const;

/** Seeded Claims Intake compare pair for optional CTO demo drift beat (step 3b). */
export const BUYER_CTO_DEMO_COMPARE_HREF = comparePageHref(
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  "friendly",
);

export type BuyerGoldenJourneyNavLink = {
  readonly label: string;
  readonly href: string;
};

export type BuyerGoldenJourneyNavOptions = {
  readonly searchRunId?: string;
};

export type ResolvedBuyerGoldenJourneyNav = {
  /** Line shown between prev/next, e.g. "Step 3 of 5 · View evidence trail" */
  readonly summaryLine: string;
  readonly prev: BuyerGoldenJourneyNavLink | null;
  readonly next: BuyerGoldenJourneyNavLink | null;
  /** 0-based index into {@link BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS} on numbered steps; null on hub routes. */
  readonly currentStepIndex: number | null;
};

function normalizedPath(pathname: string): string {
  return (pathname.split("?")[0] ?? "").trim().replace(/\/$/, "") || "/";
}

/**
 * When the URL is on the curated Claims Intake spine, returns adjacent journey links for the layer strip stepper.
 */
export function resolveBuyerGoldenJourneyNav(
  pathname: string,
  options?: BuyerGoldenJourneyNavOptions,
): ResolvedBuyerGoldenJourneyNav | null {
  const path = normalizedPath(pathname);
  const defs = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS;

  const execBase = normalizedPath(getShowcaseSponsorHref());
  const manifestBase = normalizedPath(getShowcaseManifestHref());
  const manifestRecord = signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID);
  const manifestArchitecturePath = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}/architecture`;

  let stepIdx: number | null = null;

  const signedRecordFriendly = /^\/architecture\/reviews\/([^/]+)\/signed-record\b/.exec(path);
  // Live SQL golden manifests use seeded GUIDs under `/governance/signed-records/{id}` (legacy `/signed-records/{id}` redirects here).
  const signedRecordCanonical = /^\/(?:governance\/)?signed-records\/([^/]+)$/.exec(path);

  if (signedRecordFriendly !== null && isBuyerGoldenSpineRunId(signedRecordFriendly[1] ?? "")) {
    stepIdx = 1;
  } else if (
    path === manifestBase
    || path.startsWith(`${manifestBase}/`)
    || path === manifestRecord
    || path === manifestArchitecturePath
    || (signedRecordCanonical !== null && (signedRecordCanonical[1] ?? "").trim().length > 0)
  ) {
    stepIdx = 1;
  } else if (path === execBase) {
    stepIdx = 0;
  } else {
    const reviewSponsor = /^\/architecture\/reviews\/([^/]+)$/.exec(path);

    if (reviewSponsor !== null && isBuyerGoldenSpineRunId(reviewSponsor[1])) {
      stepIdx = 0;
    } else if (path.startsWith("/insights/evidence-graph")) {
      const graphRunId =
        options?.searchRunId?.trim() ??
        new URL(pathname, "http://archlucid.local").searchParams.get("runId")?.trim() ??
        "";

      if (graphRunId.length > 0 && isBuyerGoldenSpineRunId(graphRunId)) {
        stepIdx = 2;
      } else {
        return null;
      }
    } else if (path.startsWith("/insights/ask-review-questions")) {
      return null;
    } else if (path.startsWith("/insights/compare-two-reviews")) {
      return null;
    } else if (path === "/governance/policy-packs" || path.startsWith("/governance/policy-packs/")) {
      return null;
    } else if (
      path === GOVERNANCE_STANDARDS_AND_RULES_PATH
      || path.startsWith(`${GOVERNANCE_STANDARDS_AND_RULES_PATH}/`)
    ) {
      return null;
    } else if (path === "/governance/findings" || path.startsWith("/governance/findings/")) {
      return null;
    } else if (pathMatchesGovernanceExceptions(path)) {
      return null;
    } else if (pathMatchesGovernanceAlerts(path)) {
      return null;
    } else if (pathMatchesGovernanceAudit(path)) {
      // Must run before the `/governance` catch-all — `/audit` permanently redirects to `/governance/audit`.
      stepIdx = 4;
    } else if (pathMatchesGovernanceApprovalQueue(path)) {
      const governanceRunId =
        options?.searchRunId?.trim() ??
        new URL(pathname, "http://archlucid.local").searchParams.get("runId")?.trim() ??
        "";

      if (governanceRunId.length === 0) {
        return null;
      }

      if (!isBuyerGoldenSpineRunId(governanceRunId)) {
        return null;
      }

      stepIdx = 3;
    } else if (path.startsWith("/governance")) {
      return null;
    } else {
      const findingInspect = /^\/architecture\/reviews\/([^/]+)\/findings\/[^/]+\/(?:inspect|evidence-trace)\b/.exec(path);

      if (findingInspect !== null && isBuyerGoldenSpineRunId(findingInspect[1])) {
        stepIdx = 2;
      } else {
        return null;
      }
    }
  }

  if (stepIdx === null) {
    return null;
  }

  const current = defs[stepIdx];

  return {
    summaryLine: `Step ${current.step} of ${defs.length} · ${current.label}`,
    prev: stepIdx > 0 ? { label: defs[stepIdx - 1].label, href: defs[stepIdx - 1].href } : null,
    next: stepIdx < defs.length - 1 ? { label: defs[stepIdx + 1].label, href: defs[stepIdx + 1].href } : null,
    currentStepIndex: stepIdx,
  };
}
