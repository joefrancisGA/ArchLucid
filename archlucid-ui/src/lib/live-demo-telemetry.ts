import { ensureAppInsights } from "@/lib/telemetry";

import type { LiveDemoWalkthroughStepId } from "./live-demo-walkthrough-steps";

export type LiveDemoConversionAction =
  | "evaluation"
  | "evaluation-early"
  | "enterprise-demo"
  | "full-review";

export function trackLiveDemoWalkthroughStarted(): void {
  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent({ name: "LiveDemoWalkthroughStarted" });
  });
}

export function trackLiveDemoStepViewed(stepId: LiveDemoWalkthroughStepId): void {
  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent({ name: "LiveDemoStepViewed" }, { stepId });
  });
}

export function trackLiveDemoArtifactOpened(destination: string): void {
  const normalized = destination.trim().length > 0 ? destination : "unknown";

  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent({ name: "LiveDemoArtifactOpened" }, { destination: normalized });
  });
}

export function trackLiveDemoConversionClick(action: LiveDemoConversionAction): void {
  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent({ name: "LiveDemoConversionClick" }, { action });
  });
}
