/** MG-006 — demo/trial/static remain eval; Working production stays dense instrument. */
import { resolveProductionEvalChrome } from "@/lib/production-desk-chrome";

export const MODE_GRAVITY_DEMO_TRIAL_EVAL_ADR_CITATION = "0094" as const;

export const MODE_GRAVITY_DEMO_TRIAL_EVAL_OWNER = "MG-006" as const;

/** Seats that must keep eval chrome per ADR 0080 / WS-23. */
export const MODE_GRAVITY_EVAL_CHROME_SEATS = [
  { label: "guided", workspaceMode: "guided" as const },
  { label: "demo-marketing", workspaceMode: "working" as const, demoMarketingChrome: true },
  { label: "static-demo", workspaceMode: "working" as const, staticDemoFallback: true },
  { label: "frictionless-trial", workspaceMode: "working" as const, frictionlessTrial: true },
] as const;

export function isModeGravityEvalChromeSeat(input: {
  workspaceMode: "working" | "guided";
  staticDemoFallback?: boolean;
  demoMarketingChrome?: boolean;
  frictionlessTrial?: boolean;
}): boolean {
  return resolveProductionEvalChrome({
    workspaceMode: input.workspaceMode,
    staticDemoFallback: input.staticDemoFallback ?? false,
    demoMarketingChrome: input.demoMarketingChrome ?? false,
    frictionlessTrial: input.frictionlessTrial ?? false,
  });
}
