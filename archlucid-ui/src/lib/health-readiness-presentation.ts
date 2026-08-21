import type { HealthReadyResponse } from "@/lib/health-dashboard-types";

export type HealthReadinessCategoryId =
  | "core-application"
  | "data-stores"
  | "evidence-retrieval"
  | "governance-content"
  | "integrations"
  | "background-workers";

export type HealthReadinessCategory = {
  readonly id: HealthReadinessCategoryId;
  readonly title: string;
};

export const HEALTH_READINESS_CATEGORIES: readonly HealthReadinessCategory[] = [
  { id: "core-application", title: "Core application" },
  { id: "data-stores", title: "Data stores" },
  { id: "evidence-retrieval", title: "Evidence and retrieval" },
  { id: "governance-content", title: "Governance content" },
  { id: "integrations", title: "Integrations" },
  { id: "background-workers", title: "Background workers" },
] as const;

const READINESS_CHECK_CATEGORY: Readonly<Record<string, HealthReadinessCategoryId>> = {
  database: "data-stores",
  database_liveness: "core-application",
  sql_system_plane: "data-stores",
  "sql-read-replica": "data-stores",
  redis: "data-stores",
  blob_storage: "data-stores",
  keyvault: "integrations",
  openai: "integrations",
  azure_service_bus: "integrations",
  vector_store: "evidence-retrieval",
  retrieval_index_freshness: "evidence-retrieval",
  "graph-projection-cache": "evidence-retrieval",
  schema_files: "governance-content",
  compliance_rule_pack: "governance-content",
  run_golden_manifest_consistency: "governance-content",
  orchestrator: "core-application",
  agent_execution_mode: "core-application",
  temp_directory: "core-application",
  demo_viewer_data: "core-application",
  data_archival: "background-workers",
  data_consistency: "background-workers",
};

const READINESS_CHECK_LABELS: Readonly<Record<string, string>> = {
  database: "Primary database",
  database_liveness: "Database liveness",
  sql_system_plane: "System database",
  "sql-read-replica": "Read replica",
  redis: "Distributed cache (Redis)",
  blob_storage: "Artifact storage",
  keyvault: "Secrets store connectivity",
  openai: "AI model service",
  azure_service_bus: "Message bus",
  vector_store: "Search index",
  retrieval_index_freshness: "Search index freshness",
  "graph-projection-cache": "Evidence graph cache",
  schema_files: "Schema bootstrap files",
  compliance_rule_pack: "Compliance rule packs",
  run_golden_manifest_consistency: "Finalized review records",
  orchestrator: "Review orchestration",
  agent_execution_mode: "Agent execution mode",
  temp_directory: "Temporary workspace storage",
  demo_viewer_data: "Demo workspace data",
  data_archival: "Data retention archival",
  data_consistency: "Background consistency reconciliation",
};

const CONFIGURATION_PROBE_LABELS: Readonly<Record<string, string>> = {
  sql_server: "SQL Server connectivity",
  oidc_authority: "Sign-in authority (OIDC)",
  key_vault: "Secrets store access",
};

const SKIPPED_EXPLANATIONS: Readonly<Record<string, string>> = {
  sql_server:
    "SQL connectivity probe is not required for the current in-memory or demo storage configuration.",
  redis: "Redis is optional; the deployment can use in-memory cache instead.",
  "sql-read-replica": "Read replica is not configured for this deployment.",
  keyvault: "Secrets store is not configured for this environment.",
  vector_store: "Vector search is not enabled for this deployment profile.",
  retrieval_index_freshness: "Search index freshness is not monitored in this configuration.",
  "graph-projection-cache": "Evidence graph cache is not enabled for this deployment.",
  data_archival: "Data retention archival runs only on worker hosts with archival enabled.",
  data_consistency: "Background consistency reconciliation runs only on worker hosts.",
  demo_viewer_data: "Demo workspace seed data is not used in this environment.",
};

export type HealthDisplaySeverity =
  | "healthy"
  | "advisory"
  | "degraded"
  | "failing"
  | "not-configured"
  | "unknown";

export type PresentedReadinessRow = {
  readonly checkId: string;
  readonly label: string;
  readonly displayStatus: string;
  readonly severity: HealthDisplaySeverity;
  readonly explanation: string | null;
  readonly durationMs: number | null;
};

export type PresentedReadinessCategoryGroup = {
  readonly category: HealthReadinessCategory;
  readonly rows: readonly PresentedReadinessRow[];
  readonly aggregateSeverity: HealthDisplaySeverity;
};

export function humanizeHealthCheckId(checkId: string): string {
  const known = READINESS_CHECK_LABELS[checkId] ?? CONFIGURATION_PROBE_LABELS[checkId];

  if (known !== undefined) {
    return known;
  }

  return checkId
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function resolveHealthDisplaySeverity(rawStatus: string): HealthDisplaySeverity {
  const normalized = rawStatus.trim().toLowerCase();

  if (normalized === "healthy" || normalized === "ok" || normalized === "closed") {
    return "healthy";
  }

  if (normalized === "degraded" || normalized === "halfopen" || normalized === "warn" || normalized === "warning") {
    return "degraded";
  }

  if (
    normalized === "skipped"
    || normalized === "not configured"
    || normalized === "not applicable"
    || normalized === "n/a"
  ) {
    return "not-configured";
  }

  if (normalized === "advisory") {
    return "advisory";
  }

  if (
    normalized === "unhealthy"
    || normalized === "open"
    || normalized === "fail"
    || normalized === "failed"
    || normalized === "error"
  ) {
    return "failing";
  }

  if (normalized.length === 0 || normalized === "unknown") {
    return "unknown";
  }

  return "unknown";
}

export function resolveHealthDisplayStatus(rawStatus: string, checkId: string): string {
  const severity = resolveHealthDisplaySeverity(rawStatus);

  if (severity === "not-configured") {
    if (checkId === "redis" || checkId.includes("optional")) {
      return "Not applicable";
    }

    return "Not configured";
  }

  if (severity === "healthy") {
    return "Healthy";
  }

  if (severity === "degraded") {
    return "Degraded";
  }

  if (severity === "failing") {
    return "Failing";
  }

  if (severity === "advisory") {
    return "Advisory";
  }

  const trimmed = rawStatus.trim();

  return trimmed.length > 0 ? trimmed : "Unknown";
}

export function resolveSkippedExplanation(checkId: string, detail: string | null | undefined): string | null {
  const severityHint = detail?.trim();

  if (severityHint !== undefined && severityHint !== null && severityHint.length > 0) {
    return customerSafeDetailText(severityHint);
  }

  const known = SKIPPED_EXPLANATIONS[checkId];

  if (known !== undefined) {
    return known;
  }

  return "This check is not required for the current deployment configuration.";
}

function customerSafeDetailText(detail: string): string {
  return detail
    .replace(/GET\s+\/[^\s]+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function presentReadinessRow(
  checkId: string,
  rawStatus: string,
  durationMs?: number,
  detail?: string | null,
): PresentedReadinessRow {
  const severity = resolveHealthDisplaySeverity(rawStatus);
  const displayStatus = resolveHealthDisplayStatus(rawStatus, checkId);
  const resolvedDuration =
    typeof durationMs === "number" && Number.isFinite(durationMs) ? Math.round(durationMs) : null;

  let explanation: string | null = null;

  if (severity === "not-configured") {
    explanation = resolveSkippedExplanation(checkId, detail);
  } else if (detail !== undefined && detail !== null && detail.trim().length > 0) {
    const safe = customerSafeDetailText(detail);

    if (safe.length > 0) {
      explanation = safe;
    }
  }

  return {
    checkId,
    label: humanizeHealthCheckId(checkId),
    displayStatus,
    severity,
    explanation,
    durationMs: resolvedDuration,
  };
}

function resolveReadinessCategoryId(checkId: string): HealthReadinessCategoryId {
  return READINESS_CHECK_CATEGORY[checkId] ?? "core-application";
}

function worstSeverity(
  left: HealthDisplaySeverity,
  right: HealthDisplaySeverity,
): HealthDisplaySeverity {
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

export function groupReadinessRows(entries: HealthReadyResponse["entries"]): PresentedReadinessCategoryGroup[] {
  const buckets = new Map<HealthReadinessCategoryId, PresentedReadinessRow[]>();

  for (const entry of entries) {
    const categoryId = resolveReadinessCategoryId(entry.name);
    const row = presentReadinessRow(entry.name, entry.status, entry.durationMs);
    const existing = buckets.get(categoryId) ?? [];

    existing.push(row);
    buckets.set(categoryId, existing);
  }

  return HEALTH_READINESS_CATEGORIES.map((category) => {
    const rows = buckets.get(category.id) ?? [];
    const aggregateSeverity = rows.reduce<HealthDisplaySeverity>(
      (current, row) => worstSeverity(current, row.severity),
      "healthy",
    );

    return {
      category,
      rows,
      aggregateSeverity,
    };
  }).filter((group) => group.rows.length > 0);
}

export function presentConfigurationProbeRow(
  name: string,
  rawStatus: string,
  detail?: string | null,
): PresentedReadinessRow {
  return presentReadinessRow(name, rawStatus, undefined, detail);
}

export function resolveOverallHealthHeadline(overallStatus: string): {
  readonly title: string;
  readonly subtitle: string;
} {
  const severity = resolveHealthDisplaySeverity(overallStatus);

  if (severity === "healthy") {
    return {
      title: "All required services are healthy",
      subtitle: "No blocking issues detected for this workspace.",
    };
  }

  if (severity === "degraded") {
    return {
      title: "Some services need attention",
      subtitle: "Review degraded checks below. Core review workflows may still be available.",
    };
  }

  if (severity === "failing") {
    return {
      title: "Service health issues detected",
      subtitle: "One or more required dependencies are unavailable. Resolve blocking items before production use.",
    };
  }

  return {
    title: "Health status is unknown",
    subtitle: "Refresh this page or contact support if the status does not update.",
  };
}

export function aggregateSeverityFromRows(rows: readonly PresentedReadinessRow[]): HealthDisplaySeverity {
  return rows.reduce<HealthDisplaySeverity>(
    (current, row) => worstSeverity(current, row.severity),
    "healthy",
  );
}

export function summarizeTileStatus(severity: HealthDisplaySeverity): string {
  switch (severity) {
    case "healthy":
      return "Healthy";

    case "degraded":
      return "Degraded";

    case "failing":
      return "Unavailable";

    case "advisory":
      return "Advisory";

    case "not-configured":
      return "Not configured";

    case "unknown":
    default:
      return "Unknown";
  }
}
