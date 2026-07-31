import type { HealthDisplaySeverity } from "@/lib/health-readiness-presentation";

export type DemoSystemHealthStatus =
  | "Healthy"
  | "Not configured"
  | "Demo limited"
  | "Degraded"
  | "Action needed";

export type DemoHealthSummaryTile = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly severity: HealthDisplaySeverity | "neutral";
};

export type DemoOperationalCheck = {
  readonly id: string;
  readonly label: string;
  readonly status: DemoSystemHealthStatus;
  readonly explanation: string | null;
};

export const DEMO_SYSTEM_HEALTH_PAGE_SUBTITLE =
  "Platform readiness and operational checks for this workspace.";

export const DEMO_SYSTEM_HEALTH_CONTEXT_NOTE =
  "Demo workspace: some live operational checks are limited. Sample health data is shown for evaluation.";

export const DEMO_SYSTEM_HEALTH_LIMITATION_LINES = [
  "Some production-only checks are not run in the sample workspace.",
  "Trial and paid workspaces include full tenant-specific diagnostics.",
] as const;

export const DEMO_SYSTEM_HEALTH_OVERALL_STATUS: DemoSystemHealthStatus = "Healthy";

export const DEMO_SYSTEM_HEALTH_OVERALL_TITLE = "Platform ready for review workflows";

export const DEMO_SYSTEM_HEALTH_OVERALL_SUBTITLE =
  "Core application paths, evidence navigation, and sample reviews are operating normally in this demo workspace.";

export function demoSystemHealthStatusSeverity(status: DemoSystemHealthStatus): HealthDisplaySeverity | "neutral" {
  switch (status) {
    case "Healthy":
      return "healthy";

    case "Demo limited":
      return "advisory";

    case "Not configured":
      return "not-configured";

    case "Degraded":
      return "degraded";

    case "Action needed":
      return "degraded";

    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function buildDemoHealthSummaryTiles(input: {
  readonly lastRefreshedAt: Date | null;
  readonly loading: boolean;
}): DemoHealthSummaryTile[] {
  const lastUpdatedValue =
    input.loading
      ? "Refreshing…"
      : input.lastRefreshedAt === null
        ? "—"
        : input.lastRefreshedAt.toLocaleString();

  return [
    {
      id: "overall",
      label: "Overall status",
      value: DEMO_SYSTEM_HEALTH_OVERALL_STATUS,
      severity: demoSystemHealthStatusSeverity(DEMO_SYSTEM_HEALTH_OVERALL_STATUS),
    },
    {
      id: "application-services",
      label: "Application services",
      value: "Healthy",
      severity: "healthy",
    },
    {
      id: "evidence-search",
      label: "Evidence search",
      value: "Demo limited",
      severity: "advisory",
    },
    {
      id: "ai-services",
      label: "AI services",
      value: "Demo limited",
      severity: "advisory",
    },
    {
      id: "background-jobs",
      label: "Background jobs",
      value: "Healthy",
      severity: "healthy",
    },
    {
      id: "integrations",
      label: "Integrations",
      value: "Not configured",
      severity: "not-configured",
    },
    {
      id: "last-updated",
      label: "Last updated",
      value: lastUpdatedValue,
      severity: "neutral",
    },
  ];
}

export function buildDemoOperationalChecks(): DemoOperationalCheck[] {
  return [
    {
      id: "application-shell",
      label: "Application shell",
      status: "Healthy",
      explanation: "Navigation, workspace context, and review surfaces are responding.",
    },
    {
      id: "review-package-navigation",
      label: "Review navigation",
      status: "Healthy",
      explanation: "Sample reviews open with findings, evidence, and signed records.",
    },
    {
      id: "evidence-graph",
      label: "Evidence graph",
      status: "Healthy",
      explanation: "Evidence trail links resolve for the demo review.",
    },
    {
      id: "search",
      label: "Search",
      status: "Demo limited",
      explanation: "Search runs against sample evidence only in this demo workspace.",
    },
    {
      id: "ai-budget-guardrails",
      label: "AI budget guardrails",
      status: "Demo limited",
      explanation: "Budget guardrails are summarized for evaluation; live tenant limits are not applied here.",
    },
    {
      id: "background-job-queue",
      label: "Background job queue",
      status: "Healthy",
      explanation: "Queued review work completes for sample reviews without delay.",
    },
    {
      id: "digest-delivery",
      label: "Digest delivery",
      status: "Not configured",
      explanation: "Digest delivery is not configured in the demo workspace.",
    },
    {
      id: "integration-readiness",
      label: "Integration readiness",
      status: "Not configured",
      explanation: "Cloud connectors and ITSM integrations are not connected in this demo workspace.",
    },
  ];
}
