/**
 * TB-2266 — Trial funnel ≠ Demo readiness vocabulary rail.
 *
 * Why two surfaces exist:
 * - Trial funnel (`/internal/trial-funnel`) is the *conversion metrics* view —
 *   cohort stages, timing, and first-review cost for trial-to-paid funnel ops.
 * - Demo readiness (`/internal/demo-readiness`) is the *presenter preflight* —
 *   employee-only CTO demo diagnostics before a live buyer walkthrough.
 *
 * They stay separate because measuring trial conversion is not the same job as
 * checking whether a demo environment is ready to present.
 */

import {
  INTERNAL_DEMO_READINESS_PATH,
  INTERNAL_TRIAL_FUNNEL_PATH,
} from "@/lib/internal-ops-route-paths";

export type TrialFunnelDemoReadinessSurfaceId = "trial-funnel" | "demo-readiness";

export type TrialFunnelDemoReadinessLink = {
  readonly id: TrialFunnelDemoReadinessSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type TrialFunnelDemoReadinessVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly trialFunnelLink: TrialFunnelDemoReadinessLink;
  readonly demoReadinessLink: TrialFunnelDemoReadinessLink;
};

export const TRIAL_FUNNEL_DEMO_READINESS_HEADING =
  "Trial funnel and demo readiness do different jobs" as const;

export const TRIAL_FUNNEL_DEMO_READINESS_WHY_TWO =
  "Trial funnel shows conversion metrics — cohort stages, timing, and first-review cost for trial-to-paid funnel ops. Demo readiness is the presenter preflight for employee-only CTO demo diagnostics before a live buyer walkthrough. Measuring trial conversion is not the same as checking whether a demo environment is ready to present." as const;

export const TRIAL_FUNNEL_DEMO_READINESS_COMPACT_LINE =
  "Trial funnel is conversion metrics; demo readiness is presenter preflight — open the other when you need both." as const;

export const TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK: TrialFunnelDemoReadinessLink = {
  id: "trial-funnel",
  label: "Trial funnel",
  href: INTERNAL_TRIAL_FUNNEL_PATH,
  whenToUse: "Inspect trial-to-paid cohort stages, timing, and first-review cost.",
};

export const TRIAL_FUNNEL_DEMO_READINESS_DEMO_READINESS_LINK: TrialFunnelDemoReadinessLink = {
  id: "demo-readiness",
  label: "Demo readiness",
  href: INTERNAL_DEMO_READINESS_PATH,
  whenToUse: "Run employee-only CTO demo diagnostics before a live buyer walkthrough.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildTrialFunnelDemoReadinessVocabulary(): TrialFunnelDemoReadinessVocabularyModel {
  return {
    heading: TRIAL_FUNNEL_DEMO_READINESS_HEADING,
    whyTwo: TRIAL_FUNNEL_DEMO_READINESS_WHY_TWO,
    compactLine: TRIAL_FUNNEL_DEMO_READINESS_COMPACT_LINE,
    trialFunnelLink: TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK,
    demoReadinessLink: TRIAL_FUNNEL_DEMO_READINESS_DEMO_READINESS_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveTrialFunnelDemoReadinessPeerLink(
  currentSurfaceId: TrialFunnelDemoReadinessSurfaceId,
): TrialFunnelDemoReadinessLink {
  if (currentSurfaceId === "trial-funnel") {
    return TRIAL_FUNNEL_DEMO_READINESS_DEMO_READINESS_LINK;
  }

  return TRIAL_FUNNEL_DEMO_READINESS_TRIAL_FUNNEL_LINK;
}
