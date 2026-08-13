import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import { formatConversationListDate } from "@/lib/locale-datetime";
import {
  getStartCtoDemoTourHref,
  writeBuyerCtoDemoTourActive,
  writeBuyerCtoDemoTourCollapsed,
  clearBuyerCtoDemoVisitedSteps,
  writeBuyerCtoDemoAutoplay,
} from "@/lib/buyer/buyer-cto-demo-tour";

/** Fixed anchor so seeded demo dates always read as recent relative to show day (#17). */
export const BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO = "2026-01-14T16:00:00.000Z";

const SEED_SAMPLE_ROUTE = "/api/seed-sample";

/**
 * Audience-facing caption for each golden-journey step (#15).
 * These are distinct from CtoDemoBuyerValueStrip — no "What you're seeing" prefix
 * so the two surfaces don't duplicate the same framing on spine pages.
 */
export const BUYER_CTO_DEMO_AUDIENCE_CAPTION_LINES: readonly string[] = [
  "Executive outcomes, residual risk posture, and sponsor-ready actions.",
  "Signed package — decisions, findings, and downloadable deliverables.",
  "Evidence-linked traceability from inputs through findings to decisions.",
  "Governance approvals and segregation-of-duties for this review.",
  "Append-only audit trail for compliance and GRC follow-up.",
];

export function buyerCtoDemoAudienceCaption(stepIndex: number): string {
  const safeIndex = Math.max(0, Math.min(stepIndex, BUYER_CTO_DEMO_AUDIENCE_CAPTION_LINES.length - 1));

  return BUYER_CTO_DEMO_AUDIENCE_CAPTION_LINES[safeIndex] ?? BUYER_CTO_DEMO_AUDIENCE_CAPTION_LINES[0];
}

/** 1-based journey step number → href (#14). */
export function getBuyerCtoDemoJourneyStepHref(stepNumber: number): string | null {
  const index = Math.trunc(stepNumber) - 1;

  if (index < 0 || index >= BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.length) {
    return null;
  }

  return BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS[index]?.href ?? null;
}

/** Formats a fixed demo timestamp as a stable relative label (#17). */
export function formatDemoRelativeTimestamp(
  isoTimestamp: string,
  anchor: Date = new Date(BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO),
): string {
  const parsed = Date.parse(isoTimestamp);

  if (!Number.isFinite(parsed)) {
    return isoTimestamp;
  }

  const event = new Date(parsed);
  const diffMs = anchor.getTime() - event.getTime();
  const diffDays = Math.max(0, Math.round(diffMs / (24 * 60 * 60 * 1000)));

  if (diffDays === 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  if (diffDays < 14) {
    return `${diffDays} days ago`;
  }

  const diffWeeks = Math.round(diffDays / 7);

  if (diffWeeks === 1) {
    return "1 week ago";
  }

  if (diffWeeks < 8) {
    return `${diffWeeks} weeks ago`;
  }

  return formatConversationListDate(event.toISOString());
}

export function clearBuyerCtoDemoTourStorage(): void {
  writeBuyerCtoDemoTourActive(false);
  writeBuyerCtoDemoTourCollapsed(false);
  clearBuyerCtoDemoVisitedSteps();
}

async function postDemoSeedSample(): Promise<boolean> {
  try {
    const response = await fetch(SEED_SAMPLE_ROUTE, {
      method: "POST",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export type BuyerCtoDemoResetResult = {
  readonly destinationHref: string;
  readonly seedAttempted: boolean;
  readonly seedSucceeded: boolean;
};

/** Clears tour state, optionally re-seeds showcase data, and returns the tour landing href (#11). */
export async function resetBuyerCtoDemoSession(): Promise<BuyerCtoDemoResetResult> {
  clearBuyerCtoDemoTourStorage();

  const seedAttempted = true;
  const seedSucceeded = await postDemoSeedSample();
  const destinationHref = getStartCtoDemoTourHref();

  return {
    destinationHref,
    seedAttempted,
    seedSucceeded,
  };
}

export type BuyerCtoDemoSoftRestartResult = {
  readonly destinationHref: string;
};

/** Clears visited steps and returns to step 1 without re-seeding showcase data. */
export function softRestartBuyerCtoDemoSession(): BuyerCtoDemoSoftRestartResult {
  clearBuyerCtoDemoVisitedSteps();
  writeBuyerCtoDemoAutoplay(false);

  const destinationHref = getStartCtoDemoTourHref();

  return { destinationHref };
}
