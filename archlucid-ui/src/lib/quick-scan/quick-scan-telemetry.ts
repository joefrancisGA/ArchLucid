import { ensureAppInsights } from "@/lib/telemetry";

export type QuickScanConversionAction = "sign-in" | "demo" | "workspace";

export function trackQuickScanSampleViewed(capacityState: string): void {
  const state = capacityState.trim().length > 0 ? capacityState : "unknown";

  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent(
      { name: "QuickScanSampleViewed" },
      {
        capacityState: state,
      },
    );
  });
}

export function trackQuickScanConversionClick(
  action: QuickScanConversionAction,
  capacityState: string,
): void {
  const state = capacityState.trim().length > 0 ? capacityState : "unknown";

  void ensureAppInsights().then((ai) => {
    if (ai === null) {
      return;
    }

    ai.trackEvent(
      { name: "QuickScanConversionClick" },
      {
        action,
        capacityState: state,
      },
    );
  });
}
