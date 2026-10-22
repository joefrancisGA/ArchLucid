import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import type { BuyerCtoDemoReadinessVerdict } from "@/lib/buyer/buyer-cto-demo-readiness";

type ClarityWindow = Window & {
  clarity?: (command: string, eventName: string) => void;
};

/** Internal-only signal when demo readiness fails — uses existing Clarity hook when demo packaging is active. */
export function emitDemoReadinessInternalSignal(verdict: BuyerCtoDemoReadinessVerdict): void {
  if (!isCtoDemoPackEnv() || verdict === "ready") {
    return;
  }

  try {
    const clarityWindow = window as ClarityWindow;

    if (typeof clarityWindow.clarity === "function") {
      clarityWindow.clarity("event", `demo_readiness_${verdict.replace(/-/g, "_")}`);
    }

    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "1") {
      console.debug("[demo-readiness]", { verdict, at: new Date().toISOString() });
    }
  } catch {
    /* telemetry must never break internal diagnostics */
  }
}
