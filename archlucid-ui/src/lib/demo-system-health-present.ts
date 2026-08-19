import type { HealthDisplaySeverity } from "@/lib/health-readiness-presentation";
import { EVIDENCE_TRAIL_SEARCH } from "@/lib/search-surface-disambiguation";

export type DemoSystemHealthStatus =
  | "Healthy"
  | "Not configured"
  | "Sample scope"
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
  "This evaluation workspace shows sample operational checks so you can judge readiness before connecting production dependencies.";

export const DEMO_SYSTEM_HEALTH_LIMITATION_LINES = [
  "Search and AI budget checks use sample data — full tenant diagnostics appear after you connect a trial or paid workspace.",
  "Digest delivery and cloud/ITSM connectors stay optional until you configure them; they are not required to start a pilot review.",
] as const;

export const DEMO_SYSTEM_HEALTH_OVERALL_STATUS: DemoSystemHealthStatus = "Healthy";

export const DEMO_SYSTEM_HEALTH_OVERALL_TITLE = "Ready for pilot review workflows";

export const DEMO_SYSTEM_HEALTH_OVERALL_SUBTITLE =
  "Core application paths, evidence navigation, and sample reviews are operating normally in this evaluation workspace.";

export function demoSystemHealthStatusSeverity(status: DemoSystemHealthStatus): HealthDisplaySeverity | "neutral" {
  switch (status) {
    case "Healthy":
      return "healthy";

    case "Sample scope":
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

export function buildDemoHealthSummaryTiles(): DemoHealthSummaryTile[] {
  // No overall tile: the overall-status hero renders directly above this grid.
  return [
    {
      id: "application-services",
      label: "Application services",
      value: "Healthy",
      severity: "healthy",
    },
    {
      id: "evidence-search",
      label: "Evidence search",
      value: "Sample scope",
      severity: "advisory",
    },
    {
      id: "ai-services",
      label: "AI services",
      value: "Sample scope",
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
      explanation: "Sample reviews open with findings, evidence, and sealed records.",
    },
    {
      id: "evidence-graph",
      label: "Evidence graph",
      status: "Healthy",
      explanation: "Evidence trail links resolve for the sample review.",
    },
    {
      id: "search",
      label: EVIDENCE_TRAIL_SEARCH.shortNavLabel,
      status: "Sample scope",
      explanation: "Evidence search runs against sample evidence in this evaluation workspace.",
    },
    {
      id: "ai-budget-guardrails",
      label: "AI budget guardrails",
      status: "Sample scope",
      explanation: "Budget guardrails are summarized for evaluation; live tenant limits apply after you connect a trial or paid workspace.",
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
      explanation: "Optional — configure digests when you want scheduled digest summaries.",
    },
    {
      id: "integration-readiness",
      label: "Integration readiness",
      status: "Not configured",
      explanation: "Optional — cloud connectors and ITSM integrations are not required to start a pilot review.",
    },
  ];
}
