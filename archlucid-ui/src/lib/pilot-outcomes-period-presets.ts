export type PilotOutcomesPeriodPresetId =
  | "last-30"
  | "last-90"
  | "current-quarter"
  | "previous-quarter"
  | "full-pilot"
  | "custom";

export type PilotOutcomesPeriodPreset = {
  readonly id: PilotOutcomesPeriodPresetId;
  readonly label: string;
};

export const PILOT_OUTCOMES_PERIOD_PRESETS: readonly PilotOutcomesPeriodPreset[] = [
  { id: "last-30", label: "Last 30 days" },
  { id: "last-90", label: "Last 90 days" },
  { id: "current-quarter", label: "Current quarter" },
  { id: "previous-quarter", label: "Previous quarter" },
  { id: "full-pilot", label: "Full pilot" },
  { id: "custom", label: "Custom" },
] as const;

function startOfUtcQuarter(date: Date): Date {
  const month = date.getUTCMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;

  return new Date(Date.UTC(date.getUTCFullYear(), quarterStartMonth, 1, 0, 0, 0, 0));
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** Returns UTC window boundaries as datetime-local control values (exclusive end preserved). */
export function resolvePilotOutcomesPeriodPreset(
  presetId: PilotOutcomesPeriodPresetId,
  now: Date = new Date(),
): { readonly fromUtc: string; readonly toUtc: string } {
  const to = new Date(now);
  const toUtc = toDatetimeLocalValue(to);

  if (presetId === "last-30") {
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - 30);

    return { fromUtc: toDatetimeLocalValue(from), toUtc };
  }

  if (presetId === "last-90") {
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - 90);

    return { fromUtc: toDatetimeLocalValue(from), toUtc };
  }

  if (presetId === "current-quarter") {
    const from = startOfUtcQuarter(now);

    return { fromUtc: toDatetimeLocalValue(from), toUtc };
  }

  if (presetId === "previous-quarter") {
    const currentQuarterStart = startOfUtcQuarter(now);
    const from = new Date(currentQuarterStart);
    from.setUTCMonth(from.getUTCMonth() - 3);
    const toExclusive = currentQuarterStart;

    return { fromUtc: toDatetimeLocalValue(from), toUtc: toDatetimeLocalValue(toExclusive) };
  }

  if (presetId === "full-pilot") {
    const from = new Date(Date.UTC(2020, 0, 1, 0, 0, 0, 0));

    return { fromUtc: toDatetimeLocalValue(from), toUtc };
  }

  return { fromUtc: toUtc, toUtc };
}
