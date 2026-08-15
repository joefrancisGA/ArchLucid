/** Aggregates sealed finding counts by category from authority run-detail JSON. */
export function aggregateFindingsByCategory(payload: unknown): Record<string, number> {
  const result: Record<string, number> = {};

  if (payload === null || typeof payload !== "object") {
    return result;
  }

  const root = payload as Record<string, unknown>;
  const snapshot = root.findingsSnapshot;

  if (snapshot === null || typeof snapshot !== "object") {
    return result;
  }

  const findings = (snapshot as Record<string, unknown>).findings;

  if (!Array.isArray(findings)) {
    return result;
  }

  for (const item of findings) {
    if (item === null || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const rawCategory = record.category ?? record.findingCategory ?? "Unknown";
    const category = String(rawCategory);

    result[category] = (result[category] ?? 0) + 1;
  }

  return result;
}

export function formatFindingsByCategory(counts: Record<string, number>): string {
  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return "—";
  }

  return entries.map(([category, count]) => `${category}:${count}`).join(", ");
}
