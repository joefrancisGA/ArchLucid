import type { HealthReadyResponse } from "@/lib/health-dashboard-types";

export type SetupHealthTone = "ready" | "attention" | "unknown";

export type SetupHealthPresentation = {
  readonly tone: SetupHealthTone;
  readonly label: string;
  readonly isHealthy: boolean;
};

/** Maps anonymous `GET /health/ready` summary to operator-facing setup health copy. */
export function resolveSetupHealthPresentation(body: HealthReadyResponse | null): SetupHealthPresentation {
  if (body === null) {
    return {
      tone: "unknown",
      label: "Workspace setup incomplete",
      isHealthy: false,
    };
  }

  const status = (body.status ?? "").toLowerCase();

  if (status.includes("healthy") || status.includes("ok")) {
    return {
      tone: "ready",
      label: "Setup healthy",
      isHealthy: true,
    };
  }

  if (status.includes("degraded") || status.includes("warn")) {
    return {
      tone: "attention",
      label: "Setup needs attention",
      isHealthy: false,
    };
  }

  return {
    tone: "attention",
    label: "Setup blocked",
    isHealthy: false,
  };
}
