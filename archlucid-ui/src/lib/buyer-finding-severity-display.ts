import { isPhiMinimizationFindingId } from "@/lib/finding-display-from-inspect";

/**
 * Normalizes finding severity labels for buyer-facing surfaces so breadcrumbs, graph panels, and detail cards agree.
 */
export function buyerFindingSeverityDisplayLabel(severityRaw: string | null | undefined, findingId?: string): string {
  const trimmed = (severityRaw ?? "").trim();

  if (isPhiMinimizationFindingId(findingId ?? "")) {
    return "High";
  }

  if (trimmed.length === 0) {
    return "Severity pending";
  }

  const key = trimmed.toLowerCase();

  if (key === "warning" || key === "medium") {
    return "High";
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

  return trimmed;
}
