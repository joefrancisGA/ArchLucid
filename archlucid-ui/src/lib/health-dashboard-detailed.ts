export type HealthDetailedEntry = {
  name: string;
  status: string;
  durationMs?: number;
  description?: string;
  error?: string | null;
  data?: Record<string, unknown> | null;
};

export type HealthDetailedResponse = {
  status: string;
  totalDurationMs?: number;
  version?: string;
  commitSha?: string;
  entries: ReadonlyArray<HealthDetailedEntry>;
};

export type CircuitGateRow = {
  name: string;
  provider?: string;
  role?: string;
  state: string;
  openReason?: string;
  breakDurationSeconds?: number;
  consecutiveFailures?: number;
  failureThreshold?: number;
  halfOpenSuccessThreshold?: number;
  lastStateChangeUtc?: string;
};

export type OperatorTaskSuccessRatesResponse = {
  windowNote: string;
  firstRunCommittedTotal: number;
  firstSessionCompletedTotal: number;
  firstRunCommittedPerSessionRatio: number;
};

export function parseCircuitGatesFromHealthEntry(
  data: Record<string, unknown> | null | undefined,
): CircuitGateRow[] {
  if (data === null || data === undefined) {
    return [];
  }
  const gates = data.gates;
  if (!Array.isArray(gates)) {
    return [];
  }
  const out: CircuitGateRow[] = [];
  for (const g of gates) {
    if (g === null || typeof g !== "object") {
      continue;
    }
    const row = g as Record<string, unknown>;
    const name = typeof row.name === "string" ? row.name : " — ";
    const state = typeof row.state === "string" ? row.state : " — ";
    const breakDurationSeconds =
      typeof row.breakDurationSeconds === "number" && Number.isFinite(row.breakDurationSeconds) ? row.breakDurationSeconds : undefined;
    out.push({
      name,
      provider: typeof row.provider === "string" ? row.provider : undefined,
      role: typeof row.role === "string" ? row.role : undefined,
      state,
      openReason: typeof row.openReason === "string" && row.openReason.length > 0 ? row.openReason : undefined,
      breakDurationSeconds,
      consecutiveFailures: typeof row.consecutiveFailures === "number" && Number.isFinite(row.consecutiveFailures) ? row.consecutiveFailures : undefined,
      failureThreshold: typeof row.failureThreshold === "number" && Number.isFinite(row.failureThreshold) ? row.failureThreshold : undefined,
      halfOpenSuccessThreshold:
        typeof row.halfOpenSuccessThreshold === "number" && Number.isFinite(row.halfOpenSuccessThreshold) ? row.halfOpenSuccessThreshold : undefined,
      lastStateChangeUtc: typeof row.lastStateChangeUtc === "string" ? row.lastStateChangeUtc : undefined,
    });
  }
  return out;
}

export function findCircuitBreakersEntry(entries: ReadonlyArray<HealthDetailedEntry>): HealthDetailedEntry | null {
  for (const e of entries) {
    if (e.name === "circuit_breakers") {
      return e;
    }
  }
  return null;
}
