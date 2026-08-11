import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { HealthReadyResponse } from "@/lib/health-dashboard-types";

export type TroubleshootingPlatformStatus = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

type PlatformSeverity = "healthy" | "degraded" | "unhealthy" | "unknown";

function severityFromStatus(raw: string): PlatformSeverity {
  const status = raw.toLowerCase();

  if (status.includes("unhealthy") || status.includes("fail") || status.includes("error")) {
    return "unhealthy";
  }

  if (status.includes("degraded") || status.includes("warn")) {
    return "degraded";
  }

  if (status.includes("healthy") || status.includes("ok")) {
    return "healthy";
  }

  return "unknown";
}

function worseSeverity(left: PlatformSeverity, right: PlatformSeverity): PlatformSeverity {
  const rank: Record<PlatformSeverity, number> = {
    healthy: 0,
    unknown: 1,
    degraded: 2,
    unhealthy: 3,
  };

  return rank[right] > rank[left] ? right : left;
}

/** Maps anonymous readiness to troubleshooting Start-here StatusTag copy (worst of overall + entries). */
export function resolveTroubleshootingPlatformStatus(
  body: HealthReadyResponse | null,
): TroubleshootingPlatformStatus {
  if (body === null) {
    return {
      kind: "neutral",
      label: "Status unavailable",
    };
  }

  let severity = severityFromStatus(body.status ?? "");

  for (const entry of body.entries ?? []) {
    severity = worseSeverity(severity, severityFromStatus(entry.status ?? ""));
  }

  switch (severity) {
    case "unhealthy":
      return {
        kind: "blocked",
        label: "Platform unhealthy",
      };

    case "degraded":
      return {
        kind: "needs-attention",
        label: "Platform degraded",
      };

    case "healthy":
      return {
        kind: "ready",
        label: "Platform healthy",
      };

    case "unknown":
      return {
        kind: "needs-attention",
        label: "Platform status unclear",
      };

    default: {
      const exhaustive: never = severity;

      return exhaustive;
    }
  }
}

export function formatTroubleshootingCheckedAt(checkedAt: Date): string {
  const time = checkedAt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Checked at ${time}`;
}
