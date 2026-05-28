import type { FirstPilotReadinessStatus } from "@/lib/first-pilot-readiness-cockpit";

/** Canonical first-pilot operator labels shared by cockpit rows and runbooks. */
export type FirstPilotOperatorStatusLabel = "READY" | "WARN" | "HOLD" | "DEFERRED";

export function mapReadinessStatusToOperatorLabel(
  status: FirstPilotReadinessStatus,
): FirstPilotOperatorStatusLabel {
  switch (status) {
    case "ready":
      return "READY";
    case "attention":
      return "WARN";
    case "blocked":
      return "HOLD";
    case "unknown":
      return "HOLD";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export const FIRST_PILOT_OPERATOR_STATUS_VOCABULARY = {
  ready: "READY — no blocking action for this row.",
  warn: "WARN — review before sponsor send or external circulation.",
  hold: "HOLD — resolve before sponsor handoff or procurement follow-up.",
  deferred: "DEFERRED — explicitly out of V1 first-pilot scope; document in proof disposition.",
  nextAction: "NEXT ACTION — one primary link surfaced by the command center phase card.",
} as const;
