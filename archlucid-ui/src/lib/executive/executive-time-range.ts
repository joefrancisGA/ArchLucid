/** Shared executive dashboard/scorecard time windows (TB-269). */

export type ExecutiveTimeRange = "30d" | "quarter" | "year" | "all";

export function rollingBoundsUtc(days: number): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - days);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

export function windowForExecutiveRange(range: ExecutiveTimeRange): { fromUtc: string | null; toUtc: string } {
  const toUtc = new Date().toISOString();

  if (range === "30d") {
    const bounds = rollingBoundsUtc(30);

    return { fromUtc: bounds.fromUtc, toUtc: bounds.toUtc };
  }

  if (range === "quarter") {
    const bounds = rollingBoundsUtc(90);

    return { fromUtc: bounds.fromUtc, toUtc: bounds.toUtc };
  }

  if (range === "year") {
    const bounds = rollingBoundsUtc(365);

    return { fromUtc: bounds.fromUtc, toUtc: bounds.toUtc };
  }

  return { fromUtc: null, toUtc };
}

export function filterHistoryPointsByRange<T extends { snapshotUtc: string }>(
  points: readonly T[],
  range: ExecutiveTimeRange,
): T[] {
  const { fromUtc } = windowForExecutiveRange(range);

  if (fromUtc === null) {
    return [...points];
  }

  const fromMs = Date.parse(fromUtc);

  return points.filter((point) => {
    const snapshotMs = Date.parse(point.snapshotUtc);

    return !Number.isNaN(snapshotMs) && snapshotMs >= fromMs;
  });
}
