/**
 * Normalizes finding severity labels for buyer-facing surfaces so breadcrumbs, graph panels, and detail cards agree.
 */
export function buyerFindingSeverityDisplayLabel(severityRaw: string | null | undefined, _findingId?: string): string {
  const trimmed = (severityRaw ?? "").trim();

  if (trimmed.length === 0) {
    return "Severity was not stored.";
  }

  const key = trimmed.toLowerCase();

  if (key === "warning") {
    return "Warning";
  }

  if (key === "medium") {
    return "Medium";
  }

  if (key === "high severity") {
    return "High";
  }

  if (key === "critical") {
    return "Critical";
  }

  if (key === "high") {
    return "High";
  }

  if (key === "low" || key === "info") {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  if (key === "unknown") {
    return "Severity label was not a recognized stored value.";
  }

  return trimmed;
}
