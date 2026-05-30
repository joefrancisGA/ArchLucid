import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/** Single calendar day bucket for charting estimated LLM spend (API contract may evolve). */
export type LlmCostDailyBucket = {
  bucketUtc: string;
  estimatedCostUsd: number;
  promptTokens: number;
  completionTokens: number;
};

/** Per workspace / project slice for breakdown table. */
export type LlmCostWorkspaceProjectRow = {
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
  estimatedCostUsd: number;
  promptTokens: number;
  completionTokens: number;
};

export type LlmCostTopRunRow = {
  runId: string;
  estimatedCostUsd: number;
  promptTokens: number;
  completionTokens: number;
  llmCallCount: number;
};

export type LlmCostReportingDashboard = {
  daily: LlmCostDailyBucket[];
  byWorkspaceProject: LlmCostWorkspaceProjectRow[];
  topRuns: LlmCostTopRunRow[];
  /** ISO 4217 code from API; mock uses USD. */
  currency: string;
  /** True when the dedicated reporting endpoint was missing or returned an unusable payload. */
  isMocked: boolean;
};

const REPORT_PATH = "/api/proxy/v1/tenant/llm-cost-reporting?days=30";

/**
 * GET provisional `v1/tenant/llm-cost-reporting` — when not implemented, returns deterministic mock data for UI/dev.
 * Numbers are **estimates** only; reconciliation belongs in billing / cloud cost tools.
 */
export async function fetchLlmCostReportingDashboard(): Promise<LlmCostReportingDashboard> {
  try {
    const res = await fetch(
      REPORT_PATH,
      mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
    );

    if (!res.ok) {
      return buildMockLlmCostReportingDashboard();
    }

    const json: unknown = await res.json();
    const parsed = parseLlmCostReportingDashboardPayload(json);

    if (parsed === null) {
      return buildMockLlmCostReportingDashboard();
    }

    return { ...parsed, isMocked: false };
  } catch {
    return buildMockLlmCostReportingDashboard();
  }
}

/** Deterministic mock: 30-day series + workspace/project rows (same shape as intended API). */
export function buildMockLlmCostReportingDashboard(): LlmCostReportingDashboard {
  const daily: LlmCostDailyBucket[] = [];
  const now = new Date();

  for (let offset = 29; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset));
    const daySeed = d.getUTCFullYear() * 10_000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    const wave = Math.sin(offset / 4.5) * 3.2;
    const estimatedCostUsd = Math.round((12.5 + (daySeed % 41) * 0.62 + wave) * 100) / 100;

    daily.push({
      bucketUtc: d.toISOString(),
      estimatedCostUsd,
      promptTokens: 12_000 + (daySeed % 8000),
      completionTokens: 2800 + (daySeed % 2200),
    });
  }

  const byWorkspaceProject: LlmCostWorkspaceProjectRow[] = [
    {
      workspaceId: "11111111-1111-1111-1111-111111111111",
      workspaceName: "Core workspace",
      projectId: "33333333-3333-3333-3333-333333333333",
      projectName: "Production reviews",
      estimatedCostUsd: 428.9,
      promptTokens: 920_000,
      completionTokens: 198_000,
    },
    {
      workspaceId: "11111111-1111-1111-1111-111111111111",
      workspaceName: "Core workspace",
      projectId: "44444444-4444-4444-4444-444444444444",
      projectName: "Pilot sandboxes",
      estimatedCostUsd: 156.4,
      promptTokens: 310_000,
      completionTokens: 72_000,
    },
    {
      workspaceId: "22222222-2222-2222-2222-222222222222",
      workspaceName: "Secondary region",
      projectId: "55555555-5555-5555-5555-555555555555",
      projectName: "DR analytics",
      estimatedCostUsd: 89.15,
      promptTokens: 185_000,
      completionTokens: 44_000,
    },
  ];

  return { daily, byWorkspaceProject, topRuns: [], currency: "USD", isMocked: true };
}

function parseLlmCostReportingDashboardPayload(json: unknown): LlmCostReportingDashboard | null {
  if (json === null || typeof json !== "object") {
    return null;
  }

  const root = json as Record<string, unknown>;
  const rawDaily = root.daily ?? root.series ?? root.days;
  const rawBreakdown = root.byWorkspaceProject ?? root.breakdown ?? root.rows;

  if (!Array.isArray(rawDaily) || !Array.isArray(rawBreakdown)) {
    return null;
  }

  const currency = typeof root.currency === "string" && root.currency.length > 0 ? root.currency : "USD";
  const daily = rawDaily.map(parseDailyBucket).filter((b): b is LlmCostDailyBucket => b !== null);

  if (daily.length === 0) {
    return null;
  }

  const byWorkspaceProject = rawBreakdown
    .map(parseWorkspaceProjectRow)
    .filter((r): r is LlmCostWorkspaceProjectRow => r !== null);

  const rawTopRuns = root.topRuns ?? root.byRun;
  const topRuns = Array.isArray(rawTopRuns)
    ? rawTopRuns.map(parseTopRunRow).filter((r): r is LlmCostTopRunRow => r !== null)
    : [];

  return { daily, byWorkspaceProject, topRuns, currency, isMocked: false };
}

function parseDailyBucket(entry: unknown): LlmCostDailyBucket | null {
  if (entry === null || typeof entry !== "object") {
    return null;
  }

  const o = entry as Record<string, unknown>;
  const bucketUtc = pickString(o, ["bucketUtc", "dateUtc", "dayUtc", "bucketDate"]);

  if (bucketUtc === null) {
    return null;
  }

  const estimatedCostUsd = pickFiniteNumber(o, ["estimatedCostUsd", "estimatedCost", "costUsd", "usd"]);
  const promptTokens = Math.max(0, Math.round(pickFiniteNumber(o, ["promptTokens", "inputTokens"], 0)));
  const completionTokens = Math.max(0, Math.round(pickFiniteNumber(o, ["completionTokens", "outputTokens"], 0)));

  if (estimatedCostUsd === null || estimatedCostUsd < 0) {
    return null;
  }

  return { bucketUtc, estimatedCostUsd, promptTokens, completionTokens };
}

function parseWorkspaceProjectRow(entry: unknown): LlmCostWorkspaceProjectRow | null {
  if (entry === null || typeof entry !== "object") {
    return null;
  }

  const o = entry as Record<string, unknown>;
  const workspaceId = pickString(o, ["workspaceId", "workspace_id"]);
  const workspaceName = pickString(o, ["workspaceName", "workspace", "workspaceLabel"], "—");
  const projectId = pickString(o, ["projectId", "project_id"]);
  const projectName = pickString(o, ["projectName", "project", "projectLabel"], "—");
  const estimatedCostUsd = pickFiniteNumber(o, ["estimatedCostUsd", "estimatedCost", "costUsd", "usd"]);
  const promptTokens = Math.max(0, Math.round(pickFiniteNumber(o, ["promptTokens", "inputTokens"], 0)));
  const completionTokens = Math.max(0, Math.round(pickFiniteNumber(o, ["completionTokens", "outputTokens"], 0)));

  if (workspaceId === null || projectId === null || estimatedCostUsd === null || estimatedCostUsd < 0) {
    return null;
  }

  return {
    workspaceId,
    workspaceName: workspaceName ?? "—",
    projectId,
    projectName: projectName ?? "—",
    estimatedCostUsd,
    promptTokens,
    completionTokens,
  };
}

function parseTopRunRow(entry: unknown): LlmCostTopRunRow | null {
  if (entry === null || typeof entry !== "object")
    return null;

  const o = entry as Record<string, unknown>;
  const runId = pickString(o, ["runId", "run_id"]);

  if (runId === null)
    return null;

  const estimatedCostUsd = pickFiniteNumber(o, ["estimatedCostUsd", "estimatedCost", "costUsd", "usd"]);
  const promptTokens = Math.max(0, Math.round(pickFiniteNumber(o, ["promptTokens", "inputTokens"], 0)));
  const completionTokens = Math.max(0, Math.round(pickFiniteNumber(o, ["completionTokens", "outputTokens"], 0)));
  const llmCallCount = Math.max(0, Math.round(pickFiniteNumber(o, ["llmCallCount", "callCount"], 0)));

  if (estimatedCostUsd === null || estimatedCostUsd < 0)
    return null;

  return { runId, estimatedCostUsd, promptTokens, completionTokens, llmCallCount };
}

function pickString(
  o: Record<string, unknown>,
  keys: readonly string[],
  fallback?: string,
): string | null {
  for (const key of keys) {
    const v = o[key];

    if (typeof v === "string" && v.trim().length > 0) {
      return v.trim();
    }
  }

  if (fallback !== undefined) {
    return fallback;
  }

  return null;
}

function pickFiniteNumber(
  o: Record<string, unknown>,
  keys: readonly string[],
  defaultValue: number,
): number;
function pickFiniteNumber(
  o: Record<string, unknown>,
  keys: readonly string[],
): number | null;
function pickFiniteNumber(
  o: Record<string, unknown>,
  keys: readonly string[],
  defaultValue?: number,
): number | null {
  for (const key of keys) {
    const v = o[key];

    if (typeof v === "number" && Number.isFinite(v)) {
      return v;
    }
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  return null;
}
