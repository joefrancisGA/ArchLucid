import type { CircuitGateRow, HealthReadyResponse } from "@/lib/health-dashboard-types";
import type { ConfigLintPayload } from "@/lib/health-config-lint-presentation";
import type { ConfigurationHealthPayload } from "@/app/(operator)/internal/health/_sections/admin-health-types";

import { presentConfigLintFindings } from "@/lib/health-config-lint-presentation";
import { HEALTH_READINESS_ANCHOR_ID } from "@/lib/health-dashboard-anchors";
import { healthGroupCountLabel } from "@/lib/health-group-metrics";
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
  | "readiness"
  | "configuration"
  | "ai-services"
  | "background-tasks";

export type HealthSummaryTile = {
  readonly id: HealthSummaryTileId;
  readonly label: string;
  readonly value: string;
  readonly severity: HealthDisplaySeverity | "neutral";
  /** Counts behind the status word. A tile whose only content is a status word restates the hero. */
  readonly detail?: string;
  /** Section id this tile summarises, rendered as a same-page jump. */
  readonly anchorId?: string;
};

/**
 * Tile for a subset of readiness checks. An empty subset reports "Not reported" rather than
 * inheriting the healthy default — a tile must not claim green for a probe that never ran.
 */
function buildSubsetTile(
  id: HealthSummaryTileId,
  label: string,
  rows: readonly PresentedReadinessRow[],
): HealthSummaryTile {
  if (rows.length === 0) {
    return {
      id,
      label,
      value: "Not reported",
      severity: "neutral",
      detail: "No probe for this area in the readiness payload.",
    };
  }

  const severity = aggregateSeverityFromRows(rows);

  return {
    id,
    label,
    value: summarizeTileStatus(severity),
    severity,
    detail: healthGroupCountLabel(rows),
  };
}

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
  const configurationEvaluated = configurationProbeRows.length > 0 || input.configLint !== null;

  return [
    {
      id: "readiness",
      label: "Readiness checks",
      value: summarizeTileStatus(readinessSeverity),
      severity: readinessSeverity,
      detail: healthGroupCountLabel(readinessRows),
      anchorId: HEALTH_READINESS_ANCHOR_ID,
    },
    configurationEvaluated
      ? {
          id: "configuration",
          label: "Configuration",
          value: summarizeTileStatus(configurationSeverity),
          severity: configurationSeverity,
          detail: healthGroupCountLabel(configurationProbeRows),
        }
      : {
          id: "configuration",
          label: "Configuration",
          value: "Not evaluated here",
          severity: "neutral",
          detail: "Configuration advisories are reported on the Diagnostics dashboard.",
        },
    buildSubsetTile("ai-services", "AI services", rowsForCheckIds(readinessEntries, AI_SERVICE_CHECK_IDS)),
    buildSubsetTile(
      "background-tasks",
      "Background tasks",
      rowsForCheckIds(readinessEntries, BACKGROUND_CHECK_IDS),
    ),
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
