import type { CircuitGateRow, HealthReadyResponse } from "@/lib/health-dashboard-types";
import type { ConfigLintPayload } from "@/lib/health-config-lint-presentation";
import type { ConfigurationHealthPayload } from "@/app/(operator)/admin/health/_sections/admin-health-types";

import { presentConfigLintFindings } from "@/lib/health-config-lint-presentation";
import {
  aggregateSeverityFromRows,
  groupReadinessRows,
  presentConfigurationProbeRow,
  presentReadinessRow,
  resolveHealthDisplaySeverity,
  summarizeTileStatus,
  type HealthDisplaySeverity,
  type PresentedReadinessRow,
} from "@/lib/health-readiness-presentation";

export type HealthSummaryTileId =
  | "overall"
  | "readiness"
  | "configuration"
  | "ai-services"
  | "background-tasks";

export type HealthSummaryTile = {
  readonly id: HealthSummaryTileId;
  readonly label: string;
  readonly value: string;
  readonly severity: HealthDisplaySeverity | "neutral";
};

const AI_SERVICE_CHECK_IDS = new Set(["openai", "vector_store", "retrieval_index_freshness", "graph-projection-cache"]);
const BACKGROUND_CHECK_IDS = new Set(["data_archival", "data_consistency", "orchestrator"]);

function rowsForCheckIds(entries: HealthReadyResponse["entries"], ids: ReadonlySet<string>): PresentedReadinessRow[] {
  return entries
    .filter((entry) => ids.has(entry.name))
    .map((entry) => presentReadinessRow(entry.name, entry.status, entry.durationMs));
}

function configurationRows(configurationHealth: ConfigurationHealthPayload | null): PresentedReadinessRow[] {
  return (configurationHealth?.checks ?? []).map((row) =>
    presentConfigurationProbeRow(row.name, row.status, row.detail),
  );
}

function circuitSeverity(gates: readonly CircuitGateRow[]): HealthDisplaySeverity {
  if (gates.length === 0) {
    return "healthy";
  }

  return gates.reduce<HealthDisplaySeverity>((current, gate) => {
    const severity = resolveHealthDisplaySeverity(gate.state);

    if (severity === "failing" || current === "failing") {
      return "failing";
    }

    if (severity === "degraded" || current === "degraded") {
      return "degraded";
    }

    return current;
  }, "healthy");
}

function lintSeverity(payload: ConfigLintPayload | null): HealthDisplaySeverity {
  const findings = presentConfigLintFindings(payload);

  if (findings.blocking.length > 0) {
    return "failing";
  }

  if (findings.advisory.length > 0) {
    return "advisory";
  }

  return "healthy";
}

export function buildHealthSummaryTiles(input: {
  readonly overallStatus: string;
  readonly ready: HealthReadyResponse | null;
  readonly configurationHealth: ConfigurationHealthPayload | null;
  readonly configLint: ConfigLintPayload | null;
  readonly circuitGates: readonly CircuitGateRow[];
  readonly lastRefreshedAt: Date | null;
  readonly loading: boolean;
}): HealthSummaryTile[] {
  const readinessEntries = input.ready?.entries ?? [];
  const readinessGroups = groupReadinessRows(readinessEntries);
  const readinessRows = readinessGroups.flatMap((group) => group.rows);
  const readinessSeverity = aggregateSeverityFromRows(readinessRows);
  const configurationProbeRows = configurationRows(input.configurationHealth);
  const configurationSeverity = worstOf(
    aggregateSeverityFromRows(configurationProbeRows),
    lintSeverity(input.configLint),
  );
  const aiSeverity = aggregateSeverityFromRows(rowsForCheckIds(readinessEntries, AI_SERVICE_CHECK_IDS));
  const backgroundSeverity = aggregateSeverityFromRows(rowsForCheckIds(readinessEntries, BACKGROUND_CHECK_IDS));
  const overallSeverity = resolveHealthDisplaySeverity(input.overallStatus);

  return [
    {
      id: "overall",
      label: "Overall status",
      value: summarizeTileStatus(overallSeverity),
      severity: overallSeverity,
    },
    {
      id: "readiness",
      label: "Readiness checks",
      value: summarizeTileStatus(readinessSeverity),
      severity: readinessSeverity,
    },
    {
      id: "configuration",
      label: "Configuration",
      value: summarizeTileStatus(configurationSeverity),
      severity: configurationSeverity,
    },
    {
      id: "ai-services",
      label: "AI services",
      value: summarizeTileStatus(aiSeverity),
      severity: aiSeverity,
    },
    {
      id: "background-tasks",
      label: "Background tasks",
      value: summarizeTileStatus(backgroundSeverity),
      severity: backgroundSeverity,
    },
  ];
}

function worstOf(left: HealthDisplaySeverity, right: HealthDisplaySeverity): HealthDisplaySeverity {
  const rank: Record<HealthDisplaySeverity, number> = {
    failing: 5,
    degraded: 4,
    advisory: 3,
    unknown: 2,
    "not-configured": 1,
    healthy: 0,
  };

  return rank[left] >= rank[right] ? left : right;
}

export function humanizeCircuitGateName(name: string): string {
  const normalized = name.trim().toLowerCase();

  if (normalized.includes("embedding")) {
    return "Embedding service circuit";
  }

  if (normalized.includes("completion") || normalized.includes("chat")) {
    return "Completion service circuit";
  }

  return name
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export { circuitSeverity };
