export type PilotOutcomeSummary = {
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  runsInPeriod: number;
  runsWithCommittedManifest: number;
};

/** Trailing 30-day pilot rollup for operator home. */
export async function fetchPilotOutcomeSummary(): Promise<PilotOutcomeSummary> {
  const res = await fetch("/api/proxy/v1/pilots/outcome-summary", {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return (await res.json()) as PilotOutcomeSummary;
}
