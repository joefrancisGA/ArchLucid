import type { FirstPilotSponsorDisposition } from "@/lib/first-pilot-command-center-phase";
import type { FirstPilotReadinessStatus } from "@/lib/first-pilot-readiness-cockpit";
import type { FirstPilotOperatingRailStepStatus } from "@/lib/first-pilot-operating-rail-status";
import { ENTERPRISE_STATUS_LABELS, type EnterpriseStatusKind } from "@/lib/design-tokens";

/** Canonical first-pilot operator labels shared by cockpit rows and runbooks. */
export type FirstPilotOperatorStatusLabel = "READY" | "NEEDS ATTENTION" | "BLOCKED" | "DEFERRED" | "PENDING";

/** Maps readiness row status to `StatusTag` kinds (TB-116 / TB-121). */
export function mapReadinessStatusToEnterpriseKind(status: FirstPilotReadinessStatus): EnterpriseStatusKind {
  switch (status) {
    case "ready":
      return "ready";

    case "attention":
      return "needs-attention";

    case "blocked":
      return "blocked";

    case "unknown":
      return "neutral";

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

/** Title-case labels for `StatusTag` (pending uses explicit copy). */
export function mapReadinessStatusToStatusTagLabel(status: FirstPilotReadinessStatus): string {
  switch (status) {
    case "ready":
      return ENTERPRISE_STATUS_LABELS.ready;

    case "attention":
      return ENTERPRISE_STATUS_LABELS["needs-attention"];

    case "blocked":
      return ENTERPRISE_STATUS_LABELS.blocked;

    case "unknown":
      return "Pending";

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export function mapReadinessStatusToOperatorLabel(
  status: FirstPilotReadinessStatus,
): FirstPilotOperatorStatusLabel {
  switch (status) {
    case "ready":
      return "READY";
    case "attention":
      return "NEEDS ATTENTION";
    case "blocked":
      return "BLOCKED";
    case "unknown":
      return "PENDING";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export function mapSponsorDispositionToEnterpriseKind(
  disposition: FirstPilotSponsorDisposition,
): EnterpriseStatusKind {
  switch (disposition) {
    case "send":
      return "ready";

    case "hold":
      return "needs-attention";

    case "readiness-only":
    case "deferred":
      return "neutral";

    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}

export function mapOperatingRailStepToEnterpriseKind(
  status: FirstPilotOperatingRailStepStatus,
): EnterpriseStatusKind {
  switch (status) {
    case "complete":
      return "ready";

    case "current":
      return "in-progress";

    case "attention":
      return "needs-attention";

    case "upcoming":
      return "draft";

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export function mapOperatingRailStepToStatusTagLabel(status: FirstPilotOperatingRailStepStatus): string {
  switch (status) {
    case "complete":
      return ENTERPRISE_STATUS_LABELS.ready;

    case "current":
      return ENTERPRISE_STATUS_LABELS["in-progress"];

    case "attention":
      return ENTERPRISE_STATUS_LABELS["needs-attention"];

    case "upcoming":
      return "Upcoming";

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export const FIRST_PILOT_OPERATOR_STATUS_VOCABULARY = {
  ready: "READY — no blocking action for this row.",
  needsAttention: "NEEDS ATTENTION — review before sponsor send or external circulation.",
  blocked: "BLOCKED — resolve before sponsor handoff or procurement follow-up.",
  deferred: "DEFERRED — explicitly out of V1 first-pilot scope; document in proof disposition.",
  nextAction: "NEXT ACTION — one primary link surfaced by the command center phase card.",
} as const;
