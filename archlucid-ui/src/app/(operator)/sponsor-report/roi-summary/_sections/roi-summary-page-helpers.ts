/** UTC ISO range for the last `days` days ending now (used for ROI rolling window fetches). */
export function rollingBoundsForRoiSummary(days: number): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - days);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}
