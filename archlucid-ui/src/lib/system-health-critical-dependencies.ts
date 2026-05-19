import { findHealthReadyEntryByName, type HealthReadyResponse } from "@/lib/health-dashboard-types";

export type CriticalDependencyRow = {
  readonly entryName: string;
  readonly label: string;
  readonly status: string;
  readonly detail: string;
};

const CRITICAL_DEPENDENCY_SPECS = [
  { entryName: "database", label: "SQL Server" },
  { entryName: "openai", label: "Azure OpenAI" },
  { entryName: "redis", label: "Redis" },
] as const;

function statusDetailForMissing(entryName: string): string {
  if (entryName === "redis") {
    return "Not registered — Redis is optional; distributed cache may use in-memory fallback.";
  }

  return "Check not reported in readiness payload.";
}

export function buildCriticalDependencyRows(
  entries: HealthReadyResponse["entries"],
): CriticalDependencyRow[] {
  return CRITICAL_DEPENDENCY_SPECS.map((spec) => {
    const entry = findHealthReadyEntryByName(entries, spec.entryName);

    if (entry === null) {
      return {
        entryName: spec.entryName,
        label: spec.label,
        status: "Not configured",
        detail: statusDetailForMissing(spec.entryName),
      };
    }

    return {
      entryName: spec.entryName,
      label: spec.label,
      status: entry.status,
      detail: "Reported by GET /health/ready.",
    };
  });
}
