import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";

export type DemoJourneyTelemetryEvent =
  | { readonly kind: "step_entered"; readonly stepIndex: number; readonly stepLabel: string }
  | { readonly kind: "step_exited"; readonly stepIndex: number; readonly dwellSeconds: number }
  | { readonly kind: "tour_ended"; readonly stepsVisitedCount: number };

type ClarityWindow = Window & {
  clarity?: (command: string, eventName: string) => void;
};

/** Fire-and-forget demo tour instrumentation — never throws. */
export function emitDemoJourneyTelemetry(event: DemoJourneyTelemetryEvent): void {
  if (!isCtoDemoPackEnv()) {
    return;
  }

  try {
    const clarityWindow = window as ClarityWindow;

    if (typeof clarityWindow.clarity === "function") {
      clarityWindow.clarity("event", `demo_${event.kind}`);
    }

    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1") {
      console.debug("[demo-journey]", event);
    }
  } catch {
    /* telemetry must never break the demo */
  }
}
