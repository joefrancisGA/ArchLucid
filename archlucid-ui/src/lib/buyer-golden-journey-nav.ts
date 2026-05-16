import { getShowcaseExecutiveHref, getShowcaseManifestHref } from "@/lib/buyer-safe-review-navigation";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

/**
 * Canonical five-step buyer demo spine — keep in sync with {@link BuyerGoldenJourneyStrip} home card.
 */
export const BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS = [
  { step: 1, label: "Executive summary", href: getShowcaseExecutiveHref() },
  { step: 2, label: "Signed manifest", href: getShowcaseManifestHref() },
  { step: 3, label: BUYER_SURFACE_VOCABULARY.evidenceGraphNav, href: `/graph?runId=${showcaseRunEnc}` },
  { step: 4, label: "Governance approval", href: `/governance?runId=${showcaseRunEnc}` },
  { step: 5, label: BUYER_SURFACE_VOCABULARY.auditTrail, href: `/audit?runId=${showcaseRunEnc}` },
] as const;

export type BuyerGoldenJourneyNavLink = {
  readonly label: string;
  readonly href: string;
};

export type ResolvedBuyerGoldenJourneyNav = {
  /** Line shown between prev/next, e.g. "Step 3 of 5 · Evidence graph" */
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
export function resolveBuyerGoldenJourneyNav(pathname: string): ResolvedBuyerGoldenJourneyNav | null {
  const path = normalizedPath(pathname);
  const defs = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS;

  const execBase = normalizedPath(getShowcaseExecutiveHref());
  const manifestBase = normalizedPath(getShowcaseManifestHref());
  const manifestRecord = `/manifests/${SHOWCASE_STATIC_DEMO_MANIFEST_ID}`;

  let stepIdx: number | null = null;

  if (path === execBase || path.startsWith(`${execBase}/`)) {
    stepIdx = 0;
  } else if (path === manifestBase || path.startsWith(`${manifestBase}/`) || path === manifestRecord) {
    stepIdx = 1;
  } else if (path.startsWith("/graph")) {
    stepIdx = 2;
  } else if (path.startsWith("/governance")) {
    stepIdx = 3;
  } else if (path.startsWith("/audit")) {
    stepIdx = 4;
  } else {
    const workspace = /^\/reviews\/([^/]+)$/.exec(path);

    if (
      workspace !== null &&
      canonicalizeDemoRunId(workspace[1]) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID)
    ) {
      return {
        summaryLine: "Review package overview — between Executive summary and signed manifest",
        prev: { label: defs[0].label, href: defs[0].href },
        next: { label: defs[1].label, href: defs[1].href },
        currentStepIndex: null,
      };
    }

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
