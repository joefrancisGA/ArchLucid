export function parseComplianceDriftActivityCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value));
}

export function formatComplianceDriftActivityCountDisplay(value: number | null): string {
  return value === null ? "Not returned" : String(value);
}
