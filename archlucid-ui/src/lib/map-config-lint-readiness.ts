import type { AdminConfigLintSummary } from "@/lib/fetch-admin-config-lint";
import type { FirstPilotReadinessStatus } from "@/lib/first-pilot-readiness-cockpit";

export type ConfigLintReadinessCopy = {
  readonly status: FirstPilotReadinessStatus;
  readonly summary: string;
};

/** Maps admin config-lint payload to cockpit PASS/WARN/HOLD-style rows (#4). */
export function mapConfigLintReadiness(input: {
  readonly canAdmin: boolean;
  readonly lint: AdminConfigLintSummary | null;
}): ConfigLintReadinessCopy {
  if (!input.canAdmin) {
    return {
      status: "unknown",
      summary: "Configuration lint is available to workspace admins on system health.",
    };
  }

  if (input.lint === null || input.lint.loadFailed) {
    return {
      status: "unknown",
      summary: "Config lint could not be loaded — open system health to inspect blocking and advisory findings.",
    };
  }

  if (input.lint.blockingCount > 0) {
    return {
      status: "blocked",
      summary: `${input.lint.blockingCount} blocking config-lint finding(s) — resolve before pilot sign-off.`,
    };
  }

  if (input.lint.advisoryCount > 0) {
    return {
      status: "attention",
      summary: `${input.lint.advisoryCount} advisory config-lint finding(s) — review before sponsor export.`,
    };
  }

  return {
    status: "ready",
    summary: "Config lint reports no blocking or advisory production-like misconfigurations.",
  };
}
