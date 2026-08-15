/**
 * Aggressive demo vs live chrome copy (TB-2218).
 * Makes static-demo and simulator surfaces unmistakably non-live — never soft “sample” wording alone.
 */

import { RULE_BASED_ANALYSIS_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";

export type DemoVsLiveChromeMode = "live" | "static-demo" | "simulator";

export type DemoVsLiveChromeCopy = {
  readonly mode: Exclude<DemoVsLiveChromeMode, "live">;
  readonly bannerTitle: string;
  readonly bannerBody: string;
  readonly watermark: string;
  readonly testId: string;
};

export type DemoVsLiveChromeFlags = {
  readonly usedStaticDemoRun?: boolean;
  readonly isSimulator?: boolean;
  /** Explicit demo / static-operator build env (NEXT_PUBLIC_DEMO_MODE or DEMO_STATIC_OPERATOR). */
  readonly isStaticDemoEnv?: boolean;
};

const STATIC_DEMO_COPY: DemoVsLiveChromeCopy = {
  mode: "static-demo",
  bannerTitle: "NOT LIVE DATA",
  bannerBody:
    "Demonstration / curated sample workspace — this is not your tenant and is not a live architecture review.",
  watermark: "DEMO — NOT LIVE",
  testId: "demo-vs-live-chrome-static-demo",
};

const SIMULATOR_COPY: DemoVsLiveChromeCopy = {
  mode: "simulator",
  bannerTitle: "RULE-BASED — NOT LIVE",
  bannerBody:
    `${RULE_BASED_ANALYSIS_BUYER_LABEL} — results are illustrative and must not be treated as a live tenant review.`,
  watermark: "RULE-BASED — NOT LIVE",
  testId: "demo-vs-live-chrome-simulator",
};

/** Precedence: static-demo run/env wins over simulator so sample payloads stay labeled as demo. */
export function resolveDemoVsLiveChromeMode(flags: DemoVsLiveChromeFlags): DemoVsLiveChromeMode {
  if (flags.usedStaticDemoRun === true || flags.isStaticDemoEnv === true) {
    return "static-demo";
  }

  if (flags.isSimulator === true) {
    return "simulator";
  }

  return "live";
}

export function demoVsLiveChromeCopy(mode: DemoVsLiveChromeMode): DemoVsLiveChromeCopy | null {
  switch (mode) {
    case "live":
      return null;
    case "static-demo":
      return STATIC_DEMO_COPY;
    case "simulator":
      return SIMULATOR_COPY;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function demoVsLiveChromeForFlags(flags: DemoVsLiveChromeFlags): DemoVsLiveChromeCopy | null {
  return demoVsLiveChromeCopy(resolveDemoVsLiveChromeMode(flags));
}