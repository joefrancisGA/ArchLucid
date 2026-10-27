export function pilotValueReportSeverityCountDisplay(
  value: number | undefined,
  bandLabel: "Critical" | "High" | "Medium" | "Low" | "Info",
): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return `${bandLabel} finding count was not stored.`;
  }

  return String(Math.trunc(value));
}

export function pilotValueReportTotalFindingsDisplay(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Finding count was not stored.";
  }

  return String(Math.trunc(value));
}

export function pilotValueReportSeverityBandCount(value: number | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.trunc(value);
}

export function pilotValueReportMaterialFindingsDisplay(
  critical: number | undefined,
  high: number | undefined,
): string {
  const c = pilotValueReportSeverityBandCount(critical);
  const h = pilotValueReportSeverityBandCount(high);

  if (c === null || h === null) {
    return "Material finding count was not stored.";
  }

  return String(c + h);
}
