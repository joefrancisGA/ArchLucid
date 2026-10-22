import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { TeamExpansionNudgeTrigger } from "@/lib/team-expansion-nudge-trigger";

const allowedTriggers = new Set<TeamExpansionNudgeTrigger>(["seats", "workspaces"]);

function postTeamExpansionNudgeTelemetry(pathSuffix: "shown" | "clicked", trigger: TeamExpansionNudgeTrigger): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!allowedTriggers.has(trigger)) {
    return;
  }

  void fetch(
    `/api/proxy/v1/diagnostics/team-expansion-nudge/${pathSuffix}`,
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

/** Fire-and-forget POST when the Team expansion nudge renders for a trigger. */
export function recordTeamExpansionNudgeShown(trigger: TeamExpansionNudgeTrigger): void {
  postTeamExpansionNudgeTelemetry("shown", trigger);
}

/** Fire-and-forget POST when the operator clicks the Team expansion nudge CTA. */
export function recordTeamExpansionNudgeClicked(trigger: TeamExpansionNudgeTrigger): void {
  postTeamExpansionNudgeTelemetry("clicked", trigger);
}
