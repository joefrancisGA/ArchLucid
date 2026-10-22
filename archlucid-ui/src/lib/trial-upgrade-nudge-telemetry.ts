import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { TrialUpgradeNudgeTrigger } from "@/lib/trial-upgrade-nudge-trigger";

const allowedTriggers = new Set<TrialUpgradeNudgeTrigger>(["runs", "seats", "expiry"]);

function postTrialUpgradeNudgeTelemetry(pathSuffix: "shown" | "clicked", trigger: TrialUpgradeNudgeTrigger): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!allowedTriggers.has(trigger)) {
    return;
  }

  void fetch(
    `/api/proxy/v1/diagnostics/trial-upgrade-nudge/${pathSuffix}`,
    mergeRegistrationScopeForProxy({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ trigger }),
      keepalive: true,
    }),
  ).catch(() => {
    /* intentional: telemetry must not surface secondary failures */
  });
}

/** Fire-and-forget POST when the upgrade nudge renders for a trigger. */
export function recordTrialUpgradeNudgeShown(trigger: TrialUpgradeNudgeTrigger): void {
  postTrialUpgradeNudgeTelemetry("shown", trigger);
}

/** Fire-and-forget POST when the operator clicks the upgrade nudge CTA. */
export function recordTrialUpgradeNudgeClicked(trigger: TrialUpgradeNudgeTrigger): void {
  postTrialUpgradeNudgeTelemetry("clicked", trigger);
}
