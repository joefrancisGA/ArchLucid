import type { SponsorRoiHistoryPoint } from "@/lib/sponsor-roi-query-fetch";

export function finiteSponsorRoiHistoryCount(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.trunc(value));
}

export function sponsorRoiTrendCriticalFindingsDisplay(
  point: Pick<SponsorRoiHistoryPoint, "criticalSecurityFindings">,
): string {
  const count = finiteSponsorRoiHistoryCount(point.criticalSecurityFindings);

  return count === null ? "Not returned" : String(count);
}

export function sponsorRoiTrendCriticalFindingsForScale(
  points: readonly Pick<SponsorRoiHistoryPoint, "criticalSecurityFindings">[],
): number {
  const recorded = points
    .map((point) => finiteSponsorRoiHistoryCount(point.criticalSecurityFindings))
    .filter((value): value is number => value !== null);

  if (recorded.length === 0) {
    return 1;
  }

  return Math.max(1, ...recorded);
}

export function sponsorRoiTrendCriticalBarHeightPx(
  point: Pick<SponsorRoiHistoryPoint, "criticalSecurityFindings">,
  maxCritical: number,
): number {
  const count = finiteSponsorRoiHistoryCount(point.criticalSecurityFindings);

  if (count === null) {
    return 8;
  }

  return Math.max(8, Math.round((count / maxCritical) * 120));
}

/** Simulator-only when both run counts are returned and real is exactly zero with simulator > 0. */
export function isSponsorRoiTrendSimulatorOnlyPeriod(
  point: Pick<SponsorRoiHistoryPoint, "realRunCount" | "simulatorRunCount">,
): boolean {
  const real = finiteSponsorRoiHistoryCount(point.realRunCount);
  const simulator = finiteSponsorRoiHistoryCount(point.simulatorRunCount);

  return real === 0 && simulator !== null && simulator > 0;
}

export function sponsorRoiTrendSimulatorOnlyBadgeLabel(buyerPolished: boolean): string {
  return buyerPolished ? "Rule-based analysis only" : "Simulator runs only";
}

export function buildSponsorRoiTrendCriticalBarAriaLabel(
  point: Pick<
    SponsorRoiHistoryPoint,
    "criticalSecurityFindings" | "realRunCount" | "simulatorRunCount" | "snapshotUtc"
  >,
  monthLabel: string,
  buyerPolished: boolean,
): string {
  const criticalLabel = sponsorRoiTrendCriticalFindingsDisplay(point);

  if (buyerPolished) {
    return `${criticalLabel} critical findings — ${monthLabel}`;
  }

  const real = finiteSponsorRoiHistoryCount(point.realRunCount);
  const simulator = finiteSponsorRoiHistoryCount(point.simulatorRunCount);
  const realLabel = real === null ? "Not returned" : String(real);
  const simulatorLabel = simulator === null ? "Not returned" : String(simulator);

  return `${criticalLabel} critical findings — ${monthLabel} · ${realLabel} Real · ${simulatorLabel} Simulator`;
}
